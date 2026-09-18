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


def git_proxy_config() -> list[str]:
    """git 自身配置的代理（http.proxy / https.proxy，含 global 与仓库级）。"""
    lines: list[str] = []
    for scope in ("--global", "--local"):
        result = subprocess.run(
            ["git", "config", scope, "--get-regexp", r"^(http|https)\.proxy$"],
            cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace",
        )
        if result.returncode == 0 and result.stdout.strip():
            lines.append(f"{scope}: " + "; ".join(result.stdout.split()))
    return lines


COMMON_PROXY_PORTS = [7890, 7897, 7891, 10809, 10808, 1080, 8888, 20171, 8080]


def system_proxy() -> str:
    """读取 Windows 系统代理设置（IE/WinINET）。"""
    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             "(Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings') "
             "| Select-Object ProxyEnable,ProxyServer,AutoConfigURL | ConvertTo-Json -Compress"],
            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=20,
        )
        return result.stdout.strip() or "(读不到)"
    except (OSError, subprocess.TimeoutExpired) as error:
        return f"(读取失败：{error})"


def open_local_proxy_ports() -> list[int]:
    open_ports = []
    for port in COMMON_PROXY_PORTS:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.6):
                open_ports.append(port)
        except OSError:
            continue
    return open_ports


def test_git_with_proxy(port: int, remote: str, timeout: float = 25.0) -> tuple[bool, str]:
    proxy = f"http://127.0.0.1:{port}"
    try:
        result = subprocess.run(
            ["git", "-c", f"http.proxy={proxy}", "-c", f"https.proxy={proxy}",
             "ls-remote", "--heads", remote],
            cwd=ROOT, capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return False, f"{proxy} 超时"
    if result.returncode == 0:
        return True, f"{proxy} 可用（git 走代理成功）"
    first = (result.stderr or result.stdout).strip().splitlines()
    return False, f"{proxy} 失败：{first[0] if first else 'unknown'}"


def detect_proxy(remote: str) -> int:
    """探测系统/本地代理，并测试 git 能否通过它访问远端。"""
    print("=== 系统代理（Windows WinINET）===")
    print(system_proxy())
    print("\n=== 本地常见代理端口 ===")
    ports = open_local_proxy_ports()
    print(", ".join(str(port) for port in ports) if ports else "未发现监听中的常见代理端口")
    print("\n=== git 通过代理访问远端 ===")
    if not ports:
        print("没有可用代理端口，无法测试；请在 VPN 客户端里开启「系统代理/HTTP 代理」后重试")
        return 1
    for port in ports:
        ok, detail = test_git_with_proxy(port, remote)
        print(f"{'PASS' if ok else 'FAIL'}  {detail}")
        if ok:
            print(f"\n建议配置（使其对 git 永久生效）：\n"
                  f"  git config --global http.proxy http://127.0.0.1:{port}\n"
                  f"  git config --global https.proxy http://127.0.0.1:{port}")
            return 0
    return 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="推送前网络检查")
    parser.add_argument("--remote", default="origin")
    parser.add_argument("--host", default="github.com")
    parser.add_argument("--port", type=int, default=443)
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--detect-proxy", action="store_true", help="探测系统代理并测试 git 走代理是否可用")
    parser.add_argument("--apply-proxy", action="store_true", help="探测代理并写入仓库级 git 配置（--local）")
    args = parser.parse_args(argv or [])

    if args.detect_proxy:
        return detect_proxy(args.remote)
    if args.apply_proxy:
        ports = open_local_proxy_ports()
        if not ports:
            print("未发现本地代理端口，无法自动配置")
            return 1
        for port in ports:
            ok, detail = test_git_with_proxy(port, args.remote)
            print(f"{'PASS' if ok else 'FAIL'}  {detail}")
            if ok:
                proxy = f"http://127.0.0.1:{port}"
                subprocess.run(["git", "config", "--local", "http.proxy", proxy], cwd=ROOT)
                subprocess.run(["git", "config", "--local", "https.proxy", proxy], cwd=ROOT)
                print(f"已写入仓库级 git 代理配置（--local）：{proxy}")
                return 0
        return 1

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
    git_proxy = git_proxy_config()
    checks.append({
        "name": "git-proxy",
        "ok": True,
        "detail": "; ".join(git_proxy) if git_proxy else "未配置 git 代理（走系统网络/DNS）",
    })

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
