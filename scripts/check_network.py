#!/usr/bin/env python3
"""推送前的网络/VPN 可用性检查（GitHub 在部分网络下必须开 VPN 才能 push）。

    python scripts/check_network.py            # PASS/FAIL 摘要
    python scripts/check_network.py --json     # 机器可读输出

判据优先级：
  1. `git ls-remote --heads origin`：与 push 走同一条传输链路，最贴近真实情况
  2. TCP 连接 github.com:443
  3. https://api.github.com 的 HTTP 状态
任一主判据失败即视为「网络未就绪」，exit 1（pre-push hook 会据此阻止推送）。
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def tcp_check(host: str, port: int, timeout: float) -> tuple[bool, str]:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True, f"TCP {host}:{port} 可连接"
    except OSError as error:
        return False, f"TCP {host}:{port} 失败：{error}"


def https_check(url: str, timeout: float) -> tuple[bool, str]:
    request = urllib.request.Request(url, headers={"User-Agent": "tarotqa-network-check/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return True, f"HTTPS {url} → {response.status}"
    except (urllib.error.URLError, OSError, ValueError) as error:
        return False, f"HTTPS {url} 失败：{error}"


def remote_check(remote: str, timeout: float) -> tuple[bool, str]:
    try:
        result = subprocess.run(
            ["git", "ls-remote", "--heads", remote],
            cwd=ROOT, capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return False, f"git ls-remote {remote} 超时（>{timeout:.0f}s）"
    if result.returncode != 0:
        message = (result.stderr or result.stdout).strip().splitlines()
        return False, f"git ls-remote {remote} 失败：{message[0] if message else 'unknown'}"
    branches = len([line for line in result.stdout.splitlines() if line.strip()])
    return True, f"git ls-remote {remote} 成功（{branches} 个分支）"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="推送前网络检查")
    parser.add_argument("--remote", default="origin")
    parser.add_argument("--host", default="github.com")
    parser.add_argument("--port", type=int, default=443)
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv or [])

    checks = []
    ok_remote, message_remote = remote_check(args.remote, args.timeout)
    checks.append({"name": "git-remote", "ok": ok_remote, "detail": message_remote})
    if not ok_remote:
        ok_tcp, message_tcp = tcp_check(args.host, args.port, min(args.timeout, 8))
        checks.append({"name": "tcp", "ok": ok_tcp, "detail": message_tcp})
        ok_https, message_https = https_check(f"https://{args.host}", min(args.timeout, 10))
        checks.append({"name": "https", "ok": ok_https, "detail": message_https})

    proxies = {key: value for key, value in os.environ.items() if "proxy" in key.lower()}
    if proxies:
        checks.append({"name": "proxy-env", "ok": True, "detail": json.dumps(proxies, ensure_ascii=False)[:200]})

    if args.json:
        print(json.dumps({"ok": ok_remote, "checks": checks}, ensure_ascii=False, indent=2))
    else:
        for check in checks:
            print(f"{'PASS' if check['ok'] else 'FAIL'}  {check['name']:<10} {check['detail']}")
        if not ok_remote:
            print("\n网络未就绪：请先连接 VPN / 代理，再执行 git push。")

    return 0 if ok_remote else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
