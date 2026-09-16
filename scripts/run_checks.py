#!/usr/bin/env python3
"""TarotQA Web 统一检查入口（完整日志落盘，终端只出摘要）。

在仓库根目录执行：

    python scripts/run_checks.py                     # 全部：lint + csslint + 单测 + 覆盖率 + 构建
    python scripts/run_checks.py --lint --tests       # 只跑其中几项
    python scripts/run_checks.py --tests -- src/tests/pages/Divination.test.jsx
    python scripts/run_checks.py --build --keep-build

输出约定：
  * 每个检查的完整输出写进 `logs/checks-<时间戳>/<检查名>.log`
  * `logs/latest.txt` 指向最近一次日志目录
  * 终端只打印 PASS/FAIL 摘要；失败时额外摘出少量关键行，完整堆栈看日志

资源约束（见 AGENTS.md 本地环境约束）：vitest 只用 1-2 个 worker，Node 堆上限 4096MB，
各项检查串行执行。
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
BUILD_OUT = ".tmp-build"

VITEST_MAX_WORKERS = 3
VITEST_MIN_WORKERS = 1
NODE_HEAP_MB = 4096


def resolve(name: str) -> str:
    """找到可执行文件（Windows 上是 npx.cmd / node.exe 等）。"""
    path = shutil.which(name)
    if not path:
        sys.exit(f"[run_checks] 找不到可执行文件: {name}")
    return path


def child_env() -> dict:
    """给所有子进程加上内存上限，避免一次性吃满 12GB。"""
    env = dict(os.environ)
    options = env.get("NODE_OPTIONS", "")
    env["NODE_OPTIONS"] = f"{options} --max-old-space-size={NODE_HEAP_MB}".strip()
    return env


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="TarotQA Web 检查脚本")
    parser.add_argument("--lint", action="store_true", help="ESLint")
    parser.add_argument("--csslint", action="store_true", help="Stylelint")
    parser.add_argument("--tests", action="store_true", help="vitest run")
    parser.add_argument("--coverage", action="store_true", help="vitest run --coverage + coverage-check.js")
    parser.add_argument("--build", action="store_true", help="vite build")
    parser.add_argument("--keep-build", action="store_true", help="构建后保留产物（默认删除临时产物）")
    parser.add_argument(
        "--commit",
        action="store_true",
        help="提交前放行全量单测与覆盖率（必须先取得用户明确批准）",
    )
    parser.add_argument("test_args", nargs="*", help="追加给 vitest 的参数（放在 -- 之后）")
    args = parser.parse_args(argv)
    if not any([args.lint, args.csslint, args.tests, args.coverage, args.build]):
        args.lint = args.csslint = args.tests = args.coverage = args.build = True
    return args


def guard_full_suite(args: argparse.Namespace) -> bool:
    """全量单测/覆盖率只允许在 commit 场景下跑，且必须先拿到用户批准。"""
    if not (args.tests or args.coverage):
        return True
    if args.commit:
        print("[run_checks] --commit：已按提交前门禁运行全量单测与覆盖率")
        return True
    print(
        "[run_checks] 已拒绝执行：全量单测 / 覆盖率只在 git commit 前运行。\n"
        "            请先向用户告警并取得明确批准，再用：\n"
        "                python scripts/run_checks.py --commit\n"
        "            日常改动请只跑：python scripts/run_sanity.py"
    )
    return False


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    npx, node = resolve("npx"), resolve("node")
    env = child_env()

    if not guard_full_suite(args):
        return 2

    log_dir = new_run_dir("checks")
    results: list[dict] = []

    print(
        f"[run_checks] worker ≤ {VITEST_MAX_WORKERS}，Node 堆 ≤ {NODE_HEAP_MB}MB，"
        f"日志目录 {log_dir.relative_to(ROOT)}"
    )

    if args.lint:
        results.append(run_and_log("ESLint", [npx, "eslint", "src", "--ext", "js,jsx"], WEB, log_dir, env))

    if args.csslint:
        results.append(run_and_log("Stylelint", [npx, "stylelint", "src/**/*.css"], WEB, log_dir, env))

    if args.tests:
        cmd = [
            npx, "vitest", "run",
            "--reporter=dot",
            f"--minWorkers={VITEST_MIN_WORKERS}",
            f"--maxWorkers={VITEST_MAX_WORKERS}",
            *args.test_args,
        ]
        results.append(run_and_log("单元测试", cmd, WEB, log_dir, env))

    if args.coverage:
        results.append(run_and_log(
            "覆盖率（vitest）",
            [
                npx, "vitest", "run", "--coverage",
                f"--minWorkers={VITEST_MIN_WORKERS}",
                f"--maxWorkers={VITEST_MAX_WORKERS}",
            ],
            WEB, log_dir, env,
        ))
        results.append(run_and_log(
            "覆盖率阈值",
            [node, "scripts/coverage-check.js", "--no-run"],
            WEB, log_dir, env,
        ))

    if args.build:
        results.append(run_and_log(
            "生产构建",
            [npx, "vite", "build", "--outDir", BUILD_OUT, "--emptyOutDir"],
            WEB, log_dir, env,
        ))
        build_path = WEB / BUILD_OUT
        if build_path.exists() and not args.keep_build:
            shutil.rmtree(build_path)
            print(f"(已清理临时构建产物 {build_path.relative_to(ROOT)})")

    print_report(results, log_dir, "检查结果（日志后处理）")
    summary = write_summary(results, log_dir, "TarotQA Web 全量检查")
    print(f"摘要文件：{summary.relative_to(ROOT)}")

    failed = [item["label"] for item in results if not item["ok"]]
    if failed:
        print(f"\n失败项：{', '.join(failed)}")
        return 1
    print("\n全部通过")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
