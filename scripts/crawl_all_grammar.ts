#!/usr/bin/env node

// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

const slugs = fs.readFileSync('./all_grammar_slugs.txt', 'utf8')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/^grammar:/, ''));

console.log(`Loaded ${slugs.length} grammar slugs to (re)crawl from Bunpro.`);

// TODO: Replace this with your actual Bunpro crawler logic
// For now, we just print the list so you can pipe it into your crawler
console.log('\n--- SLUGS FOR BUNPRO CRAWLER ---');
slugs.forEach(s => console.log(s));
