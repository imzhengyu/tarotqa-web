#!/usr/bin/env python3
"""改动后的快速 sanity 门禁（完整日志落盘，终端只出摘要）。

在仓库根目录执行：

    python scripts/run_sanity.py

定位：一组较大的代码改动完成后先跑它（约 20-40 秒），过了再继续下一组改动；
全量门禁（含覆盖率与构建）由 `python scripts/run_checks.py` 负责，CI 两步都会跑。

输出：完整输出在 `logs/sanity-<时间戳>/`，终端只打印 PASS/FAIL 摘要与日志路径；
失败时会摘出少量关键行，完整堆栈/中间结果都在日志文件里。

资源约束（见 AGENTS.md 本地环境约束）：vitest 1-2 个 worker，Node 堆上限 4096MB，串行执行。
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

from checklog import new_run_dir, print_report, run_and_log, write_summary

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"

SANITY_TESTS = [
    "src/tests/utils/astrology/calculations.test.js",
    "src/tests/utils/ziwei/ziweiData.test.js",
    "src/tests/utils/export.test.js",
    "src/tests/utils/exportDocx.test.js",
    "src/tests/utils/exportPdf.test.js",
    "src/tests/utils/date.test.js",
    "src/tests/utils/chinaGeoData.test.js",
    "src/tests/utils/commitInfo.test.js",
    "src/tests/api.test.js",
    "src/tests/api-helpers.test.js",
    "src/tests/api-ziwei-astrology.test.js",
    "src/tests/useVisitStats.test.js",
    "src/tests/hooks/useAIRequestCooldown.test.js",
    "src/tests/components/BirthInfoForm.test.jsx",
    "src/tests/components/ChinaCityPicker.test.jsx",
    "src/tests/components/PdfExportButton.test.jsx",
    "src/tests/components/Icons.test.jsx",
    "src/tests/data/personas.test.js",
    "src/tests/components/TarotCard.test.jsx",
    "src/tests/components/ErrorBoundary.test.jsx",
    "src/tests/components/ScrollIndicator.test.jsx",
    "src/tests/components.test.jsx",
    "src/tests/pages/Divination.test.jsx",
    "src/tests/pages/Profile.test.jsx",
    "src/tests/pages/NotFound.test.jsx",
    "src/tests/pages/AstrologyChart.test.jsx",
    "src/tests/pages/ZiweiChart.test.jsx",
]


def resolve(name: str) -> str:
    path = shutil.which(name)
    if not path:
        sys.exit(f"[sanity] 找不到可执行文件: {name}")
    return path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="快速 sanity 门禁")
    parser.add_argument("--only", action="append", default=[], metavar="FILE", help="只跑指定测试文件（可重复，调试用）")
    parser.add_argument("--skip-lint", action="store_true", help="跳过 ESLint（配合 --only 做单文件调试）")
    args = parser.parse_args(argv or [])

    npx = resolve("npx")
    env = dict(os.environ)
    env["NODE_OPTIONS"] = f"{env.get('NODE_OPTIONS', '')} --max-old-space-size=4096".strip()
    log_dir = new_run_dir("sanity")

    print(f"[sanity] worker 1-3，Node 堆 ≤ 4096MB，日志目录 {log_dir.relative_to(ROOT)}")

    tests = args.only or SANITY_TESTS
    label = "指定用例" if args.only else "关键用例"

    results = []
    if not args.skip_lint:
        results.append(run_and_log("ESLint", [npx, "eslint", "src", "--ext", "js,jsx"], WEB, log_dir, env))
    results.append(
        run_and_log(
            label,
            [npx, "vitest", "run", "--reporter=dot", "--minWorkers=1", "--maxWorkers=3", *tests],
            WEB,
            log_dir,
            env,
        )
    )

    print_report(results, log_dir, "sanity 结果（日志后处理）")
    summary = write_summary(results, log_dir, "TarotQA Web sanity")
    print(f"摘要文件：{summary.relative_to(ROOT)}")

    failed = [item["label"] for item in results if not item["ok"]]
    if failed:
        print(f"\nsanity 失败：{', '.join(failed)}")
        return 1
    print("\nsanity 通过，可以继续")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
