#!/usr/bin/env python3
"""移动端视觉回归：对每个页面在手机视口下做「能渲染 + 有尺寸 + 无报错 + 不横向溢出」检查，并截图存档。

    python scripts/run_visual_tests.py                 # 构建 → 起本地服务 → 逐页检查
    python scripts/run_visual_tests.py --skip-build    # 复用已有 dist
    python scripts/run_visual_tests.py --base-url https://tarot.goodvibez.cn   # 直接测线上

截图：design/preview-shots/mobile/<页面>.png
报告：logs/visual-<时间戳>/report.md
浏览器：优先本机 Edge（Windows），否则回退 Playwright 自带 Chromium。
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
SHOTS = ROOT / "design" / "preview-shots" / "mobile"
TEMP_JS = WEB / ".visual-tests.mjs"

EDGE_CANDIDATES = [
    Path(os.environ.get("ProgramFiles(x86)", "C:/Program Files (x86)")) / "Microsoft/Edge/Application/msedge.exe",
    Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Microsoft/Edge/Application/msedge.exe",
]

# 每个页面：路径、交互步骤、必须存在的元素（选择器 + 最小宽度/数量）
PAGES = [
    {
        "name": "home",
        "path": "/",
        "steps": [],
        "asserts": [{"selector": ".service-block", "minCount": 3}],
    },
    {
        "name": "divination",
        "path": "/divination",
        "steps": ["closeDisclaimer", "pickSpread", "askQuestion", "drawOne", "waitResult"],
        "asserts": [{"selector": ".result-card", "minCount": 1}],
    },
    {
        "name": "cards",
        "path": "/cards",
        "steps": [],
        "asserts": [{"selector": ".cards-grid .tarot-card", "minCount": 8}],
    },
    {
        "name": "ziwei",
        "path": "/ziwei/chart",
        "steps": ["closeDisclaimer", "touchForm", "generateChart"],
        "asserts": [
            {"selector": ".ziwei-chart-section .chart-container", "minWidth": 300},
            # 命盘是固定版式：必须按可读宽度渲染（横向可滚动），而不是被压扁
            {"selector": ".ziwei-chart-section .chart-container", "minScrollWidth": 540, "scrollAxis": "x"},
            # 容器高度必须跟得上内容，否则整块命盘被竖向裁掉
            {"selector": ".ziwei-chart-section .chart-container", "noVerticalClip": True},
            # 星曜字号下限（本次修复前是 7px）
            {"selector": ".iztro-star", "minFontSize": 9},
        ],
    },
    {
        "name": "astrology",
        "path": "/astrology/chart",
        "steps": ["closeDisclaimer", "touchForm", "generateChart"],
        "asserts": [
            {"selector": ".astrology-svg", "minWidth": 240},
            {"selector": ".astrology-svg text", "minCount": 20},
            {"selector": ".planet-sign", "minFontSize": 11},
        ],
    },
    {
        # 单独一页：打开出生地省市弹窗，用于人工验收弹窗版式
        "name": "astrology-picker",
        "path": "/astrology/chart",
        "steps": ["closeDisclaimer", "openCityPicker"],
        "asserts": [
            {"selector": ".city-picker .city-picker-option", "minCount": 30},
            {"selector": ".city-picker-option", "minFontSize": 12},
        ],
    },
    {
        "name": "statistics",
        "path": "/statistics",
        "steps": [],
        "asserts": [{"selector": ".statistics", "minCount": 1}],
    },
    {
        "name": "profile",
        "path": "/profile",
        "steps": [],
        "asserts": [{"selector": "input[placeholder*='API Key']", "minCount": 1}],
    },
]

SCRIPT = """\
import {{ chromium }} from {entry};

const pages = {pages};
const base = {base};
const outDir = {out_dir};

const browser = await chromium.launch({{
  channel: {channel},
  executablePath: {edge},
  args: ['--headless=new', '--no-first-run', '--disable-extensions'],
}});
const context = await browser.newContext({{
  viewport: {{ width: 390, height: 844 }},
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
}});

const results = [];

async function closeDisclaimer(page) {{
  const button = page.locator('.disclaimer-modal button.btn-primary');
  if (await button.count()) {{
    await button.first().click().catch(() => {{}});
    await page.waitForTimeout(500);
  }}
}}

async function touchForm(page) {{
  await page.selectOption('#birth-year', '1990').catch(() => {{}});
  await page.waitForTimeout(200);
}}

