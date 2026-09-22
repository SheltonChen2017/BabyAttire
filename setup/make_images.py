"""Draw simple flat-lay placeholder images for the sample catalog.

Reads setup/catalog.json and writes JPGs to setup/images/:
  - one image per product and color: <handle>-<color>.jpg (1200x1500)
  - babyattire-hero.jpg (2400x1100) for the homepage banner
  - babyattire-story.jpg (1600x1200) for the Our story page

These are stand-ins so the prototype store looks complete. Replace them with
real product photos before launch.

Usage: python setup/make_images.py   (needs Pillow: pip install pillow)
"""

import json
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "images"
BACKGROUND = "#FBF7F1"
SCALE = 2  # draw at 2x, then downscale for smooth edges


def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def shade(rgb, factor):
    return tuple(max(0, min(255, int(c * factor))) for c in rgb)


def slug(text):
    return text.lower().replace(" ", "-")


# Garment outlines, drawn in a 1000x1000 box.
SHAPES = {
    "bodysuit_short": [
        (390, 140), (300, 165), (170, 265), (225, 370), (320, 325), (330, 690),
        (410, 810), (435, 880), (565, 880), (590, 810), (670, 690), (680, 325),
        (775, 370), (830, 265), (700, 165), (610, 140), (500, 205),
    ],
    "bodysuit_long": [
        (390, 140), (300, 165), (160, 330), (95, 590), (185, 615), (255, 420),
        (320, 360), (330, 690), (410, 810), (435, 880), (565, 880), (590, 810),
        (670, 690), (680, 360), (745, 420), (815, 615), (905, 590), (840, 330),
        (700, 165), (610, 140), (500, 205),
    ],
    "sleeper": [
        (395, 80), (305, 105), (170, 260), (105, 500), (190, 525), (260, 350),
        (320, 300), (320, 600), (305, 880), (285, 950), (470, 955), (485, 700),
        (500, 670), (515, 700), (530, 955), (715, 950), (695, 880), (680, 600),
        (680, 300), (740, 350), (810, 525), (895, 500), (830, 260), (695, 105),
        (605, 80), (500, 140),
    ],
    "gown": [
        (395, 110), (305, 135), (165, 300), (100, 540), (190, 565), (260, 380),
        (320, 330), (290, 700), (240, 930), (760, 930), (710, 700), (680, 330),
        (740, 380), (810, 565), (900, 540), (835, 300), (695, 135), (605, 110),
        (500, 175),
    ],
    "sleep_sack": [
        (400, 110), (330, 120), (320, 250), (270, 330), (240, 520), (240, 850),
        (300, 930), (700, 930), (760, 850), (760, 520), (730, 330), (680, 250),
        (670, 120), (600, 110), (500, 170),
    ],
    "romper": [
        (400, 120), (345, 120), (330, 260), (300, 330), (300, 600), (280, 760),
        (470, 780), (500, 700), (530, 780), (720, 760), (700, 600), (700, 330),
        (670, 260), (655, 120), (600, 120), (500, 190),
    ],
    "cardigan": [
        (395, 150), (300, 175), (160, 340), (95, 600), (185, 625), (255, 430),
        (320, 370), (320, 850), (680, 850), (680, 370), (745, 430), (815, 625),
        (905, 600), (840, 340), (700, 175), (605, 150), (500, 420),
    ],
    "pants": [
        (300, 180), (700, 180), (730, 520), (745, 880), (560, 890), (510, 470),
        (490, 470), (440, 890), (255, 880), (270, 520),
    ],
    "hat": [
        (250, 760), (255, 560), (300, 400), (390, 300), (470, 270), (560, 270),
        (650, 320), (720, 430), (750, 580), (750, 760),
    ],
    "bib": [
        (180, 300), (820, 300), (760, 380), (620, 580), (500, 800), (380, 580),
        (240, 380),
    ],
}


def set_shapes():
    top = [
        (400, 90), (310, 110), (180, 250), (125, 440), (205, 460), (265, 320),
        (320, 280), (320, 480), (680, 480), (680, 280), (735, 320), (795, 460),
        (875, 440), (820, 250), (690, 110), (600, 90), (500, 140),
    ]
    pants = [
        (320, 520), (680, 520), (705, 740), (715, 950), (560, 955), (510, 720),
        (490, 720), (440, 955), (285, 950), (295, 740),
    ]
    return [top, pants]


