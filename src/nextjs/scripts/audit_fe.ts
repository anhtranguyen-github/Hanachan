import { chromium } from 'playwright-core';
import path from 'path';

async function runAudit() {
    const browser = await chromium.connectOverCDP('http://172.29.176.1:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();

    console.log('--- Starting Content Audit ---');

    const KUs = [
        { type: 'radical', slug: 'radical_barb', name: 'Barb' },
        { type: 'kanji', slug: 'kanji_七', name: 'Seven' },
        { type: 'vocabulary', slug: 'vocab_大人', name: 'Adult' },
        { type: 'grammar', slug: 'grammar_たら', name: 'たら' }
    ];

    const results: any[] = [];

    for (const ku of KUs) {
        console.log(`Auditing ${ku.type}: ${ku.name}...`);
        const url = `http://localhost:3000/content/${ku.type === 'vocabulary' ? 'vocabulary' : ku.type === 'radical' ? 'radicals' : ku.type}/${encodeURIComponent(ku.slug)}`;

        await page.goto(url, { waitUntil: 'networkidle' });

        // Check for login redirect
        if (page.url().includes('/login')) {
            console.log('Redirected to login. Attempting login...');
            await page.fill('input[name="email"]', 'test@hanachan.app');
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForNavigation({ waitUntil: 'networkidle' });
            await page.goto(url, { waitUntil: 'networkidle' });
        }

        const content = await page.content();
        const text = await page.innerText('body');

        const audit: any = {
            type: ku.type,
            slug: ku.slug,
            status: 'Success',
            checks: {}
        };

        // Common Checks
        audit.checks.hasTitle = text.toLowerCase().includes(ku.name.toLowerCase()) || text.includes(ku.slug.split('_')[1]);
        audit.checks.hasMnemonic = text.includes('Mnemonic') || text.includes('Strategy') || text.includes('Memory Hook');

        if (ku.type === 'radical') {
            // Check for image or character
            audit.checks.hasDisplay = text.includes('Barb') || content.includes('img');
        }

        if (ku.type === 'kanji') {
            audit.checks.hasOnyomi = text.includes('Onyomi');
            audit.checks.hasKunyomi = text.includes('Kunyomi');
            audit.checks.hasReadings = text.includes('しち') || text.includes('なな');
        }

        if (ku.type === 'vocabulary') {
            audit.checks.hasReading = text.includes('おとな');
            audit.checks.hasSentences = text.includes('Usage Context') || text.includes('Sample');
            audit.checks.hasAudio = content.includes('AudioPlayer') || content.includes('button');
            audit.checks.hasPitch = text.includes('PATTERN') || text.includes('Accent');
        }

        if (ku.type === 'grammar') {
            audit.checks.hasExamples = text.includes('Usage') || text.includes('Example');
            audit.checks.hasExplanation = text.includes('Explanation') || text.includes('Grammar Point');
        }

        console.log(`Results for ${ku.name}:`, audit.checks);
        results.push(audit);

        // Take screenshot
        const screenshotPath = `/home/tra01/.gemini/antigravity/brain/1f773952-8817-4ce7-a16f-a78fff4163e5/audit_v3_${ku.type}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved: ${screenshotPath}`);
    }

    // Check Dashboard
    console.log('Auditing Dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    const dashboardText = await page.innerText('body');
    const dashboardAudit = {
        type: 'dashboard',
        hasReviews: dashboardText.includes('Reviews Due'),
        hasLessons: dashboardText.includes('New Lessons'),
        hasProgress: dashboardText.includes('Progress')
    };
    console.log('Dashboard Results:', dashboardAudit);
    results.push(dashboardAudit);
    await page.screenshot({ path: `/home/tra01/.gemini/antigravity/brain/1f773952-8817-4ce7-a16f-a78fff4163e5/audit_v3_dashboard.png`, fullPage: true });

    console.log('--- Audit Finished ---');
    await browser.close();
}

runAudit().catch(console.error);
