
import { createClient } from '@supabase/supabase-js';
import { chromium } from '@playwright/test';
import * as fs from 'fs';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
    const fileContent = JSON.parse(fs.readFileSync('./n5_urls.json', 'utf8'));

    // 1. Identify targets (either missing in KU or missing about_description in ku_grammar)
    const { data: dbData } = await supabase.from('knowledge_units')
        .select('slug, ku_grammar(content_blob, id)')
        .eq('type', 'grammar');

    const dbSlugs = new Map(dbData?.map(item => [item.slug, item.ku_grammar?.[0]?.content_blob?.about_description]));

    // We force re-scrape everything if we want to get relations for ALL items.
    // Since N5 is small (143), let's just do it.
    const targets = fileContent;

    console.log(`Targets for full sync/enrichment (including relations): ${targets.length}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();

    for (const target of targets) {
        console.log(`Processing ${target.slug} (${target.url})...`);
        try {
            await page.goto(target.url, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const data = await page.evaluate(() => {
                const title = document.querySelector('h1')?.innerText || '';
                const meaning = (document.querySelector('.grammar-point__meaning') as HTMLElement)?.innerText || '';
                const about = (document.querySelector('.grammar-point__about-box') as HTMLElement)?.innerText ||
                    (document.querySelector('.about-section') as HTMLElement)?.innerText || '';

                const structureItems = Array.from(document.querySelectorAll('.grammar-point__structure li, .structure-row')).map(el => (el as HTMLElement).innerText);

                const relations: { slug: string, type: string, comparison: string }[] = [];
                const extractFromSection = (headerText: string, type: string) => {
                    const headers = Array.from(document.querySelectorAll('h2, h3, h4'));
                    const header = headers.find(h => h.textContent?.toLowerCase().includes(headerText.toLowerCase()));
                    if (header) {
                        let section = header.parentElement;
                        while (section && !section.querySelector('a[href*="/grammar_points/"]')) {
                            section = section.parentElement;
                            if (section?.tagName === 'BODY') break;
                        }
                        const links = Array.from(section?.querySelectorAll('a[href*="/grammar_points/"]') || []);
                        links.forEach(a => {
                            const href = a.getAttribute('href') || '';
                            const slug = href.split('/').pop() || '';
                            if (slug && !relations.find(r => r.slug === slug)) {
                                relations.push({ slug, type, comparison: '' });
                            }
                        });
                    }
                };

                extractFromSection('Related', 'similar');
                extractFromSection('Synonyms', 'synonym');
                extractFromSection('Antonyms', 'antonym');

                return { title, meaning, about, structureItems, relations };
            });

            // Update Knowledge Unit
            const { data: ku } = await supabase.from('knowledge_units').upsert({
                slug: target.slug,
                type: 'grammar',
                level: target.level,
                character: target.title || data.title.split('|')[0].trim(),
                meaning: data.meaning || target.title,
                search_key: (target.title || data.title).toLowerCase()
            }, { onConflict: 'slug' }).select('id').single();

            if (ku) {
                // Update Grammer details
                await supabase.from('ku_grammar').upsert({
                    ku_id: ku.id,
                    structure: { patterns: data.structureItems },
                    details: 'Grammar',
                    content_blob: {
                        about_description: data.about || 'See Bunpro for more details.',
                        fun_facts: [],
                        scraped_at: new Date().toISOString()
                    }
                }, { onConflict: 'ku_id' });

                // Sync Relations
                for (const rel of data.relations) {
                    // Try to find if the related grammar exists in our KU table
                    const { data: relKu } = await supabase.from('knowledge_units').select('id').eq('slug', rel.slug).single();
                    if (relKu) {
                        await supabase.from('grammar_relations').upsert({
                            grammar_id: ku.id,
                            related_grammar_id: relKu.id,
                            type: rel.type,
                            comparison_note: rel.comparison
                        }, { onConflict: 'grammar_id,related_grammar_id,type' });
                    } else {
                        // console.log(`Related slug ${rel.slug} not found in DB yet.`);
                    }
                }
                console.log(`Success: ${target.slug} (Found ${data.relations.length} relations)`);
            }
        } catch (e) {
            console.error(`Failed ${target.slug}:`, e);
        }
    }

    await browser.close();
    console.log('N5 Sync & Relation Mapping Complete.');
}

sync();
