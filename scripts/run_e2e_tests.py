#!/usr/bin/env python3
"""端到端交互回归（Playwright + 本机 Edge）：验证业务结果，而不只是"页面能渲染"。

    python scripts/run_e2e_tests.py                 # 构建 → 起本地服务 → 跑 E2E
    python scripts/run_e2e_tests.py --skip-build    # 复用已有 dist
    python scripts/run_e2e_tests.py --base-url https://tarot.goodvibez.cn

覆盖场景（AI 接口用 page.route mock，不消耗真实额度）：
  1. 路由与语言切换：导航跳转、中英切换
  2. 塔罗全流程：选 3 牌阵 → 提问 → 抽 3 张 → 结果卡/位置/正逆位 → AI 解读渲染 Markdown 表格与高亮 → 导出 PDF（断言下载文件名 + PDF 文件头）
  3. 紫微斗数：生成命盘 → 12 宫渲染 → AI 解读渲染
  4. 西方星盘：生成星盘 → 行星/ASC/MC 渲染 → AI 解读渲染
  5. 牌库：搜索过滤 + 详情形弹窗开合
  6. 我的：保存/清除 API Key（localStorage）
  7. 导出 PDF 网络卡死：字体请求挂住 → 必须报错可重试，不能永远停在"正在生成 PDF…"
  8. 国产手机 UA：华为/HarmonyOS、荣耀/MagicOS、小米/HyperOS、OPPO/ColorOS、vivo/OriginOS、
     微信内置浏览器 —— 每家跑「首页布局无横向溢出 + 塔罗单牌 → AI 解读 → 导出 PDF 拿到文件或保存入口」

说明：国产机型是用 Chromium 模拟 UA + 视口，能覆盖 UA 分支与各家屏幕宽度，
模拟不出 ArkWeb / 微信 X5 / WKWebView 的内核差异。
报告：logs/e2e-<时间戳>/report.md
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from checklog import new_run_dir
from port_tools import ensure_free

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
TEMP_JS = WEB / ".e2e-tests.mjs"
DOWNLOAD_DIR = ROOT / "logs" / "e2e-downloads"

EDGE_CANDIDATES = [
    Path(os.environ.get("ProgramFiles(x86)", "C:/Program Files (x86)")) / "Microsoft/Edge/Application/msedge.exe",
    Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Microsoft/Edge/Application/msedge.exe",
]

# AI 响应 mock：包含表格与 ==高亮==，用于断言 Markdown 渲染
MOCK_MARKDOWN = (
    "## 综合解读\\n\\n核心牌意：==世界== 表示阶段完成，**月亮（逆位）** 提示信息不透明。\\n\\n"
    "| 牌位 | 牌 | 倾向 |\\n| --- | --- | --- |\\n| 核心 | 世界 | 收尾 |\\n| 障碍 | 月亮 | 不透明 |\\n"
)

# 国产手机 / 国产浏览器的 UA 与视口（Playwright 用 Chromium 模拟：
# 能覆盖「UA 分支 + 各家视口宽度」的差异，但模拟不出 ArkWeb / WKWebView 的引擎差异）。
# 这里挑的是真机常见组合，尤其是内置浏览器下载受限的场景。
UA_PROFILES = [
    {
        "name": "huawei",
        "label": "华为 Mate 60 / HarmonyOS 4（ArkWeb）",
        "ua": "Mozilla/5.0 (Phone; OpenHarmony 4.0) AppleWebKit/537.36 (KHTML, like Gecko) "
              "Chrome/114.0.0.0 Safari/537.36 ArkWeb/4.0.0.0 Mobile",
        "viewport": {"width": 428, "height": 926},
        "dpr": 3,
    },
    {
        "name": "honor",
        "label": "荣耀 Magic6 / MagicOS 8（HonorBrowser）",
        "ua": "Mozilla/5.0 (Linux; U; Android 14; zh-cn; BVL-N49 Build/HONORBVL-N49) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Version/4.0 Chrome/114.0.0.0 HonorBrowser/8.0.1.302 Mobile Safari/537.36",
        "viewport": {"width": 412, "height": 915},
        "dpr": 3,
    },
    {
        "name": "xiaomi",
        "label": "小米 14 / HyperOS（MiuiBrowser）",
        "ua": "Mozilla/5.0 (Linux; U; Android 14; zh-cn; 23127PN0CC Build/UKQ1.230804.001) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Version/4.0 Chrome/119.0.0.0 Mobile Safari/537.36 XiaoMi/MiuiBrowser/18.4.20",
        "viewport": {"width": 393, "height": 873},
        "dpr": 2.75,
    },
    {
        "name": "oppo",
        "label": "OPPO Find X6 / ColorOS 14（HeyTapBrowser）",
        "ua": "Mozilla/5.0 (Linux; U; Android 14; zh-CN; PGZ110 Build/TP1A.220905.001) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Version/4.0 Chrome/114.0.0.0 Mobile Safari/537.36 HeyTapBrowser/10.7.22.1",
        "viewport": {"width": 412, "height": 919},
        "dpr": 3,
    },
    {
        "name": "vivo",
        "label": "vivo X90 / OriginOS 4（vivoBrowser）",
        "ua": "Mozilla/5.0 (Linux; U; Android 14; zh-cn; V2218A Build/TP1A.220624.014) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Version/4.0 Chrome/114.0.0.0 Mobile Safari/537.36 VivoBrowser/16.0.6.0",
        "viewport": {"width": 400, "height": 900},
        "dpr": 3,
    },
    {
        "name": "wechat-android",
        "label": "微信内置浏览器（Android WebView）",
        "ua": "Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230805.001; wv) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Version/4.0 Chrome/119.0.0.0 Mobile Safari/537.36 "
              "MicroMessenger/8.0.44.2480(0x28002C35) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64",
        "viewport": {"width": 393, "height": 851},
        "dpr": 2.75,
    },
]

SCRIPT = """\
import {{ chromium }} from {entry};

