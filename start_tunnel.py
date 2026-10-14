"""
FreshCheck Local Backend & Tunnel Launcher
==========================================
Connects your local machine's ML model to your Vercel frontend.

Usage:
    python start_tunnel.py
    python start_tunnel.py --tool pinggy
    python start_tunnel.py --tool ngrok
    python start_tunnel.py --tool cloudflare
"""

import sys
import os
import time
import shutil
import argparse
import subprocess
import urllib.request
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
LOCAL_PORT = 8000
HEALTH_URL = f"http://127.0.0.1:{LOCAL_PORT}/api/health"


def is_backend_running():
    try:
        req = urllib.request.Request(HEALTH_URL)
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status == 200
    except Exception:
        return False


def start_backend_process():
    python_exe = sys.executable
    venv_py = ROOT_DIR / "venv" / "Scripts" / "python.exe"
    if venv_py.exists():
        python_exe = str(venv_py)

    print(f"[*] Starting local FastAPI backend using: {python_exe}...")
    run_script = ROOT_DIR / "backend" / "run_server.py"

    proc = subprocess.Popen(
        [python_exe, str(run_script)],
        cwd=str(ROOT_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Wait up to 25 seconds for backend to start and load PyTorch models
    print("[*] Waiting for backend to initialize models and start listening on port 8000...")
    for _ in range(50):
        time.sleep(0.5)
        if is_backend_running():
            print("[+] Backend is UP and healthy on http://127.0.0.1:8000!\n")
            return proc

    print("[!] Warning: Backend started but health probe did not respond within 25s.")
    return proc


def find_tool(tool_name):
    return shutil.which(tool_name)


def main():
    parser = argparse.ArgumentParser(description="Start FreshCheck backend and tunnel to Vercel")
    parser.add_argument("--tool", choices=["auto", "cloudflare", "pinggy", "ngrok", "localtunnel"], default="auto")
    parser.add_argument("--no-backend", action="store_true", help="Do not start backend, only run tunnel")
    args = parser.parse_args()

    print("=" * 65)
    print("    🍏 FreshCheck Local Backend -> Vercel Connector")
    print("=" * 65)

    backend_proc = None
    if not is_backend_running():
        if not args.no_backend:
            backend_proc = start_backend_process()
        else:
            print("[!] Backend is not running on port 8000. Start it first.")
            sys.exit(1)
    else:
        print("[+] Detected existing backend running on http://127.0.0.1:8000.")

    # Determine tunnel tool
    tool = args.tool
    ssh_exe = find_tool("ssh")
    cloudflared_exe = find_tool("cloudflared")
    ngrok_exe = find_tool("ngrok")

    if tool == "auto":
        if cloudflared_exe:
            tool = "cloudflare"
        elif ssh_exe:
            tool = "pinggy"
        elif ngrok_exe:
            tool = "ngrok"
        else:
            tool = "pinggy"

    print(f"[*] Using tunnel tool: {tool.upper()}\n")

    cmd = []
    if tool == "cloudflare":
        cmd = ["cloudflared", "tunnel", "--url", f"http://127.0.0.1:{LOCAL_PORT}"]
    elif tool == "pinggy":
        # Pinggy uses standard built-in Windows OpenSSH
        # -t forces pseudo-terminal, -o StrictHostKeyChecking=no avoids prompt
        cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-p", "443", f"-R0:localhost:{LOCAL_PORT}", "a.pinggy.io"]
    elif tool == "ngrok":
        cmd = ["ngrok", "http", str(LOCAL_PORT)]
    elif tool == "localtunnel":
        cmd = ["npx", "localtunnel", "--port", str(LOCAL_PORT)]

    print(f"[*] Executing: {' '.join(cmd)}")
    print("-" * 65)
    print("INSTRUCTIONS:")
    print(" 1. Copy the public HTTPS URL printed below (starts with https://)")
    print(" 2. Open your deployed FreshCheck app on Vercel")
    print(" 3. Click the 'Connect Backend' pill in the header")
    print(" 4. Paste the HTTPS URL and click 'Save & Apply'")
    print("-" * 65 + "\n")

    try:
        tunnel_proc = subprocess.Popen(cmd)
        tunnel_proc.wait()
    except KeyboardInterrupt:
        print("\n[*] Stopping tunnel...")
    finally:
        if backend_proc:
            print("[*] Stopping local backend...")
            backend_proc.terminate()


if __name__ == "__main__":
    main()
