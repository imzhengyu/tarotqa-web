#!/usr/bin/env python3
"""受控推送：网络检查 → 放行标记校验 → git push（全部在脚本里完成，不在终端拼命令）。

    python scripts/push_approved.py --dry-run      # 只检查，不推送
    python scripts/push_approved.py                # 用已有放行标记推送
    python scripts/push_approved.py --approve      # 记录"本次 HEAD 已获用户批准"后推送

规则（见 AGENTS.md）：
  1. push 只能由用户发起；Codex 必须先明确报告并获得确认，再用 --approve 写放行标记；
  2. 推送前先做网络/VPN 检查（git ls-remote），不通就停，不反复重试；
  3. 放行标记为 .git/CODEX_PUSH_APPROVED，内容必须等于当前 HEAD 的 sha。
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from check_network import remote_check

ROOT = Path(__file__).resolve().parent.parent
APPROVAL_FILE = ROOT / ".git" / "CODEX_PUSH_APPROVED"


def git(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args], cwd=ROOT, capture_output=True, text=True,
        encoding="utf-8", errors="replace",
    )


def head_sha() -> str:
    return git("rev-parse", "HEAD").stdout.strip()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="受控推送")
    parser.add_argument("--remote", default="origin")
    parser.add_argument("--branch", default="master")
    parser.add_argument("--approve", action="store_true", help="写入/刷新放行标记（表示用户已确认）")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv or [])

    sha = head_sha()
    print(f"[push] 目标：{args.remote}/{args.branch}，HEAD={sha[:8]}：{git('log', '-1', '--pretty=%s').stdout.strip()}")

    # 1) 网络/VPN
    ok, detail = remote_check(args.remote, timeout=20)
    print(f"{'PASS' if ok else 'FAIL'}  网络检查：{detail}")
    if not ok:
        print("[push] 网络未就绪（先连接 VPN/代理，或跑 python scripts/check_network.py --detect-proxy）")
        return 1

    # 2) 放行标记
    if args.approve:
        APPROVAL_FILE.write_text(sha, encoding="utf-8")
        print(f"[push] 已写入放行标记：{APPROVAL_FILE.relative_to(ROOT)} → {sha[:8]}")
    recorded = APPROVAL_FILE.read_text(encoding="utf-8").strip() if APPROVAL_FILE.exists() else ""
    if recorded != sha:
        print("[push] 缺少与当前 HEAD 匹配的放行标记：请先用 --approve（表示用户已明确确认本次推送）")
        return 1
    print("[push] 放行标记校验通过")

    if args.dry_run:
        print("[push] --dry-run：不执行推送")
        return 0

    # 3) 推送
    result = git("push", args.remote, args.branch)
    print((result.stdout or "").strip() or (result.stderr or "").strip())
    if result.returncode != 0:
        print(f"[push] 推送失败（exit {result.returncode}）")
        return result.returncode

    status = git("status", "-sb").stdout.strip().splitlines()
    print(f"[push] 完成：{status[0] if status else ''}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
