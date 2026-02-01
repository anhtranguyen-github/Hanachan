import { test, expect } from '@playwright/test';

test.describe('Hanachan Chat Scenarios', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test_worker_1@hanachan.test');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page.getByTestId('dashboard-root')).toBeVisible({ timeout: 15000 });
    });

    test('Scenario 1: Exact Curriculum Search (木)', async ({ page }) => {
        await page.goto('/immersion/chatbot');
        const input = page.getByTestId('chat-input');

        await input.fill('Chữ Kanji Mộc là gì?');
        await page.getByTestId('chat-send-button').click();

        // Kiểm tra xem có chứa thông tin từ DB không
        const lastMsg = page.getByTestId('chat-message').last();
        await expect(lastMsg).toContainText(/Mộc|Tree|木/i, { timeout: 20000 });

        // Kiểm tra sự xuất hiện của nút CTA (Entity Linking)
        const cta = page.getByTestId('ku-cta-button').first();
        await expect(cta).toBeVisible();
    });

    test('Scenario 2: Out of Curriculum Warning', async ({ page }) => {
        await page.goto('/immersion/chatbot');
        const input = page.getByTestId('chat-input');

        // Một từ khóa chắc chắn không có trong DB mẫu (ví dụ một thuật ngữ kỹ thuật phức tạp)
        await input.fill('Giải thích thuật ngữ Quantum Computing bằng tiếng Nhật');
        await page.getByTestId('chat-send-button').click();

        const lastMsg = page.getByTestId('chat-message').last();
        // Kiểm tra dòng cảnh báo MANDATORY
        await expect(lastMsg).toContainText(/Lưu ý: Kiến thức này hiện nằm ngoài giáo trình/i, { timeout: 20000 });
    });
});