async function clickByText(page, pattern) {{
  const locator = page.getByRole('button', {{ name: pattern }}).first();
  await locator.waitFor({{ state: 'visible', timeout: 8000 }});
  await locator.scrollIntoViewIfNeeded().catch(() => {{}});
  // 移动端底部固定导航可能遮住按钮，视觉回归用 force 跳过可点击性判定
  await locator.click({{ force: true }});
}}

for (const spec of pages) {{
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {{
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text());
  }});
  page.on('pageerror', (error) => errors.push(`pageerror: ${{error.message}}`));

  const problems = [];
  try {{
    await page.goto(base + spec.path, {{ waitUntil: 'load' }});
    await page.waitForTimeout(900);

    let currentStep = 'goto';
    for (const step of spec.steps) {{
      currentStep = step;
      if (step === 'closeDisclaimer') await closeDisclaimer(page);
      if (step === 'touchForm') await touchForm(page);
      if (step === 'pickSpread') {{
        await page.locator('.spread-item').first().click({{ force: true }});
        await clickByText(page, /选择此牌阵/);
      }}
      if (step === 'askQuestion') {{
        await page.locator('.question-textarea').fill('移动端视觉回归测试问题');
        await clickByText(page, /开始抽牌/);
        await page.getByText('点击卡牌抽取').waitFor({{ timeout: 5000 }});
      }}
      if (step === 'drawOne') {{
        await page.locator('.draw-cards .deck').click({{ force: true }});
        await page.getByText('占卜结果').waitFor({{ timeout: 5000 }});
      }}
      if (step === 'generateChart') {{
        await clickByText(page, /生成/);
        await page.waitForTimeout(1500);
      }}
      if (step === 'openCityPicker') {{
        const trigger = page.locator('.birthplace-trigger').first();
        await trigger.scrollIntoViewIfNeeded().catch(() => {{}});
        await trigger.click({{ force: true }});
        await page.locator('.city-picker').first().waitFor({{ timeout: 8000 }});
        await page.locator('.city-picker-provinces .city-picker-option').first().waitFor({{ timeout: 8000 }});
        await page.waitForTimeout(400);
      }}
    }}

    for (const check of spec.asserts) {{
      const nodes = page.locator(check.selector);
      const count = await nodes.count();
      if (check.minCount && count < check.minCount) {{
        problems.push(`${{check.selector}} 只找到 ${{count}} 个（要求 ≥${{check.minCount}}）`);
        continue;
      }}
      if (check.minWidth) {{
        const box = await nodes.first().boundingBox();
        if (!box || box.width < check.minWidth) {{
          problems.push(`${{check.selector}} 宽度 ${{box ? box.width : 'null'}}（要求 ≥${{check.minWidth}}）`);
        }}
      }}
      if (check.minScrollWidth) {{
        const metrics = await nodes.first().evaluate((element) => ({{
          scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight, clientHeight: element.clientHeight,
          overflowX: getComputedStyle(element).overflowX,
        }}));
        if (metrics.scrollWidth < check.minScrollWidth) {{
          problems.push(`${{check.selector}} 内容宽 ${{metrics.scrollWidth}}px（要求 ≥${{check.minScrollWidth}}，疑似被压扁）`);
        }}
        if (!['auto', 'scroll'].includes(metrics.overflowX)) {{
          problems.push(`${{check.selector}} overflow-x=${{metrics.overflowX}}，超出内容无法滚动`);
        }}
        if (check.noVerticalClip && metrics.scrollHeight - metrics.clientHeight > 4) {{
          problems.push(`${{check.selector}} 竖向被裁 ${{metrics.scrollHeight - metrics.clientHeight}}px`);
        }}
      }}
      if (check.minFontSize) {{
        const sizes = await nodes.evaluateAll((elements) =>
          elements.map((element) => parseFloat(getComputedStyle(element).fontSize)).filter((size) => !Number.isNaN(size))
        );
        const smallest = sizes.length ? Math.min(...sizes) : null;
        if (smallest === null || smallest < check.minFontSize) {{
          problems.push(`${{check.selector}} 最小字号 ${{smallest}}px（要求 ≥${{check.minFontSize}}）`);
        }}
      }}
    }}

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 4) problems.push(`横向溢出 ${{overflow}}px`);

    await page.screenshot({{ path: `${{outDir}}/${{spec.name}}.png`, fullPage: true }});
    // footer 单独出一张元素截图：发布信息（版本 / sha / 提交时间）要看得到
    await page.locator('.footer').first()
      .screenshot({{ path: `${{outDir}}/${{spec.name}}-footer.png` }})
      .catch(() => {{}});
  }} catch (error) {{
    problems.push(`执行失败[step=${{currentStep}}]：${{error.message.split('\\n')[0]}}`);
  }}

  problems.push(...errors.map((text) => `控制台错误：${{text.slice(0, 160)}}`));
  results.push({{ name: spec.name, path: spec.path, ok: problems.length === 0, problems }});
  console.log(`${{problems.length === 0 ? 'PASS' : 'FAIL'}} ${{spec.name}}`);
  problems.forEach((text) => console.log(`    ${{text}}`));
  await page.close();
}}