const base = {base};
const mockMarkdown = {mock_markdown};
const downloadDir = {download_dir};
const ONLY = {only};
const uaProfiles = {ua_profiles};

const browser = await chromium.launch({{
  channel: {channel},
  executablePath: {edge},
  args: ['--headless=new', '--no-first-run', '--disable-extensions'],
}});
const context = await browser.newContext({{
  viewport: {{ width: 1280, height: 900 }},
  acceptDownloads: true,
}});

// 拦截 AI 接口：不消耗真实额度，返回固定 Markdown
async function mockAI(page) {{
  await page.route('**/chat/completions', (route) => route.fulfill({{
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({{ choices: [{{ finish_reason: 'stop', message: {{ content: mockMarkdown }} }}] }}),
  }}));
}}

async function newPage() {{
  // 每个场景单独 context：避免 localStorage 里的 10s AI 冷却/API Key 串到下一个场景
  const isolated = await browser.newContext({{ viewport: {{ width: 1280, height: 900 }}, acceptDownloads: true }});
  const page = await isolated.newPage();
  await mockAI(page);
  return {{ isolated, page }};
}}

// 国产机型：按各家 UA + 视口建 context（手机视口会走移动端布局）
async function newMobilePage(profile) {{
  const isolated = await browser.newContext({{
    viewport: profile.viewport,
    deviceScaleFactor: profile.dpr,
    isMobile: true,
    hasTouch: true,
    userAgent: profile.ua,
    acceptDownloads: true,
  }});
  const page = await isolated.newPage();
  await mockAI(page);
  return {{ isolated, page }};
}}

async function closeDisclaimer(page) {{
  const modal = page.locator('.disclaimer-modal');
  // 弹窗可能是导航后异步出现的：先给它最多 2s 出现（不然下一个点击会被遮罩挡住 → 30s 超时）
  await modal.first().waitFor({{ state: 'visible', timeout: 2000 }}).catch(() => {{}});
  if (await modal.count() === 0) return;
  const button = page.locator('.disclaimer-modal button.btn-primary').first();
  if (await button.count()) {{
    await button.scrollIntoViewIfNeeded().catch(() => {{}});
    await button.click({{ force: true, timeout: 5000 }}).catch(async () => {{
      // 入场动画期间可能一直判定为不稳定：直接派发事件兜底
      await button.dispatchEvent('click').catch(() => {{}});
    }});
    await modal.first().waitFor({{ state: 'hidden', timeout: 6000 }}).catch(() => {{}});
    await page.waitForTimeout(250);
  }}
}}

// poof 动画会延迟 ~600ms 才跳转/触发，用等待代替固定 sleep
async function clickAnd(page, locator, waitFor, label = '未知点击', attempts = 2) {{
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {{
    try {{
      await locator.waitFor({{ state: 'visible', timeout: 8000 }});
      await locator.scrollIntoViewIfNeeded().catch(() => {{}});
      await locator.click({{ force: true, timeout: 8000 }});
      if (!waitFor) return;
      await waitFor();
      return;
    }} catch (error) {{
      // 每次失败都把 DOM 关键状态带出来：点击超时多半是被弹窗/动画吞掉，没诊断只能靠猜
      lastError = new Error(
        `[${{label}}] ${{(error.message || String(error)).split('\\n')[0]}} | 诊断：${{await diagnose(page)}}`
      );
      await page.waitForTimeout(800); // 再点一次
    }}
  }}
  await locator.screenshot({{ path: 'logs/e2e-failure-last-click.png', timeout: 2000 }}).catch(() => {{}});
  throw lastError;
}}

