import json
import os
from collections import defaultdict
from PIL import Image, ImageDraw, ImageFont, ImageFilter

INPUT_FILE = "boat-ratings.json"
OUTPUT_DIR = "socials/output"

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(INPUT_FILE, "r") as f:
    data = json.load(f)

groups = defaultdict(list)
for row in data:
    groups[row.get("trip_type", "Unknown Trip")].append(row)

def font(size):
    return ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        size
    )

def make_background():
    img = Image.new("RGB", (1080, 1080), "#061923")
    draw = ImageDraw.Draw(img)

    for y in range(1080):
        r = int(4 + y * 0.01)
        g = int(22 + y * 0.04)
        b = int(36 + y * 0.06)
        draw.line([(0, y), (1080, y)], fill=(r, g, b))

    for i in range(0, 1080, 90):
        draw.arc((i - 300, 760, i + 500, 1180), 190, 350, fill=(20, 92, 120), width=3)

    return img.filter(ImageFilter.GaussianBlur(0.3))

for trip_type, rows in groups.items():
    rows = sorted(rows, key=lambda x: x.get("rank", 999))[:5]

    img = make_background()
    draw = ImageDraw.Draw(img)

    # Header
    draw.rounded_rectangle((40, 35, 1040, 180), radius=34, fill=(3, 18, 28))
    draw.text((70, 55), "SOCAL BITE", font=font(58), fill=(255, 255, 255))
    draw.text((72, 122), "SOUTHERN CALIFORNIA FISHING REPORTS", font=font(25), fill=(255, 202, 64))

    # Title
    draw.text((60, 225), f"TOP 5 {trip_type}", font=font(54), fill=(255, 255, 255))
    draw.text((60, 290), "BOATS BY FISH PER ANGLER", font=font(32), fill=(255, 202, 64))

    y = 360

    for row in rows:
        rank = row.get("rank", "")
        boat = row.get("boat", "Unknown Boat")
        landing = row.get("landing", "")
        region = row.get("region", "")
        fpa = row.get("fpa", 0)

        # Card shadow
        draw.rounded_rectangle((52, y + 8, 1028, y + 118), radius=24, fill=(0, 8, 12))

        # Card
        draw.rounded_rectangle((45, y, 1035, y + 110), radius=24, fill=(10, 42, 58))

        # Rank circle
        draw.ellipse((70, y + 22, 138, y + 90), fill=(255, 202, 64))
        draw.text((94, y + 31), str(rank), font=font(34), fill=(5, 20, 30))

        # Boat info
        draw.text((165, y + 20), boat[:28], font=font(38), fill=(255, 255, 255))
        draw.text((165, y + 68), f"{landing} • {region}"[:48], font=font(23), fill=(200, 226, 238))

        # FPA badge
        draw.rounded_rectangle((835, y + 25, 1005, y + 85), radius=18, fill=(255, 202, 64))
        draw.text((862, y + 32), f"{fpa:.2f}", font=font(30), fill=(5, 20, 30))
        draw.text((940, y + 39), "FPA", font=font(20), fill=(5, 20, 30))

        y += 125

    # Footer
    draw.rounded_rectangle((60, 980, 1020, 1040), radius=22, fill=(3, 18, 28))
    draw.text((105, 994), "Full rankings at thesocalbite.com", font=font(34), fill=(255, 255, 255))

    safe_name = (
        trip_type.lower()
        .replace("/", "-")
        .replace(" ", "-")
        .replace(".", "")
    )

    output_path = f"{OUTPUT_DIR}/top-5-{safe_name}.png"
    img.save(output_path)
    print(f"Created: {output_path}")