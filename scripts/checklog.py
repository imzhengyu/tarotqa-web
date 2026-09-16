#!/usr/bin/env python3
"""跑命令 + 落日志 + **日志后处理** 的公共工具。

约定（见 AGENTS.md）：
  1. 每个检查的完整输出写入 `logs/<run-id>/<label>.log`；
  2. 跑完（无论成败）都对日志做后处理，解析出 文件/用例 级别的 PASS/FAIL 与失败原因；
  3. 终端只打印结构化摘要；完整上下文去读日志；
  4. 同目录同时落 `summary.md` / `summary.json`，方便后续比对与自动化取用。
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOG_ROOT = ROOT / "logs"

TEST_FILE_RE = re.compile(r"^\s*[✓×❯]\s+(?P<file>src/\S+?\.(?:test|spec)\.(?:js|jsx|ts|tsx))(?P<rest>.*)$")
TESTS_LINE_RE = re.compile(r"^\s*Tests\s+(?P<summary>.+?)\s*$", re.MULTILINE)
TEST_FILES_LINE_RE = re.compile(r"^\s*Test Files\s+(?P<summary>.+?)\s*$", re.MULTILINE)
FAIL_LINE_RE = re.compile(r"^\s*FAIL\s+(?P<name>\S.*?)\s*$", re.MULTILINE)
ARROW_LINE_RE = re.compile(r"^\s*→\s+(?P<reason>.+?)\s*$", re.MULTILINE)
ERROR_LINE_RE = re.compile(
    r"^(?:AssertionError|Error|TypeError|RangeError|ReferenceError|SyntaxError|TimeoutError|Unhandled\w*|expected)\b.*$"
)
LINT_PROBLEM_RE = re.compile(r"✖\s+(?P<count>\d+)\s+problems?\s*\((?P<detail>[^)]*)\)")


# ---------------------------------------------------------------- 运行与落盘

def new_run_dir(prefix: str) -> Path:
    """创建本次运行的日志目录，并更新 logs/latest.txt。"""
    LOG_ROOT.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    run_dir = LOG_ROOT / f"{prefix}-{stamp}"
    run_dir.mkdir(parents=True, exist_ok=True)
    (LOG_ROOT / "latest.txt").write_text(str(run_dir), encoding="utf-8")
    return run_dir


def _slug(label: str) -> str:
    slug = re.sub(r"[^\w\-]+", "-", label.strip().lower()).strip("-")
    return slug or "check"


def run_and_log(label: str, cmd: list[str], cwd: Path, log_dir: Path, env: dict | None = None) -> dict:
    """执行命令，完整输出写入日志文件，返回结果摘要（不含大段输出）。"""
    log_path = Path(log_dir) / f"{_slug(label)}.log"
    started = time.time()
    with log_path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(f"$ {' '.join(cmd)}\n")
        handle.write(f"# cwd: {cwd}\n# started: {datetime.now().isoformat(timespec='seconds')}\n\n")
        handle.flush()
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            env=env or os.environ.copy(),
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=handle,
            stderr=subprocess.STDOUT,
        )
    return {
        "label": label,
        "ok": proc.returncode == 0,
        "exit": proc.returncode,
        "seconds": time.time() - started,
        "log": log_path,
        "kind": "vitest" if "vitest" in " ".join(cmd) else ("lint" if "lint" in " ".join(cmd) else "other"),
    }


# ---------------------------------------------------------------- 日志解析

def parse_vitest_log(log_path: Path) -> dict:
    text = log_path.read_text(encoding="utf-8", errors="replace")
    info: dict = {"files": [], "failed": [], "tests_summary": None, "files_summary": None}

    for line in text.splitlines():
        match = TEST_FILE_RE.match(line)
        if not match:
            continue
        rest = match.group("rest")
        failed = "failed" in rest
        counts = re.search(r"\((?P<counts>[^)]*)\)", rest)
        info["files"].append({
            "file": match.group("file"),
            "ok": not failed,
            "counts": counts.group("counts") if counts else "",
        })

    tests_line = TESTS_LINE_RE.search(text)
    files_line = TEST_FILES_LINE_RE.search(text)
    info["tests_summary"] = tests_line.group("summary") if tests_line else None
    info["files_summary"] = files_line.group("summary") if files_line else None

    seen = set()
    for match in FAIL_LINE_RE.finditer(text):
        name = match.group("name").strip()
        if name in seen:
            continue
        seen.add(name)
        tail = text[match.end():match.end() + 600].splitlines()
        reason = ""
        for candidate in tail:
            stripped = candidate.strip()
            if ERROR_LINE_RE.match(stripped):
                reason = stripped
                break
        info["failed"].append({"test": name, "reason": reason})

    if not info["failed"]:
        info["failed"] = [{"test": reason, "reason": ""} for reason in ARROW_LINE_RE.findall(text)]

    return info


def parse_lint_log(log_path: Path) -> dict:
    text = log_path.read_text(encoding="utf-8", errors="replace")
    info: dict = {"problems": None, "detail": None, "offenders": []}
    match = LINT_PROBLEM_RE.search(text)
    if match:
        info["problems"] = int(match.group("count"))
        info["detail"] = match.group("detail")
    for line in text.splitlines():
        if re.match(r"^\s*(error|warning)\s+", line):
            info["offenders"].append(line.strip())
        elif re.search(r"^\S+\.(js|jsx|css)\s*$", line.strip()) and line.strip().endswith((".js", ".jsx", ".css")):
            info["offenders"].append(line.strip())
    return info


def parse_log(result: dict) -> dict:
    try:
        if result["kind"] == "vitest":
            return parse_vitest_log(result["log"])
        if result["kind"] == "lint":
            return parse_lint_log(result["log"])
    except OSError:
        pass
    return {}


# ---------------------------------------------------------------- 终端输出

def _safe_stdout() -> None:
    try:
        sys.stdout.reconfigure(errors="replace")
    except (AttributeError, ValueError):
        pass


def _status_text(result: dict, parsed: dict) -> str:
    if result["kind"] == "vitest" and parsed.get("tests_summary"):
        return f"{parsed['tests_summary']}"
    if result["kind"] == "lint":
        problems = parsed.get("problems")
        if problems is None:
            return "无 lint 问题"
        return f"{problems} 个问题（{parsed.get('detail') or ''}）"
    return f"exit={result['exit']}"


def print_report(results: list[dict], log_dir: Path, title: str) -> None:
    """跑完后的日志后处理输出：总体 PASS/FAIL + 用例级明细 + 失败原因。"""
    _safe_stdout()

    print(f"\n================ {title} ================")
    for result in results:
        parsed = result.setdefault("parsed", parse_log(result))
        status = "PASS" if result["ok"] else "FAIL"
        print(f"{status}  {result['label']:<20} {result['seconds']:>7.1f}s  {_status_text(result, parsed)}")
        print(f"      日志 {result['log'].relative_to(ROOT)}")

    failures = [
        (result, failure)
        for result in results
        for failure in result.get("parsed", {}).get("failed", [])
    ]
    if failures:
        print("\n---- 失败明细（解析自日志）----")
        for result, failure in failures:
            print(f"[{result['label']}] {failure['test']}")
            if failure.get("reason"):
                print(f"    {failure['reason']}")

    lint_offenders = [
        line
        for result in results
        for line in result.get("parsed", {}).get("offenders", [])
    ]
    if lint_offenders:
        print("\n---- lint 问题（解析自日志）----")
        for line in lint_offenders[:20]:
            print(f"    {line}")

    print(f"\n完整日志目录：{log_dir.relative_to(ROOT)}（logs/latest.txt 指向最近一次）")


def write_summary(results: list[dict], log_dir: Path, title: str) -> Path:
    """把后处理结果落成 summary.md / summary.json，便于复盘与自动化读取。"""
    lines = [f"# {title}", "", f"- 时间：{datetime.now().isoformat(timespec='seconds')}", ""]
    for result in results:
        parsed = result.get("parsed", {})
        status = "PASS" if result["ok"] else "FAIL"
        summary = parsed.get("tests_summary") or parsed.get("detail") or ""
        lines.append(f"- {status} {result['label']} ({result['seconds']:.1f}s) {summary}".rstrip())
        for failure in parsed.get("failed", []):
            lines.append(f"  - {failure['test']}")
            if failure.get("reason"):
                lines.append(f"    - {failure['reason']}")
        for offender in parsed.get("offenders", [])[:20]:
            lines.append(f"  - {offender}")
    lines.append("")
    lines.append("日志文件：")
    for result in results:
        lines.append(f"- {result['label']}: {result['log'].relative_to(ROOT)}")
    lines.append("")

    summary_md = log_dir / "summary.md"
    summary_md.write_text("\n".join(lines), encoding="utf-8")
    (log_dir / "summary.json").write_text(
        json.dumps(
            {
                "title": title,
                "results": [
                    {
                        "label": result["label"],
                        "ok": result["ok"],
                        "seconds": round(result["seconds"], 2),
                        "exit": result["exit"],
                        "log": str(result["log"].relative_to(ROOT)),
                        "parsed": result.get("parsed", {}),
                    }
                    for result in results
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return summary_md