// 轮询元素数量（失败时带上实际数量，便于定位）
async function waitForCount(page, selector, expected, timeout = 8000) {{
  const deadline = Date.now() + timeout;
  let actual = await page.locator(selector).count();
  while (actual < expected && Date.now() < deadline) {{
    await page.waitForTimeout(150);
    actual = await page.locator(selector).count();
  }}
  if (actual < expected) throw new Error(`${{selector}} 期望 ≥${{expected}} 个，实际 ${{actual}}`);
}}

// 失败时把关键 DOM 状态一起带出来，省去反复试错
async function diagnose(page) {{
  const info = await page.evaluate(() => ({{
    url: location.href,
    navLinks: [...document.querySelectorAll('.nav a')].map((a) => a.textContent.trim()).slice(0, 8),
    navCount: document.querySelectorAll('.nav a').length,
    poofing: document.querySelectorAll('.btn-poof').length,
    deck: document.querySelectorAll('.draw-cards .deck').length,
    drawn: document.querySelectorAll('.drawn-item').length,
    dealingOverlay: document.querySelectorAll('.dealing-overlay').length,
    bodyText: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 160),
  }}));
  return JSON.stringify(info);
}}

const failures = [];
function assert(condition, message) {{
  if (!condition) failures.push(message);
}}

