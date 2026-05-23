import { test, expect } from '@playwright/test';

test.describe('紫微斗数排盘页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ziwei/chart');
    // 关闭免责声明弹窗
    const agreeBtn = page.locator('button:has-text("我已阅读并同意"), button:has-text("I have read and agree")');
    if (await agreeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await agreeBtn.click();
    }
  });

  test('页面加载时显示占位符', async ({ page }) => {
    await expect(page.locator('.chart-placeholder')).toBeVisible();
    await expect(page.locator('.chart-placeholder p')).toContainText('请填写出生信息');
  });

  test('填写出生信息后可以生成命盘', async ({ page }) => {
    // 填写出生年份
    await page.selectOption('#birth-year', '1990');

    // 填写月份
    await page.selectOption('#birth-month', '6');

    // 填写日期
    await page.selectOption('#birth-day', '15');

    // 填写小时
    await page.selectOption('#birth-hour', '10');

    // 填写分钟
    await page.selectOption('#birth-minute', '30');

    // 点击生成按钮
    await page.click('button:has-text("生成命盘")');

    // 等待命盘生成
    await expect(page.locator('.iztro-astrolabe')).toBeVisible({ timeout: 10000 });
  });

  test('桌面端布局正确', async ({ page }) => {
    // 检查 layout 是否有正确的 class
    const layout = page.locator('.layout');
    await expect(layout).toHaveClass(/layout-desktop/);

    // 检查顶部导航是否显示
    await expect(page.locator('.header')).toBeVisible();
  });

  test('命盘生成后可点击AI分析按钮', async ({ page }) => {
    // 填写出生信息
    await page.selectOption('#birth-year', '1990');
    await page.selectOption('#birth-month', '6');
    await page.selectOption('#birth-day', '15');
    await page.selectOption('#birth-hour', '10');
    await page.selectOption('#birth-minute', '30');

    // 生成命盘
    await page.click('button:has-text("生成命盘")');
    await expect(page.locator('.iztro-astrolabe')).toBeVisible({ timeout: 10000 });

    // 检查AI分析按钮是否存在
    await expect(page.locator('button:has-text("AI 命盘分析"), button:has-text("AI Chart Analysis")')).toBeVisible();
  });
});

test.describe('西方星盘页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/astrology/chart');
    // 关闭免责声明弹窗
    const agreeBtn = page.locator('button:has-text("我已阅读并同意"), button:has-text("I have read and agree")');
    if (await agreeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await agreeBtn.click();
    }
  });

  test('页面加载时显示占位符', async ({ page }) => {
    await expect(page.locator('.chart-placeholder')).toBeVisible();
    await expect(page.locator('.chart-placeholder p')).toContainText('请填写出生信息');
  });

  test('填写出生信息后可以生成星盘', async ({ page }) => {
    // 填写出生年份
    await page.selectOption('#birth-year', '1990');

    // 填写月份
    await page.selectOption('#birth-month', '6');

    // 填写日期
    await page.selectOption('#birth-day', '15');

    // 填写小时
    await page.selectOption('#birth-hour', '10');

    // 填写分钟
    await page.selectOption('#birth-minute', '30');

    // 点击生成按钮
    await page.click('button:has-text("生成星盘")');

    // 等待星盘生成
    await expect(page.locator('.astrology-svg')).toBeVisible({ timeout: 10000 });
  });

  test('桌面端布局正确', async ({ page }) => {
    // 检查 layout 是否有正确的 class
    const layout = page.locator('.layout');
    await expect(layout).toHaveClass(/layout-desktop/);

    // 检查顶部导航是否显示
    await expect(page.locator('.header')).toBeVisible();
  });

  test('星盘生成后显示行星列表', async ({ page }) => {
    // 填写出生信息
    await page.selectOption('#birth-year', '1990');
    await page.selectOption('#birth-month', '6');
    await page.selectOption('#birth-day', '15');
    await page.selectOption('#birth-hour', '10');
    await page.selectOption('#birth-minute', '30');

    // 生成星盘
    await page.click('button:has-text("生成星盘")');
    await expect(page.locator('.astrology-svg')).toBeVisible({ timeout: 10000 });

    // 检查行星列表
    await expect(page.locator('.planet-list')).toBeVisible();
    await expect(page.locator('.planet-item').first()).toBeVisible();
  });
});

test.describe('设备类型检测', () => {
  test('桌面端 UA 应该被识别为 desktop', async ({ page }) => {
    await page.goto('/');
    const layout = page.locator('.layout');
    await expect(layout).toHaveClass(/layout-desktop/);
    await expect(layout).not.toHaveClass(/layout-mobile/);
    await expect(layout).not.toHaveClass(/layout-pad/);
  });
});
