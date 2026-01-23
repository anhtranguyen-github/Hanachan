
import { chromium } from '@playwright/test';
import * as fs from 'fs';

async function getUrls() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const results: Record<string, { slug: string, url: string, level: number, title: string }[]> = {};

    const levels = [
        { name: 'N4', base: 10 },
        { name: 'N3', base: 20 },
        { name: 'N2', base: 30 },
        { name: 'N1', base: 40 }
    ];

    for (const level of levels) {
        console.log(`Fetching ${level.name} URLs...`);
        await page.goto(`https://bunpro.jp/jlpt/${level.name.toLowerCase()}`, { waitUntil: 'networkidle' });

        const urls = await page.evaluate((base) => {
            const lessons = Array.from(document.querySelectorAll('.lesson-index__lesson'));
            const data: { slug: string, url: string, level: number, title: string }[] = [];

            lessons.forEach((lesson, idx) => {
                const lessonNum = idx + 1;
                const links = Array.from(lesson.querySelectorAll('a[href*="/grammar_points/"]'));
                links.forEach(a => {
                    const href = a.getAttribute('href') || '';
                    const slug = href.split('/').pop() || '';
                    const title = (a as HTMLElement).innerText.trim();
                    if (slug && !slug.includes('jlpt')) {
                        data.push({
                            slug,
                            url: href.startsWith('http') ? href : `https://bunpro.jp${href}`,
                            level: base + lessonNum,
                            title
                        });
                    }
                });
            });
            return data;
        }, level.base);

        results[level.name] = urls;
        console.log(`Found ${urls.length} for ${level.name}`);
    }

    fs.writeFileSync('./all_grammar_urls.json', JSON.stringify(results, null, 2));
    await browser.close();
    console.log('Finished capturing all URLs.');
}

getUrls();
