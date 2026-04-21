import { test, expect } from '@playwright/test';

test.describe('Horoscope Page (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/horoscope');
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('should render 12 zodiac buttons in grid layout', async ({ page }) => {
    const buttons = page.locator('.zodiac-btn');
    await expect(buttons).toHaveCount(12);
  });

  test('should display zodiac selector with grid', async ({ page }) => {
    const selector = page.locator('.zodiac-selector');
    await expect(selector).toBeInTheDocument();
  });

  test('should highlight first zodiac by default', async ({ page }) => {
    const firstButton = page.locator('.zodiac-btn').first();
    await expect(firstButton).toHaveClass(/active/);
  });

  test('should change selected zodiac when clicking', async ({ page }) => {
    const secondButton = page.locator('.zodiac-btn').nth(1);
    await secondButton.click();
    await expect(secondButton).toHaveClass(/active/);
  });

  test('should render AI analysis button', async ({ page }) => {
    const aiButton = page.locator('.ai-action .btn-primary');
    await expect(aiButton).toBeVisible();
    await expect(aiButton).toContainText('AI运势分析');
  });

  test('should render AI action section', async ({ page }) => {
    const aiAction = page.locator('.ai-action');
    await expect(aiAction).toBeInTheDocument();
  });

  test('should render horoscope content with 4 cards', async ({ page }) => {
    const content = page.locator('.horoscope-content');
    await expect(content).toBeInTheDocument();

    const cards = page.locator('.horoscope-card');
    await expect(cards).toHaveCount(4);
  });

  test('should render lucky info section', async ({ page }) => {
    const luckyInfo = page.locator('.lucky-info');
    await expect(luckyInfo).toBeInTheDocument();
  });

  test('should render page title', async ({ page }) => {
    const title = page.locator('.page-title');
    await expect(title).toContainText('每日运势');
  });

  test('should render all 4 horoscope card types', async ({ page }) => {
    await expect(page.locator('.horoscope-card.overall')).toBeInTheDocument();
    await expect(page.locator('.horoscope-card.love')).toBeInTheDocument();
    await expect(page.locator('.horoscope-card.career')).toBeInTheDocument();
    await expect(page.locator('.horoscope-card.finance')).toBeInTheDocument();
  });

  test('should have correct zodiac grid on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/horoscope');
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('.zodiac-btn');
    await expect(buttons).toHaveCount(12);
  });
});