await browser.close();
console.log(`__RESULT__${{JSON.stringify(results)}}`);
"""


def resolve(name: str) -> str:
    path = shutil.which(name)
    if not path:
        sys.exit(f"[visual] 找不到可执行文件: {name}")
    return path


def browser_config() -> tuple[str, str]:
    """返回 (module_path, channel)：优先本机 Edge，回退 playwright 自带 Chromium。"""
    candidates = sorted((WEB / "node_modules" / ".pnpm").glob("playwright-core@*/node_modules/playwright-core/index.mjs"))
    direct = WEB / "node_modules" / "playwright-core" / "index.mjs"
    if direct.exists():
        candidates.append(direct)
    candidates += sorted((WEB / "node_modules" / ".pnpm").glob("playwright@*/node_modules/playwright/index.mjs"))
    if not candidates:
        sys.exit("[visual] 找不到 playwright-core，请先 pnpm --dir web add -D playwright-core")

    for edge in EDGE_CANDIDATES:
        if edge.exists():
            return f"{candidates[-1].as_uri()}|{edge.as_posix()}", '"msedge"'
    return f"{candidates[-1].as_uri()}|", "undefined"


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
    parser = argparse.ArgumentParser(description="移动端视觉回归")
    parser.add_argument("--port", type=int, default=4000)
    parser.add_argument("--base-url", default=None, help="直接测指定站点（不再本地起服务/构建）")
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--allow-skip", action="store_true", help="没有可用浏览器时跳过（CI 场景），返回 0")
    args = parser.parse_args(argv or [])

    npx = resolve("npx")
    node = resolve("node")
    SHOTS.mkdir(parents=True, exist_ok=True)

    server = None
    base = args.base_url
    if not base:
        if not args.skip_build:
            print("[visual] 构建产物（vite build）…")
            build = subprocess.run(
                [npx, "vite", "build"], cwd=WEB, text=True, encoding="utf-8",
                errors="replace", stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            )
            if build.returncode != 0:
                print(build.stdout[-1200:])
                return build.returncode

        ok, lines = ensure_free(args.port)
        for line in lines:
            print(f"[visual] {line}")
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
            sys.exit("[visual] 本地服务未就绪")

    try:
        module_ref, channel = browser_config()
    except SystemExit as error:
        if args.allow_skip:
            print(f"[visual] 跳过：{error}")
            return 0
        raise
    entry, edge = module_ref.split("|", 1)
    TEMP_JS.write_text(
        SCRIPT.format(
            entry=f"'{entry}'",
            edge=f"'{edge}'" if edge else "undefined",
            channel=channel,
            pages=json.dumps(PAGES),
            base=f"'{base}'",
            out_dir=f"'{SHOTS.as_posix()}'",
        ),
        encoding="utf-8",
    )
    try:
        proc = subprocess.run(
            [node, TEMP_JS.name], cwd=WEB, text=True, encoding="utf-8",
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
    console_lines = [line for line in output.splitlines() if not line.startswith("__RESULT__")]

    log_dir = new_run_dir("visual")
    report = log_dir / "report.md"
    report_lines = ["# 移动端视觉回归", ""]
    for item in results:
        report_lines.append(f"## {'PASS' if item['ok'] else 'FAIL'} {item['name']}（{item['path']}）")
        report_lines += [f"- {text}" for text in item["problems"]] or ["- 无问题"]
        report_lines.append("")
    report.write_text("\n".join(report_lines), encoding="utf-8")

    print("\n".join(console_lines))
    passed = sum(1 for item in results if item["ok"])
    print(f"\n================ 移动端视觉回归 {passed}/{len(results)} 通过 ================")
    print(f"截图目录：{SHOTS.relative_to(ROOT)}    报告：{report.relative_to(ROOT)}")
    return 0 if results and passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
