#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
进击的巨人论坛 - 本地服务器
"""

import http.server
import socketserver
import webbrowser
import os
import sys

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        print(f"  [{self.address_string()}] {format % args}")

def start(port=8090):
    os.chdir(DIRECTORY)
    for p in range(port, port + 10):
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                url = f"http://localhost:{p}"
                print("\n" + "="*50)
                print("  ⚔️  进击的巨人 · 自由之翼论坛")
                print("="*50)
                print(f"\n  🌐 服务器已启动: {url}")
                print(f"  📂 目录: {DIRECTORY}")
                print("\n  按 Ctrl+C 停止\n" + "-"*50)
                webbrowser.open(url)
                httpd.serve_forever()
        except OSError:
            print(f"  端口 {p} 被占用，尝试下一个...")
            continue
        except KeyboardInterrupt:
            print("\n  👋 服务器已停止。")
            sys.exit(0)

if __name__ == "__main__":
    start()
