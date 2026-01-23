#!/usr/bin/env node

// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey) as any;

// ---------- CONFIG ----------
const DRY_RUN = false; // Set false to actually write
const TYPE = 'grammar';
// -----------------------------

function canonicalSlug(type: string, baseSlug: string) {
    return `${type}:${baseSlug}`;
}

// ---------- HELPERS ----------
async function loadExistingGrammarKUs() {
    const { data, error } = await supabase
        .from('knowledge_units')
        .select('id, slug, character, meaning, level')
        .eq('type', TYPE);
    if (error) throw error;
    return data || [];
}

async function loadAliases() {
    const { data, error } = await supabase
        .from('ku_slug_aliases')
        .select('type, alias_slug, ku_id')
        .eq('type', TYPE);
    if (error) throw error;
    return data || [];
}

function loadRawGrammar() {
    const raw = JSON.parse(fs.readFileSync('./data/grammar.json', 'utf8'));
    return raw.data || [];
}

// ---------- MAIN ----------
async function main() {
    console.log('=== SAFE GRAMMAR RESEED ===');
    console.log(`DRY_RUN: ${DRY_RUN}\n`);

    const existingKUs = await loadExistingGrammarKUs();
    const aliases = await loadAliases();
    const rawItems = loadRawGrammar();

    console.log(`Existing grammar KUs: ${existingKUs.length}`);
    console.log(`Aliases: ${aliases.length}`);
    console.log(`Raw grammar items: ${rawItems.length}\n`);

    const slugToKU = new Map(existingKUs.map(k => [k.slug, k]));
    const aliasToKU = new Map(aliases.map(a => [a.alias_slug, a.ku_id]));

    const report = {
        reused: 0,
        inserted: 0,
        skippedRawOnly: 0,
        typeConflict: 0,
        needEnrichment: [] as string[],
    };

    for (const raw of rawItems) {
        const baseSlug = raw.slug;
        const canonical = canonicalSlug(TYPE, baseSlug);

        // 1) Resolve existing by canonical slug
        const existing = slugToKU.get(canonical);
        if (existing) {
            report.reused++;
            continue;
        }

        // 2) Resolve via alias
        const aliasKUId = aliasToKU.get(baseSlug);
        if (aliasKUId) {
            report.reused++;
            continue;
        }

        // 3) Type conflict: same baseSlug exists under another type
        const conflictKU = existingKUs.find(k => k.character === raw.title || k.meaning === raw.meaning?.[0]);
        if (conflictKU) {
            console.warn(`TYPE CONFLICT: raw grammar "${baseSlug}" conflicts with existing KU type=${conflictKU.slug.split(':')[0]}`);
            report.typeConflict++;
            continue;
        }

        // 4) Eligibility check (basic heuristics)
        if (!raw.title || !raw.meanings?.length) {
            console.warn(`SKIP RAW-ONLY: "${baseSlug}" lacks title/meanings → not learnable`);
            report.skippedRawOnly++;
            continue;
        }

        // 5) Insert new KU (if not dry-run)
        if (!DRY_RUN) {
            const { data: newKU, error } = await supabase
                .from('knowledge_units')
                .insert({
                    slug: canonical,
                    type: TYPE,
                    level: raw.level || null,
                    character: raw.title || null,
                    meaning: raw.meanings?.[0] || null,
                    search_key: `${raw.title} ${raw.meanings?.join(' ')}`.toLowerCase(),
                })
                .select('id')
                .single();
            if (error) throw error;

            await supabase
                .from('ku_slug_aliases')
                .insert({
                    type: TYPE,
                    alias_slug: baseSlug,
                    ku_id: newKU.id,
                });
        }

        report.inserted++;
        report.needEnrichment.push(canonical);
    }

    // ---------- REPORT ----------
    console.log('\n=== REPORT ===');
    console.log(`Reused existing KUs: ${report.reused}`);
    console.log(`Inserted new KUs: ${report.inserted}`);
    console.log(`Skipped raw-only (not learnable): ${report.skippedRawOnly}`);
    console.log(`Type conflicts (covered by other type): ${report.typeConflict}`);
    console.log(`\nNew KUs that need Bunpro enrichment (${report.needEnrichment.length}):`);
    report.needEnrichment.forEach(s => console.log('  -', s));
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