const scenarios = {{
  // 1) 路由 + 语言切换
  'routing-and-i18n': async () => {{
    const {{ isolated, page }} = await newPage();
    await page.goto(base + '/', {{ waitUntil: 'load' }});
    await page.locator('.service-block').first().waitFor({{ timeout: 8000 }});

    // footer 必须带上本次提交的 sha 与提交时间（北京时间）
    const footerText = (await page.locator('.footer').first().innerText()).replace(/\\s+/g, ' ');
    assert(/\\(\\w+\\)\\s·\\s\\d\\d\\d\\d-\\d\\d-\\d\\d \\d\\d:\\d\\d（北京时间）/.test(footerText),
      `footer 应显示 "(sha) · YYYY-MM-DD HH:mm（北京时间）"，实际：${{footerText}}`);

    // 移动端导航也在 DOM 里（desktop 下被 CSS 隐藏），所以限定到桌面 header 的 .nav
    try {{
      await clickAnd(page, page.locator('.nav').getByRole('link', {{ name: '塔罗占卜' }}).first(),
        () => page.waitForURL('**/divination', {{ timeout: 8000 }}), '导航→塔罗占卜');
    }} catch (error) {{
      throw new Error(`${{error.message.split('\\n')[0]}} | 诊断：${{await diagnose(page)}}`);
    }}
    assert(new URL(page.url()).pathname === '/divination', `导航后路径应为 /divination，实际 ${{page.url()}}`);
    // 塔罗页会弹出免责声明，不关掉会盖住顶部导航
    await closeDisclaimer(page);

    await clickAnd(page, page.locator('.nav').getByRole('link', {{ name: '塔罗牌库' }}).first(),
      () => page.waitForURL('**/cards', {{ timeout: 8000 }}), '导航→塔罗牌库');
    assert(new URL(page.url()).pathname === '/cards', `导航后路径应为 /cards，实际 ${{page.url()}}`);
    await closeDisclaimer(page);

    await clickAnd(page, page.locator('button.language-toggle').first(),
      () => page.getByText('Cards', {{ exact: true }}).first().waitFor({{ timeout: 5000 }}), '切换语言');
    const navText = await page.locator('.nav, .mobile-nav').first().innerText();
    assert(navText.includes('Home') || navText.includes('Cards'), `切换语言后导航应变为英文，实际：${{navText.slice(0, 60)}}`);
    await isolated.close();
  }},

  // 2) 塔罗完整流程 + 导出 PDF
  'tarot-full-flow': async () => {{
    const {{ isolated, page }} = await newPage();
    await page.goto(base + '/divination', {{ waitUntil: 'load' }});
    await page.getByText('选择牌阵').first().waitFor({{ timeout: 8000 }});
    await closeDisclaimer(page);

    await clickAnd(page, page.getByText('三牌阵').first());
    await clickAnd(page, page.getByRole('button', {{ name: /选择此牌阵/ }}).first(),
      () => page.locator('.question-textarea').waitFor({{ timeout: 6000 }}));
    await page.locator('.question-textarea').fill('E2E 自动化测试问题');
    await clickAnd(page, page.getByRole('button', {{ name: /开始抽牌/ }}).first());
    await page.getByText('点击卡牌抽取').waitFor({{ timeout: 6000 }});

    for (let i = 0; i < 3; i += 1) {{
      await page.locator('.draw-cards .deck').click({{ force: true }});
      try {{
        if (i < 2) {{
          await waitForCount(page, '.drawn-item', i + 1, 6000);
        }} else {{
          // 抽满最后一张后会切到结果页，抽牌列表随之卸载
          await page.getByText('占卜结果').first().waitFor({{ timeout: 6000 }});
        }}
      }} catch (error) {{
        throw new Error(`第 ${{i + 1}} 次抽牌：${{error.message}} | 诊断：${{await diagnose(page)}}`);
      }}
    }}
    await page.getByText('占卜结果').waitFor({{ timeout: 6000 }});

    const cards = await page.locator('.result-card').count();
    assert(cards === 3, `三牌阵应出 3 张结果卡，实际 ${{cards}}`);
    const positions = await page.locator('.result-card h4').allInnerTexts();
    assert(['过去', '现在', '未来'].every((name) => positions.some((text) => text.includes(name))),
      `结果卡位置应包含过去/现在/未来，实际 ${{positions.join(',')}}`);
    const tags = await page.locator('.card-position-type').count();
    assert(tags === 3, `每张牌应有正/逆位标记，实际 ${{tags}}`);

    await clickAnd(page, page.getByRole('button', {{ name: /AI深度解读/ }}).first());
    await page.locator('#divination-ai-result table').first().waitFor({{ timeout: 8000 }});
    const markCount = await page.locator('#divination-ai-result mark').count();
    assert(markCount >= 1, `==高亮== 应渲染成 <mark>，实际 ${{markCount}} 个`);
    const tableRows = await page.locator('#divination-ai-result table tr').count();
    assert(tableRows >= 3, `Markdown 表格应渲染表头+2 行，实际 ${{tableRows}} 行`);

    const [download] = await Promise.all([
      page.waitForEvent('download', {{ timeout: 20000 }}),
      page.getByRole('button', {{ name: /导出 PDF/ }}).first().click({{ force: true }}),
    ]);
    const filename = download.suggestedFilename();
    assert(filename.endsWith('.pdf'), `导出文件名应以 .pdf 结尾，实际 ${{filename}}`);
    const saved = `${{downloadDir}}/${{filename}}`;
    await download.saveAs(saved);
    const {{ readFileSync }} = await import('node:fs');
    const head = readFileSync(saved).subarray(0, 5).toString('utf8');
    assert(head.startsWith('%PDF'), `导出文件应为 PDF（头部 %PDF），实际 "${{head}}"`);
    // 字体必须真的内嵌（pdfmake 用的是 woff2 源文件，得确认 fontkit 解压 + 子集化成功）
    const pdfBody = readFileSync(saved).toString('latin1');
    assert(/\\/FontFile2|\\/FontFile3/.test(pdfBody), 'PDF 应内嵌字体程序（/FontFile），否则中文会缺字');
    // 真机（iOS Safari / 内置浏览器）靠这个手工入口保存，必须存在且是指向 blob 的下载链接
    const manualSave = page.locator('[data-testid="pdf-ready-download"] a[download]');
    assert(await manualSave.count() === 1, '导出完成后应给出手工保存链接（真机兜底）');
    const manualHref = await manualSave.getAttribute('href');
    assert((manualHref || '').startsWith('blob:'), `手工保存链接应指向 blob，实际 ${{manualHref}}`);
    await isolated.close();
  }},

  // 3) 紫微斗数：12 宫 + AI 解读
  'ziwei-flow': async () => {{
    const {{ isolated, page }} = await newPage();
    await page.goto(base + '/ziwei/chart', {{ waitUntil: 'load' }});
    await page.getByText('出生信息').first().waitFor({{ timeout: 8000 }});
    await closeDisclaimer(page);
    await page.selectOption('#birth-year', '1990').catch(() => {{}});
    await clickAnd(page, page.getByRole('button', {{ name: /生成命盘|生成/ }}).first());
    await page.locator('.iztro-astrolabe').first().waitFor({{ timeout: 12000 }});

    const palaces = await page.locator('.iztro-palace').count();
    assert(palaces === 12, `命盘应有 12 宫，实际 ${{palaces}}`);

    await clickAnd(page, page.getByRole('button', {{ name: /AI 命盘分析/ }}).first());
    await page.locator('.ziwei-ai-section table').first().waitFor({{ timeout: 8000 }});
    await isolated.close();
  }},

  // 4) 西方星盘：行星/ASC/MC + AI 解读
  'astrology-flow': async () => {{
    const {{ isolated, page }} = await newPage();
    await page.goto(base + '/astrology/chart', {{ waitUntil: 'load' }});
    await page.getByText('出生信息').first().waitFor({{ timeout: 8000 }});
    await closeDisclaimer(page);

    // 出生地：省市两级弹窗（数据来自 /china-geo.json）
    await clickAnd(page, page.locator('.birthplace-trigger').first());
    await page.locator('.city-picker').waitFor({{ timeout: 8000 }});
    await page.locator('.city-picker-provinces .city-picker-option').first().waitFor({{ timeout: 8000 }});
    const provinceCount = await page.locator('.city-picker-provinces .city-picker-option').count();
    assert(provinceCount >= 30, `省份列表应 ≥30 项，实际 ${{provinceCount}}`);
    await page.locator('.city-picker-provinces .city-picker-option', {{ hasText: '广东省' }}).first().click({{ force: true }});
    await page.locator('.city-picker-cities .city-picker-option', {{ hasText: '深圳市' }}).first().waitFor({{ timeout: 5000 }});
    await page.locator('.city-picker-cities .city-picker-option', {{ hasText: '深圳市' }}).first().click({{ force: true }});
    await page.locator('.city-picker').first().waitFor({{ state: 'hidden', timeout: 5000 }});
    const triggerText = await page.locator('.birthplace-trigger').first().innerText();
    assert(triggerText.includes('深圳市'), `选择后出生地应显示深圳市，实际：${{triggerText.replace(/\\s+/g, ' ')}}`);

    await page.selectOption('#birth-year', '1990').catch(() => {{}});
    await clickAnd(page, page.getByRole('button', {{ name: /生成星盘|生成/ }}).first());
    await page.locator('.astrology-svg').first().waitFor({{ timeout: 12000 }});

    const circles = await page.locator('.astrology-svg circle').count();
    assert(circles >= 10, `星盘应画出 ≥10 个行星点，实际 ${{circles}}`);
    // SVG 节点没有 innerText，用 textContent
    const svgText = await page.locator('.astrology-svg').first().evaluate((element) => element.textContent || '');
    assert(/ASC|MC/.test(svgText), '星盘上应标注 ASC/MC');

    await clickAnd(page, page.getByRole('button', {{ name: /AI 星盘分析/ }}).first());
    await page.locator('#astrology-ai-result table').first().waitFor({{ timeout: 8000 }});
    await isolated.close();
  }},

  // 5) 牌库：搜索过滤 + 弹窗
  'cards-search-and-modal': async () => {{
    const {{ isolated, page }} = await newPage();
    await page.goto(base + '/cards', {{ waitUntil: 'load' }});
    await page.locator('.cards-grid .tarot-card').first().waitFor({{ timeout: 8000 }});
    const total = await page.locator('.cards-grid .tarot-card').count();

    await page.getByPlaceholder(/搜索塔罗牌/).fill('世界');
    await page.waitForTimeout(500);
    const filtered = await page.locator('.cards-grid .tarot-card').count();
    assert(filtered > 0 && filtered < total, `搜索"世界"应过滤结果（${{filtered}}/${{total}}）`);

    await page.locator('.cards-grid .tarot-card').first().click({{ force: true }});
    await page.locator('.card-modal').first().waitFor({{ timeout: 5000 }});
    assert(await page.getByText('关键词').count() > 0, '详情弹窗应显示关键词');
    await page.locator('.card-modal button.btn-secondary').first().click({{ force: true }});
    let closed = true;
    await page.locator('.card-modal').first().waitFor({{ state: 'hidden', timeout: 5000 }}).catch(() => {{ closed = false; }});
    assert(closed, '点击关闭后弹窗应消失');
    await isolated.close();
  }},

  // 6) 我的：API Key 保存/清除
  'profile-api-key': async () => {{
    const {{ isolated, page }} = await newPage();
    await page.goto(base + '/profile', {{ waitUntil: 'load' }});
    const input = page.getByPlaceholder(/输入 DeepSeek API Key/).first();
    await input.waitFor({{ timeout: 5000 }});

    await input.fill('sk-e2e-test-key-000000000000');
    await page.getByRole('button', {{ name: '保存' }}).first().click({{ force: true }});
    await page.waitForTimeout(300);
    const saved = await page.evaluate(() => localStorage.getItem('deepseek_api_key'));
    assert(saved === 'sk-e2e-test-key-000000000000', `API Key 应写入 localStorage，实际 ${{saved}}`);

    await page.getByRole('button', {{ name: '清除' }}).first().click({{ force: true }});
    await page.waitForTimeout(300);
    const cleared = await page.evaluate(() => localStorage.getItem('deepseek_api_key'));
    assert(cleared === null, `清除后 localStorage 应为空，实际 ${{cleared}}`);
    await isolated.close();
  }},

  // 7) 导出 PDF 时网络卡死：必须报错 + 可重试，不能永远停在"正在生成 PDF…"
  //    （真机现象：GitHub Pages 在国内偶发"连上但不回包"，字体请求一直挂着）
  'pdf-export-stall': async () => {{
    const {{ isolated, page }} = await newPage();
    // 字体请求永远不回包（模拟国内访问 GitHub Pages 卡住）——必须在页面加载前挂上路由，
    // 否则 AI 结果页的后台预下载会先发出去，拦不住
    let stalled = true;
    await page.route('**/fonts/*.woff2', (route) => {{
      if (stalled) return; // 既不 fulfill 也不 abort：请求一直挂着
      return route.continue();
    }});
    // 字体被挂住时 load 永远不会触发（index.html preload 了字体），只等 DOM
    await page.goto(base + '/divination', {{ waitUntil: 'domcontentloaded' }});
    await page.getByText('选择牌阵').first().waitFor({{ timeout: 8000 }});
    await closeDisclaimer(page);

    await clickAnd(page, page.getByText('单牌阵').first(), null, '选单牌阵');
    await clickAnd(page, page.getByRole('button', {{ name: /选择此牌阵/ }}).first(),
      () => page.locator('.question-textarea').waitFor({{ timeout: 6000 }}), '进入提问');
    await page.locator('.question-textarea').fill('导出卡死回归');
    await clickAnd(page, page.getByRole('button', {{ name: /开始抽牌/ }}).first(),
      () => page.getByText('点击卡牌抽取').waitFor({{ timeout: 8000 }}), '开始抽牌');
    await page.locator('.draw-cards .deck').first().click({{ force: true }});
    await page.getByText('占卜结果').first().waitFor({{ timeout: 12000 }});
    await clickAnd(page, page.getByRole('button', {{ name: /AI深度解读/ }}).first(),
      () => page.locator('#divination-ai-result').waitFor({{ timeout: 12000 }}), '生成 AI 解读');

    await clickAnd(page, page.getByRole('button', {{ name: /导出 PDF/ }}).first(), null, '导出 PDF');
    await page.locator('[data-testid="pdf-working"]').waitFor({{ timeout: 5000 }});
    assert(await page.locator('[data-testid="pdf-working"]').isVisible(), '点击后应显示生成中状态');

    // 20s 字体超时后必须落到错误态（超时不重试，避免用户白等第二轮的 20s）
    const alert = page.locator('.pdf-export-error');
    await alert.waitFor({{ timeout: 28000 }});
    const text = await alert.innerText();
    assert(/超时|失败/.test(text), `错误信息应说明原因，实际：${{text}}`);
    assert(await page.getByRole('button', {{ name: /重试导出 PDF/ }}).count() === 1, '应给出重试按钮');

    // 网络恢复后重试要能成功
    stalled = false;
    const downloadPromise = page.waitForEvent('download', {{ timeout: 30000 }}).catch(() => null);
    await page.getByRole('button', {{ name: /重试导出 PDF/ }}).first().click({{ force: true }});
    await page.waitForFunction(() => document.querySelector('[data-testid^="pdf-ready"]') !== null, {{ timeout: 30000 }});
    const retryDownload = await Promise.race([downloadPromise, page.waitForTimeout(1500).then(() => null)]);
    const manual = await page.locator('[data-testid="pdf-ready-download"] a[download]').count();
    const share = await page.locator('[data-testid="pdf-ready-share"] button').count();
    assert(retryDownload || manual === 1 || share === 1, '重试后应能拿到 PDF 或保存入口');
    await isolated.close();
  }},
}};