def mitten(dx):
    return [
        (dx + 60, 820), (dx + 50, 520), (dx + 70, 380), (dx + 140, 320),
        (dx + 220, 330), (dx + 280, 400), (dx + 290, 520), (dx + 330, 500),
        (dx + 360, 540), (dx + 300, 640), (dx + 290, 820),
    ]


def sock(dx, dy):
    return [
        (dx + 0, dy + 0), (dx + 170, dy + 0), (dx + 170, dy + 330),
        (dx + 330, dy + 380), (dx + 340, dy + 480), (dx + 150, dy + 500),
        (dx + 30, dy + 470), (dx + 0, dy + 360),
    ]


def scaled(points, box, size):
    x0, y0 = box
    f = size / 1000
    return [(x0 + x * f, y0 + y * f) for x, y in points]


def draw_shape(img, polys, color, box, size, stripes=False, details=None):
    """Draw polygons with a soft shadow, fill and outline."""
    rgb = hex_rgb(color)
    outline = shade(rgb, 0.78)

    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for poly in polys:
        sd.polygon([(x + 14 * SCALE, y + 22 * SCALE) for x, y in scaled(poly, box, size)], fill=(90, 70, 50, 60))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18 * SCALE))
    img.alpha_composite(shadow)

    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for poly in polys:
        pts = scaled(poly, box, size)
        d.polygon(pts, fill=rgb + (255,))
    if stripes:
        mask = layer.split()[3]
        stripe_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        st = ImageDraw.Draw(stripe_layer)
        step = int(size * 0.045)
        y = box[1]
        while y < box[1] + size:
            st.rectangle([box[0], y, box[0] + size, y + step // 3], fill=(120, 140, 170, 255))
            y += step
        stripe_layer.putalpha(ImageChops.multiply(stripe_layer.split()[3], mask))
        layer.alpha_composite(stripe_layer)
    for poly in polys:
        d.line(scaled(poly, box, size) + [scaled(poly, box, size)[0]], fill=outline + (255,), width=5 * SCALE, joint="curve")
    if details:
        details(d, box, size, outline)
    img.alpha_composite(layer)


def snaps(points):
    def fn(d, box, size, outline):
        r = size * 0.012
        for x, y in scaled(points, box, size):
            d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 230), outline=outline + (255,), width=2 * SCALE)
    return fn


def seam(lines, dots=()):
    def fn(d, box, size, outline):
        for line in lines:
            d.line(scaled(line, box, size), fill=outline + (255,), width=4 * SCALE)
        r = size * 0.014
        for x, y in scaled(dots, box, size):
            d.ellipse([x - r, y - r, x + r, y + r], fill=shade(outline, 0.8) + (255,))
    return fn


def draw_product(img, shape, color, box, size):
    stripes = color == "Stripe"
    hexcolor = COLORS[color]
    if shape == "bodysuit_stack":
        for i, c in enumerate(["Sage", "Oat", "Cloud"]):
            off = (i - 1) * size * 0.12
            draw_shape(img, [SHAPES["bodysuit_short"]], COLORS[c], (box[0] + off, box[1] + off * 0.6), size * 0.82,
                       details=snaps([(450, 860), (500, 860), (550, 860)]))
        return
    if shape == "set":
        draw_shape(img, set_shapes(), hexcolor, box, size, stripes, seam([[(330, 520), (670, 520)]]))
        return
    if shape == "mittens":
        draw_shape(img, [mitten(120), mitten(520)], hexcolor, box, size,
                   details=seam([[(170, 760), (410, 760)], [(570, 760), (810, 760)]]))
        return
    if shape == "socks":
        draw_shape(img, [sock(180, 180), sock(500, 300)], hexcolor, box, size,
                   details=seam([[(180, 240), (350, 240)], [(500, 360), (670, 360)]],
                                dots=[(260, 600), (300, 630), (580, 720), (620, 750)]))
        return
    if shape == "giftbox":
        rgb = hex_rgb(hexcolor)
        body = [(200, 420), (800, 420), (800, 880), (200, 880)]
        lid = [(170, 330), (830, 330), (830, 440), (170, 440)]
        draw_shape(img, [body, lid], hexcolor, box, size,
                   details=seam([[(500, 330), (500, 880)], [(170, 440), (830, 440)]]))
        layer = ImageDraw.Draw(img)
        ribbon = (255, 255, 255, 255)
        rw = size * 0.035
        x = box[0] + 500 * size / 1000
        layer.rectangle([x - rw, box[1] + 330 * size / 1000, x + rw, box[1] + 880 * size / 1000], fill=ribbon)
        for sx in (-1, 1):
            loop = [(500, 330), (500 + sx * 150, 220), (500 + sx * 200, 300), (500 + sx * 40, 335)]
            layer.polygon(scaled(loop, box, size), fill=ribbon, outline=shade(rgb, 0.78) + (255,))
        cx, cy = x, box[1] + 325 * size / 1000
        r = size * 0.04
        layer.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ribbon, outline=shade(rgb, 0.78) + (255,), width=3 * SCALE)
        return
    polys = [SHAPES[shape]]
    details = {
        "bodysuit_short": snaps([(450, 860), (500, 860), (550, 860)]),
        "bodysuit_long": snaps([(450, 860), (500, 860), (550, 860)]),
        "sleeper": seam([[(500, 150), (500, 690)]]),
        "gown": seam([[(300, 890), (700, 890)]], dots=[(500, 930)]),
        "sleep_sack": seam([[(500, 200), (500, 900)]]),
        "romper": snaps([(340, 170), (660, 170), (470, 760), (530, 760)]),
        "cardigan": seam([[(500, 420), (500, 850)]], dots=[(530, 500), (530, 600), (530, 700), (530, 800)]),
        "pants": seam([[(300, 250), (700, 250)], [(260, 820), (440, 830)], [(560, 830), (740, 820)]]),
        "hat": seam([[(250, 690), (750, 690)]], dots=[(510, 250)]),
        "bib": snaps([(215, 330), (785, 330)]),
    }.get(shape)
    draw_shape(img, polys, hexcolor, box, size, stripes, details)


