import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPORT_FILE = Path("reports/daily-report-latest.json")
SEEN_FILE = Path("last-seen-trips.json")
POST_FILE = Path("socials/new-trip-post.txt")
IMAGE_FILE = Path("socials/output/new-trip-post.png")

POST_FILE.parent.mkdir(parents=True, exist_ok=True)
IMAGE_FILE.parent.mkdir(parents=True, exist_ok=True)

with open(REPORT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

if isinstance(data, list):
    trips = data
elif isinstance(data, dict):
    trips = data.get("data") or data.get("trips") or data.get("reports") or data.get("rows") or []
else:
    trips = []

trips = [trip for trip in trips if isinstance(trip, dict)]

if SEEN_FILE.exists() and SEEN_FILE.stat().st_size > 0:
    try:
        with open(SEEN_FILE, "r", encoding="utf-8") as f:
            seen_trips = json.load(f)
    except json.JSONDecodeError:
        seen_trips = []
else:
    seen_trips = []

seen_set = set(seen_trips)

current_ids = []
new_trips = []

for trip in trips:
    trip_date = trip.get("trip_date", "")
    landing = trip.get("landing", "")
    boat = trip.get("boat", "")
    trip_type = trip.get("trip_type", "")

    trip_id = f"{trip_date}|{landing}|{boat}|{trip_type}"
    current_ids.append(trip_id)

    if trip_id not in seen_set:
        new_trips.append(trip)

if not seen_trips:
    with open(SEEN_FILE, "w", encoding="utf-8") as f:
        json.dump(current_ids, f, indent=2)

    print(f"First run complete. Saved {len(current_ids)} trips.")
    exit()


def load_font(size):
    possible_fonts = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]

    for font in possible_fonts:
        if Path(font).exists():
            return ImageFont.truetype(font, size)

    return ImageFont.load_default()


def wrap_text(draw, text, font, max_width):
    words = str(text).split()
    lines = []
    current = ""

    for word in words:
        test = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)

        if bbox[2] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word

    if current:
        lines.append(current)

    return lines


def create_social_image(new_trips):
    width = 1080
    height = 1080

    bg = (3, 18, 32)
    card = (6, 25, 42)
    teal = (25, 194, 209)
    gold = (231, 184, 90)
    white = (255, 255, 255)
    soft = (220, 236, 242)

    img = Image.new("RGB", (width, height), bg)
    draw = ImageDraw.Draw(img)

    title_font = load_font(58)
    sub_font = load_font(34)
    boat_font = load_font(34)
    small_font = load_font(25)
    fish_font = load_font(23)
    footer_font = load_font(26)

    draw.rectangle((0, 0, width, 150), fill=(6, 25, 42))
    draw.text((60, 35), "🚨 New Reports Added", fill=white, font=title_font)
    draw.text((60, 105), "The SoCal Bite", fill=teal, font=sub_font)

    y = 190

    for trip in new_trips[:4]:
        boat = trip.get("boat", "Unknown Boat")
        landing = trip.get("landing", "")
        trip_type = trip.get("trip_type", "")
        anglers = trip.get("anglers", "")
        fish_counts = trip.get("fish_counts", "")
        total_fish = trip.get("total_fish", trip.get("fish", ""))

        draw.rounded_rectangle((50, y, 1030, y + 170), radius=22, fill=card)

        draw.text((80, y + 20), boat, fill=gold, font=boat_font)
        draw.text((80, y + 62), f"{landing}", fill=soft, font=small_font)
        draw.text((80, y + 95), f"{trip_type} | {anglers} anglers | {total_fish} fish", fill=teal, font=small_font)

        fish_lines = wrap_text(draw, fish_counts, fish_font, 880)

        fish_y = y + 128
        for line in fish_lines[:1]:
            draw.text((80, fish_y), line, fill=white, font=fish_font)

        y += 195

    draw.rectangle((0, 980, width, 1080), fill=(6, 25, 42))
    draw.text((60, 1005), "Full report: thesocalbite.com", fill=white, font=footer_font)
    draw.text((735, 1005), "#SoCalBite", fill=teal, font=footer_font)

    img.save(IMAGE_FILE)


if new_trips:
    lines = []

    for trip in new_trips[:8]:
        boat = trip.get("boat", "Unknown Boat")
        landing = trip.get("landing", "")
        trip_type = trip.get("trip_type", "")
        anglers = trip.get("anglers", "")
        fish_counts = trip.get("fish_counts", "")
        total_fish = trip.get("total_fish", trip.get("fish", ""))

        lines.append(
            f"""🎣 {boat}
{landing}
{trip_type} | {anglers} anglers
{fish_counts}
Total Fish: {total_fish}"""
        )

    caption = f"""🚨 New SoCal Bite Reports Added

{chr(10).join(chr(10) + line + chr(10) for line in lines)}

Full report:
https://thesocalbite.com

#SoCalBite #SoCalFishing #FishingReports #Sportfishing #Fishing
"""

    with open(POST_FILE, "w", encoding="utf-8") as f:
        f.write(caption)

    create_social_image(new_trips)

    print(f"New trips found: {len(new_trips)}")
    print(f"Caption saved to {POST_FILE}")
    print(f"Image saved to {IMAGE_FILE}")
else:
    print("No new trips found.")

with open(SEEN_FILE, "w", encoding="utf-8") as f:
    json.dump(current_ids, f, indent=2)