const results = [];
// 国产手机 UA 场景：每个机型跑「首页布局 + 塔罗单牌 → AI 解读 → 导出 PDF」。
// 这些机型多数是 Chromium 内核，但 UA 分支（isIosDevice/canSharePdf）与视口宽度各家不同，
// 内置浏览器又常拦下载 —— 所以导出必须验到「拿到 PDF」或「拿到手工保存入口」。
function uaScenario(profile) {{
  return async () => {{
    const {{ isolated, page }} = await newMobilePage(profile);
    const errors = [];
    page.on('pageerror', (error) => errors.push(`页面异常：${{String(error.message).slice(0, 160)}}`));
    page.on('console', (msg) => {{
      // 静态托管下 SPA 路由的 404 回落是预期噪音
      if (msg.type() === 'error' && !/Failed to load resource/.test(msg.text())) {{
        errors.push(`控制台：${{msg.text().slice(0, 160)}}`);
      }}
    }});

    await page.goto(base + '/', {{ waitUntil: 'load' }});
    await page.locator('.service-block').first().waitFor({{ timeout: 12000 }});
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 4, `首页横向溢出 ${{overflow}}px`);

    await page.goto(base + '/divination', {{ waitUntil: 'load' }});
    await page.getByText('选择牌阵').first().waitFor({{ timeout: 15000 }});
    await closeDisclaimer(page);
    await clickAnd(page, page.getByText('单牌阵').first(), null, '选单牌阵');
    await clickAnd(
      page,
      page.getByRole('button', {{ name: /选择此牌阵/ }}).first(),
      () => page.locator('.question-textarea').waitFor({{ timeout: 6000 }}),
      '进入提问'
    );
    await page.locator('.question-textarea').fill('国产机型 UA 导出测试');
    await clickAnd(
      page,
      page.getByRole('button', {{ name: /开始抽牌/ }}).first(),
      () => page.getByText('点击卡牌抽取').waitFor({{ timeout: 8000 }}),
      '开始抽牌'
    );
    await page.locator('.draw-cards .deck').first().click({{ force: true }});
    await page.getByText('占卜结果').first().waitFor({{ timeout: 15000 }});
    await clickAnd(
      page,
      page.getByRole('button', {{ name: /AI深度解读/ }}).first(),
      () => page.locator('#divination-ai-result').waitFor({{ timeout: 15000 }}),
      '生成 AI 解读'
    );

    const downloadPromise = page.waitForEvent('download', {{ timeout: 25000 }}).catch(() => null);
    await clickAnd(page, page.getByRole('button', {{ name: /导出 PDF/ }}).first(), null, '导出 PDF');
    await page.waitForFunction(
      () => document.querySelector('[data-testid^="pdf-ready"]') !== null,
      {{ timeout: 25000 }},
    );
    const download = await Promise.race([downloadPromise, page.waitForTimeout(1200).then(() => null)]);
    const manual = await page.locator('[data-testid="pdf-ready-download"] a[download]').count();
    const share = await page.locator('[data-testid="pdf-ready-share"] button').count();
    assert(download || manual === 1 || share === 1, '导出后既没有下载事件，也没有保存/分享入口');
    if (download) {{
      assert(download.suggestedFilename().endsWith('.pdf'), `导出文件名应以 .pdf 结尾，实际 ${{download.suggestedFilename()}}`);
    }}
    console.log(
      `    导出路径：${{download ? `下载 ${{download.suggestedFilename()}}` : share ? '系统分享面板' : '手工保存链接'}}`
      + `（手工链接 ${{manual}} 个）`
    );

    assert(errors.length === 0, errors[0] || '');
    await isolated.close();
  }};
}}
for (const profile of uaProfiles) {{
  scenarios[`ua-${{profile.name}}`] = uaScenario(profile);
}}