def canvas(w, h, accent):
    img = Image.new("RGBA", (w * SCALE, h * SCALE), hex_rgb(BACKGROUND) + (255,))
    blob = Image.new("RGBA", img.size, hex_rgb(accent) + (0,))
    bd = ImageDraw.Draw(blob)
    r = min(w, h) * SCALE * 0.42
    cx, cy = w * SCALE / 2, h * SCALE * 0.52
    bd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=hex_rgb(accent) + (70,))
    blob = blob.filter(ImageFilter.GaussianBlur(40 * SCALE))
    img.alpha_composite(blob)
    return img


def save(img, name):
    w, h = img.size
    img = img.resize((w // SCALE, h // SCALE), Image.LANCZOS).convert("RGB")
    img.save(OUT / name, "JPEG", quality=86, optimize=True, progressive=True)


def product_images(catalog):
    for p in catalog["products"]:
        for color in p["colors"]:
            img = canvas(1200, 1500, COLORS[color])
            size = 1000 * SCALE
            box = ((1200 * SCALE - size) / 2, (1500 * SCALE - size) / 2)
            draw_product(img, p["shape"], color, box, size)
            save(img, f"{p['handle']}-{slug(color)}.jpg")


def hero_image():
    img = canvas(2400, 1100, "#F2C4BE")
    random.seed(4)
    layout = [
        ("bodysuit_short", "Blush", 150, 120, 760),
        ("sleeper", "Sage", 820, 60, 900),
        ("hat", "Oat", 1640, 90, 380),
        ("socks", "Cloud", 1640, 520, 480),
        ("bib", "Dusty Blue", 1980, 180, 420),
        ("mittens", "Cloud", 2000, 560, 360),
    ]
    for shape, color, x, y, s in layout:
        draw_product(img, shape, color, (x * SCALE, y * SCALE), s * SCALE)
    save(img, "babyattire-hero.jpg")


def story_image():
    img = canvas(1600, 1200, "#B9CFB4")
    colors = ["Dusty Blue", "Cloud", "Blush", "Oat", "Sage", "Butter"]
    y = 900
    for i, c in enumerate(colors):
        w = 760 - i * 40
        x = (1600 - w) / 2 + (i % 2) * 30 - 15
        # each folded item is a flat slab, 13% as tall as it is wide
        slab = [(0, 0), (1000, 0), (1000, 130), (0, 130)]
        draw_shape(img, [slab], COLORS[c], (x * SCALE, (y - 0.13 * w) * SCALE), w * SCALE,
                   details=seam([[(0, 40), (1000, 40)]]))
        y -= 0.13 * w - 6
    save(img, "babyattire-story.jpg")


if __name__ == "__main__":
    catalog = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
    COLORS = catalog["colors"]
    OUT.mkdir(exist_ok=True)
    product_images(catalog)
    hero_image()
    story_image()
    print(f"Wrote {len(list(OUT.glob('*.jpg')))} images to {OUT}")
