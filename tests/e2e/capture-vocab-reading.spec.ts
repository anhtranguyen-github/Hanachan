import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('capture vocab reading review', async ({ page }) => {
    const screenshotDir = path.resolve(process.cwd(), 'screenshots/demo-ui');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // 1. Initial State
    await page.goto('http://localhost:3000/demo-v2/review/vocab-reading');
    await page.waitForTimeout(1000); // Wait for animations
    await page.screenshot({ path: path.join(screenshotDir, 'vocab-reading-initial.png') });

    // 2. Correct State
    await page.fill('input[type="text"]', 'oyogu');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000); // Wait for feedback animation
    await page.screenshot({ path: path.join(screenshotDir, 'vocab-reading-correct.png') });

    console.log('Screenshots saved to screenshots/demo-ui/');
});