const selected = Object.entries(scenarios).filter(([name]) => ONLY.length === 0 || ONLY.includes(name));
for (const [name, run] of selected) {{
  // UI 有 600ms 动画与懒加载，允许重试一次；重试成功会在报告里标注（暴露偶发性）
  let attempts = 0;
  let firstFailure = [];
  let problems = [];
  while (attempts < 2) {{
    attempts += 1;
    failures.length = 0;
    try {{
      await run();
    }} catch (error) {{
      failures.push(`执行异常：${{error.message.split('\\n')[0]}}`);
    }}
    problems = [...failures];
    if (problems.length === 0) break;
    if (attempts === 1) {{
      firstFailure = [...problems];
      console.log(`RETRY ${{name}}（首次失败：${{firstFailure[0]}}）`);
    }}
  }}
  const ok = problems.length === 0;
  results.push({{
    name,
    ok,
    attempts,
    problems: ok && attempts > 1 ? firstFailure.map((text) => `首次失败后重试通过：${{text}}`) : problems,
  }});
  console.log(`${{ok ? 'PASS' : 'FAIL'}} ${{name}}${{attempts > 1 && ok ? '（重试后通过）' : ''}}`);
  if (!ok) problems.forEach((text) => console.log(`    ${{text}}`));
}}

await browser.close();
console.log(`__RESULT__${{JSON.stringify(results)}}`);
"""


def resolve(name: str) -> str:
    path = shutil.which(name)
    if not path:
        sys.exit(f"[e2e] 找不到可执行文件: {name}")
    return path


def browser_config() -> tuple[str, str, str]:
    candidates = sorted((WEB / "node_modules" / ".pnpm").glob("playwright-core@*/node_modules/playwright-core/index.mjs"))
    direct = WEB / "node_modules" / "playwright-core" / "index.mjs"
    if direct.exists():
        candidates.append(direct)
    if not candidates:
        sys.exit("[e2e] 找不到 playwright-core，请先 pnpm --dir web add -D playwright-core")
    for edge in EDGE_CANDIDATES:
        if edge.exists():
            return candidates[-1].as_uri(), edge.as_posix(), '"msedge"'
    return candidates[-1].as_uri(), "", "undefined"


def wait_for_server(url: str, timeout: float = 30.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status < 500:
                    return True
        except (urllib.error.URLError, OSError):
            time.sleep(0.4)
    return False


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="E2E 交互回归")
    parser.add_argument("--port", type=int, default=4000)
    parser.add_argument("--base-url", default=None)
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--allow-skip", action="store_true")
    parser.add_argument("--only", action="append", default=[], metavar="SCENARIO", help="只跑指定场景（可重复，调试用）")
    args = parser.parse_args(argv or [])

    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    base = args.base_url
    server = None

    if not base:
        if not args.skip_build:
            print("[e2e] 构建产物（vite build）…")
            build = subprocess.run(
                [resolve("npx"), "vite", "build"], cwd=WEB, text=True, encoding="utf-8",
                errors="replace", stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            )
            if build.returncode != 0:
                print(build.stdout[-1200:])
                return build.returncode

        ok, lines = ensure_free(args.port)
        for line in lines:
            print(f"[e2e] {line}")
        if not ok:
            return 1
        base = f"http://localhost:{args.port}"
        server = subprocess.Popen(
            [sys.executable, str(ROOT / "scripts" / "serve_dist.py"), "--port", str(args.port)],
            cwd=ROOT, text=True, encoding="utf-8", errors="replace",
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        if not wait_for_server(base + "/"):
            server.terminate()
            sys.exit("[e2e] 本地服务未就绪")

    try:
        entry, edge, channel = browser_config()
    except SystemExit as error:
        if args.allow_skip:
            print(f"[e2e] 跳过：{error}")
            if server:
                server.terminate()
            return 0
        raise

    TEMP_JS.write_text(
        SCRIPT.format(
            entry=f"'{entry}'",
            edge=f"'{edge}'" if edge else "undefined",
            channel=channel,
            base=f"'{base}'",
            mock_markdown=f"'{MOCK_MARKDOWN}'",
            download_dir=f"'{DOWNLOAD_DIR.as_posix()}'",
            only=json.dumps(args.only, ensure_ascii=False),
            ua_profiles=json.dumps(UA_PROFILES, ensure_ascii=False),
        ),
        encoding="utf-8",
    )
    try:
        proc = subprocess.run(
            [resolve("node"), TEMP_JS.name], cwd=WEB, text=True, encoding="utf-8",
            errors="replace", env={**os.environ}, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        )
    finally:
        TEMP_JS.unlink(missing_ok=True)
        if server:
            server.terminate()
            try:
                server.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server.kill()

    output = proc.stdout or ""
    payload = next((line for line in output.splitlines() if line.startswith("__RESULT__")), None)
    results = json.loads(payload.replace("__RESULT__", "")) if payload else []
    print("\n".join(line for line in output.splitlines() if not line.startswith("__RESULT__")))

    log_dir = new_run_dir("e2e")
    report = log_dir / "report.md"
    report_lines = ["# E2E 交互回归", ""]
    for item in results:
        report_lines.append(f"## {'PASS' if item['ok'] else 'FAIL'} {item['name']}")
        report_lines += [f"- {text}" for text in item["problems"]] or ["- 无问题"]
        report_lines.append("")
    report.write_text("\n".join(report_lines), encoding="utf-8")

    passed = sum(1 for item in results if item["ok"])
    print(f"\n================ E2E 交互回归 {passed}/{len(results)} 通过 ================")
    print(f"报告：{report.relative_to(ROOT)}    导出文件：{DOWNLOAD_DIR.relative_to(ROOT)}")
    return 0 if results and passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
