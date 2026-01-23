#!/usr/bin/env node

// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';

// Placeholder: Replace with your actual Bunpro fetch logic
async function fetchBunproGrammar(slug: string) {
    // TODO: Implement real Bunpro API fetch
    // For now, we’ll read from existing grammar.json to simulate
    const raw = JSON.parse(fs.readFileSync('./data/grammar.json', 'utf8'));
    const item = raw.data.find((g: any) => g.slug === slug);
    if (!item) throw new Error(`Slug ${slug} not found in grammar.json`);
    return item;
}

function analyze(item: any) {
    const out = {
        slug: item.slug,
        rawFields: Object.keys(item),
       可直接映射: {
            knowledge_units: {
                slug: item.slug,
                character: item.title,
                meaning: item.meanings?.[0],
                level: item.level,
            },
            ku_grammar: {
                structure: item.structure,
                details: item.details?.word_type,
                cautions: item.cautions?.map((c: any) => c.text || c).join('\n') || null,
            },
            content_blob: {
                about_description: item.about?.text || item.about?.description,
                cautions: item.cautions,
                fun_facts: item.fun_facts,
                details_expanded: item.details,
                furigana: item.title_with_furigana,
                resources: item.resources,
            },
            examples: item.examples?.map((ex: any) => ({
                text_ja: ex.sentence_text,
                text_en: ex.translation,
                metadata: {
                    audio_url: ex.audio_url,
                    structure: ex.sentence_structure,
                },
            })),
        },
        需要处理: {
            'meaning': '取meanings[0]即可',
            'cautions': '数组需转字符串或存入content_blob',
            'structure': '直接存JSONB',
            'details': '部分字段存details，其余存content_blob.details_expanded',
            'examples': '需先插入sentences表，再关联grammar_sentences',
        },
        不需要: [
            'id', 'site_url', 'last_updated', 'hidden', 'tags',
            'review_stats', 'first_seen', 'reading', 'audio',
        ],
    };
    return out;
}

async function main() {
    const testSlugs = ['する', '各', '見える', '的'];
    for (const slug of testSlugs) {
        console.log(`\n=== ${slug} ===`);
        const item = await fetchBunproGrammar(slug);
        const analysis = analyze(item);
        console.log('可直接映射:', JSON.stringify(analysis.可直接映射, null, 2));
        console.log('需要处理:', analysis.需要处理);
        console.log('不需要:', analysis.不需要);
    }
}

main().catch(console.error);
