"""Render richmenu.html to PNG using Playwright."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent.parent
HTML = ROOT / "scripts" / "richmenu.html"
OUT = ROOT / "richmenu.png"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 2500, "height": 1686}, device_scale_factor=1)
    page.goto(f"file:///{HTML.as_posix()}")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT), full_page=False, omit_background=False, clip={"x": 0, "y": 0, "width": 2500, "height": 1686})
    browser.close()

print(f"saved: {OUT} ({OUT.stat().st_size // 1024} KB)")
