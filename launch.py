#!/usr/bin/env python3
"""
StockDash Launcher
------------------
Run this script to serve the dashboard over HTTP and open it in your browser.
Usage:  python launch.py

Pages available:
  index.html   — Stock Search (or stock-search.html)
  halts.html   — Live Trading Halts (auto-refreshes every 30s)
  splits.html  — Stock Splits browser with date-range picker
"""

import http.server
import socketserver
import webbrowser
import threading
import os
import sys

FILE = "index.html"

# Make sure we serve from the folder this script lives in
os.chdir(os.path.dirname(os.path.abspath(__file__)))

if not os.path.exists(FILE):
    print(f"ERROR: '{FILE}' not found. Make sure launch.py and the HTML files are in the same folder.")
    sys.exit(1)

Handler = http.server.SimpleHTTPRequestHandler
Handler.log_message = lambda *args: None  # silence request logs

# Find a free port automatically
with socketserver.TCPServer(("", 0), Handler) as httpd:
    PORT = httpd.server_address[1]

    def open_browser():
        base = f"http://localhost:{PORT}"
        url  = f"{base}/{FILE}"
        print(f"\n  ✅  StockDash is running at: {base}")
        print(f"      Stock Search   → {base}/index.html")
        print(f"      Trading Halts  → {base}/halts.html")
        print(f"      Stock Splits   → {base}/splits.html")
        print("\n  Press Ctrl+C to stop the server.\n")
        webbrowser.open(url)

    threading.Timer(0.8, open_browser).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
