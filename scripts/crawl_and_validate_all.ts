#!/usr/bin/env node

// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';

function crawlAllFromLocal(limit?: number) {
    const raw = JSON.parse(fs.readFileSync('./data/grammar.json', 'utf8'));
    let items = raw.data;
    if (limit) items = items.slice(0, limit);
    const out = items.map(item => ({
        slug: item.slug,
        title: item.title,
        meaning: item.meanings?.[0] || null,
        level: item.level,
        structure: item.structure || { patterns: [] },
        details: item.details?.word_type || null,
        cautions: (item.cautions || []).map((c: any) => c.text || c),
        about: item.about?.text || item.about?.description || null,
        fun_facts: item.fun_facts || [],
        details_expanded: item.details || {},
        furigana: item.title_with_furigana || null,
        resources: item.resources || {},
        examples: (item.examples || []).map((ex: any) => ({
            sentence_text: ex.sentence_text,
            translation: ex.translation,
            audio_url: ex.audio_url,
            sentence_structure: ex.sentence_structure,
        })),
        related: (item.related || []).map((r: any) => ({
            type: r.type,
            title: r.title,
            url: r.url,
            comparison_text: r.comparison_text,
            slug: r.url ? r.url.split('/').pop() : null,
        })),
    }));
    return out;
}

function validate(items: any[]) {
    const report = {
        total: items.length,
        withTitle: 0,
        withMeaning: 0,
        withStructure: 0,
        withCautions: 0,
        withAbout: 0,
        withExamples: 0,
        withRelated: 0,
        totalRelations: 0,
        missingFields: {} as Record<string, number>,
    };
    for (const item of items) {
        if (item.title) report.withTitle++;
        if (item.meaning) report.withMeaning++;
        if (item.structure && (item.structure.patterns?.length || item.structure.variants)) report.withStructure++;
        if (item.cautions?.length) report.withCautions++;
        if (item.about) report.withAbout++;
        if (item.examples?.length) report.withExamples++;
        if (item.related?.length) {
            report.withRelated++;
            report.totalRelations += item.related.length;
        }

        for (const key of ['slug', 'title', 'meaning', 'level', 'structure', 'cautions', 'about', 'examples', 'related']) {
            if (!item[key] || (Array.isArray(item[key]) && item[key].length === 0)) {
                report.missingFields[key] = (report.missingFields[key] || 0) + 1;
            }
        }
    }
    return report;
}

async function main() {
    console.log('=== CRAWLING ALL GRAMMAR (INCLUDING RELATIONS) ===');
    const crawled = crawlAllFromLocal(); // No limit
    fs.writeFileSync('./data/crawled_grammar_all.json', JSON.stringify(crawled, null, 2));
    console.log(`Saved ${crawled.length} items to ./data/crawled_grammar_all.json`);

    console.log('\n=== VALIDATION REPORT ===');
    const report = validate(crawled);
    console.log(`Total items: ${report.total}`);
    console.log(`With title: ${report.withTitle}`);
    console.log(`With meaning: ${report.withMeaning}`);
    console.log(`With structure: ${report.withStructure}`);
    console.log(`With cautions: ${report.withCautions}`);
    console.log(`With about: ${report.withAbout}`);
    console.log(`With examples: ${report.withExamples}`);
    console.log(`With related: ${report.withRelated}`);
    console.log(`Total relations: ${report.totalRelations}`);
    console.log('\nMissing fields:');
    for (const [field, count] of Object.entries(report.missingFields)) {
        console.log(`  ${field}: ${count}`);
    }
}

main().catch(console.error);
