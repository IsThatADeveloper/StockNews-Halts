#!/usr/bin/env python3
"""
StockDash Launcher
------------------
Run this script to serve the dashboard over HTTP and open it in your browser.
Usage:  python launch.py
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
    print(f"ERROR: '{FILE}' not found. Make sure launch.py and stockdash.html are in the same folder.")
    sys.exit(1)

Handler = http.server.SimpleHTTPRequestHandler
Handler.log_message = lambda *args: None  # silence request logs

# Find a free port automatically
with socketserver.TCPServer(("", 0), Handler) as httpd:
    PORT = httpd.server_address[1]

    def open_browser():
        url = f"http://localhost:{PORT}/{FILE}"
        print(f"\n  ✅ StockDash is running at: {url}")
        print("  Press Ctrl+C to stop the server.\n")
        webbrowser.open(url)

    threading.Timer(0.8, open_browser).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")