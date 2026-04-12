"""LINE リッチメニュー画像生成 (2500x1686, 2x3)"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

W, H = 2500, 1686
COLS, ROWS = 3, 2
CW, CH = W // COLS, H // ROWS

NAVY = (10, 37, 64)
NAVY_LIGHT = (20, 55, 90)
GOLD = (201, 169, 110)
GOLD_LIGHT = (219, 194, 145)
IVORY = (246, 243, 236)
WHITE = (255, 255, 255)
GRAY = (140, 150, 165)

FONT_BOLD = "C:/Windows/Fonts/meiryob.ttc"
FONT_REG = "C:/Windows/Fonts/meiryo.ttc"

CELLS = [
    ("物件検索", "Properties", "all"),
    ("投資物件", "Investment", "high-yield"),
    ("富裕層物件", "Luxury", "premium"),
    ("無料査定", "Free Assessment", "sell"),
    ("お問合せ", "Contact", "inquiry"),
    ("会社概要", "About", "company"),
]

ICONS = ["home", "chart", "star", "doc", "mail", "building"]


def draw_icon(draw, kind, cx, cy, size, color):
    r = size // 2
    lw = max(4, size // 18)
    if kind == "home":
        # roof triangle
        draw.line([(cx - r, cy), (cx, cy - r), (cx + r, cy)], fill=color, width=lw)
        # body square
        draw.rectangle([cx - r * 0.7, cy, cx + r * 0.7, cy + r], outline=color, width=lw)
        # door
        draw.rectangle([cx - r * 0.18, cy + r * 0.35, cx + r * 0.18, cy + r], outline=color, width=lw)
    elif kind == "chart":
        base = cy + r * 0.7
        bars = [(-0.6, 0.3), (-0.2, 0.7), (0.2, 0.5), (0.6, 1.0)]
        bw = r * 0.25
        for x, h in bars:
            bx = cx + x * r
            draw.rectangle([bx - bw / 2, base - h * r, bx + bw / 2, base], outline=color, width=lw)
        # trend arrow
        draw.line([(cx - r * 0.8, cy), (cx + r * 0.8, cy - r * 0.5)], fill=color, width=lw)
    elif kind == "star":
        import math
        pts = []
        for i in range(10):
            ang = -math.pi / 2 + i * math.pi / 5
            rad = r if i % 2 == 0 else r * 0.42
            pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
        draw.polygon(pts, outline=color, width=lw)
    elif kind == "doc":
        draw.rectangle([cx - r * 0.7, cy - r, cx + r * 0.7, cy + r], outline=color, width=lw)
        for i, y in enumerate([-0.5, -0.2, 0.1, 0.4]):
            draw.line([(cx - r * 0.5, cy + y * r), (cx + r * 0.5 if i < 3 else cx + r * 0.2, cy + y * r)], fill=color, width=lw)
        # check mark
        draw.line([(cx - r * 0.3, cy + r * 0.7), (cx - r * 0.05, cy + r * 0.9), (cx + r * 0.5, cy + r * 0.5)], fill=color, width=lw + 2)
    elif kind == "mail":
        draw.rectangle([cx - r, cy - r * 0.6, cx + r, cy + r * 0.6], outline=color, width=lw)
        draw.line([(cx - r, cy - r * 0.6), (cx, cy + r * 0.15), (cx + r, cy - r * 0.6)], fill=color, width=lw)
    elif kind == "building":
        draw.rectangle([cx - r * 0.8, cy - r, cx + r * 0.8, cy + r], outline=color, width=lw)
        for ry in [-0.7, -0.35, 0, 0.35]:
            for rx in [-0.45, 0, 0.45]:
                draw.rectangle(
                    [cx + rx * r - r * 0.12, cy + ry * r - r * 0.08,
                     cx + rx * r + r * 0.12, cy + ry * r + r * 0.08],
                    outline=color, width=max(2, lw - 2)
                )


def main():
    img = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)

    # gradient-ish background: diagonal light overlay
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(20):
        alpha = 8
        od.rectangle([0, i * H // 20, W, (i + 1) * H // 20], fill=(20, 55, 90, alpha))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    title_font = ImageFont.truetype(FONT_BOLD, 92)
    sub_font = ImageFont.truetype(FONT_REG, 42)

    gap = 8  # gap between cells (navy line)
    for i, ((jp, en, _), icon_kind) in enumerate(zip(CELLS, ICONS)):
        r, c = divmod(i, COLS)
        x0 = c * CW + gap
        y0 = r * CH + gap
        x1 = (c + 1) * CW - gap
        y1 = (r + 1) * CH - gap

        # cell background slightly lighter
        draw.rectangle([x0, y0, x1, y1], fill=NAVY_LIGHT)

        cx = (x0 + x1) // 2
        # gold top border accent
        draw.rectangle([x0, y0, x1, y0 + 6], fill=GOLD)

        # icon
        icon_size = 260
        icon_cy = y0 + 360
        draw_icon(draw, icon_kind, cx, icon_cy, icon_size, GOLD_LIGHT)

        # JP title
        tb = draw.textbbox((0, 0), jp, font=title_font)
        tw = tb[2] - tb[0]
        draw.text((cx - tw // 2, icon_cy + 200), jp, font=title_font, fill=WHITE)

        # EN sub
        sb = draw.textbbox((0, 0), en, font=sub_font)
        sw = sb[2] - sb[0]
        draw.text((cx - sw // 2, icon_cy + 330), en, font=sub_font, fill=GOLD)

        # bottom gold underline
        uw = 120
        draw.rectangle([cx - uw // 2, icon_cy + 420, cx + uw // 2, icon_cy + 426], fill=GOLD)

    out = Path(__file__).parent.parent / "richmenu.png"
    img.save(out, "PNG", optimize=True)
    print(f"saved: {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
