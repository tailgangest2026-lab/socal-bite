import json
import re
from pathlib import Path
from collections import defaultdict
from PIL import Image, ImageDraw, ImageFont

REPORT_FILE = Path("reports/daily-report-latest.json")
SEEN_FILE = Path("last-seen-trips.json")
OUTPUT_DIR = Path("socials/output")
ALERT_FLAG_FILE = Path("socials/new-post-created.flag")
POST_LINKS_FILE = Path("socials/post-links.txt")
SITE_BASE_URL = "https://thesocalbite.com"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

if ALERT_FLAG_FILE.exists():
    ALERT_FLAG_FILE.unlink()
if POST_LINKS_FILE.exists():
    POST_LINKS_FILE.unlink()

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
        print(f"NEW TRIP DETECTED: {trip_id}")
        new_trips.append(trip)

# First run only saves current trips
if not seen_trips:
    with open(SEEN_FILE, "w", encoding="utf-8") as f:
        json.dump(current_ids, f, indent=2)
    print(f"First run complete. Saved {len(current_ids)} trips.")
    exit()


def slugify(text):
    text = str(text).lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "region"


def load_font(size, bold=False):
    fonts = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]

    for font in fonts:
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


def create_region_image(region, region_trips):
    width = 1080

    title_font = load_font(44, bold=True)
    region_font = load_font(40, bold=True)
    boat_font = load_font(36, bold=True)
    info_font = load_font(25)
    fish_font = load_font(25)
    footer_font = load_font(28, bold=True)

    bg = (3, 18, 32)
    card = (6, 25, 42)
    teal = (25, 194, 209)
    gold = (231, 184, 90)
    white = (255, 255, 255)
    soft = (220, 236, 242)

    card_height = 245
    top_height = 175
    bottom_height = 105
    gap = 25

    display_trips = region_trips[:4]
    height = top_height + bottom_height + (len(display_trips) * (card_height + gap)) + 40

    img = Image.new("RGB", (width, height), bg)
    draw = ImageDraw.Draw(img)

    draw.rectangle((0, 0, width, 155), fill=card)

    logo_path = Path("assets/icons/socal-bite-logo.webp")

    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA")
        logo.thumbnail((105, 105))
        img.paste(logo, (45, 25), logo)

        title_x = 210
    else:
        title_x = 55

trip_date = display_trips[0].get("trip_date", "")

draw.text((title_x, 25), "NEW FISH COUNTS ADDED", fill=white, font=title_font)
draw.text((title_x, 78), region, fill=teal, font=region_font)
draw.text((title_x, 125), f"Fishing Rerports: {trip_date}", fill=gold, font=info_font)

y = 220

    for trip in display_trips:
        boat = trip.get("boat", "Unknown Boat")
        landing = trip.get("landing", "")
        trip_type = trip.get("trip_type", "")
        anglers = trip.get("anglers", "")
        fish_counts = trip.get("fish_counts", "")
        total_fish = trip.get("total_fish", trip.get("fish", ""))

        draw.rounded_rectangle((45, y, 1035, y + card_height), radius=24, fill=card)

        draw.text((75, y + 20), boat, fill=gold, font=boat_font)
        draw.text((75, y + 68), landing, fill=soft, font=info_font)
        draw.text(
            (75, y + 102),
            f"{trip_type} | {anglers} anglers | {total_fish} total fish",
            fill=teal,
            font=info_font,
        )

        fish_lines = wrap_text(draw, fish_counts, fish_font, 900)

        fish_y = y + 142
        for i, line in enumerate(fish_lines[:4]):
            draw.text((75, fish_y + (i * 28)), line, fill=white, font=fish_font)

        y += card_height + gap

    draw.rectangle((0, height - 90, width, height), fill=card)
    draw.text((55, height - 62), "Full report: thesocalbite.com", fill=white, font=footer_font)
    draw.text((760, height - 62), "#SoCalBite", fill=teal, font=footer_font)

    image_file = OUTPUT_DIR / f"new-fish-counts-{slugify(region)}.png"
    img.save(image_file)
    return image_file


def create_region_caption(region, region_trips):
    lines = []

    for trip in region_trips[:8]:
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

    caption = f"""🎣 New Fish Counts Added - {region}

{chr(10).join(chr(10) + line + chr(10) for line in lines)}

Full report:
https://thesocalbite.com

#SoCalBite #SoCalFishing #FishingReports #Sportfishing #Fishing
"""

    caption_file = Path(f"socials/new-fish-counts-{slugify(region)}.txt")

    with open(caption_file, "w", encoding="utf-8") as f:
        f.write(caption)

    return caption_file
print(f"Current trip IDs: {len(current_ids)}")
print(f"Seen trip IDs: {len(seen_set)}")
print(f"New trips found: {len(new_trips)}")

if current_ids:
    print("First current trip:")
    print(current_ids[0])

if seen_trips:
    print("First seen trip:")
    print(seen_trips[0])

if new_trips:
    trips_by_region = defaultdict(list)
    post_links = []

    for trip in new_trips:
        region = trip.get("region") or "Southern California"
        trips_by_region[region].append(trip)

    for region, region_trips in trips_by_region.items():
        image_file = create_region_image(region, region_trips)
        caption_file = create_region_caption(region, region_trips)

        image_url = f"{SITE_BASE_URL}/{image_file.as_posix()}"
        post_links.append(f"{region}: {image_url}")

        print(f"Created post for {region}")
        print(f"Image: {image_file}")
        print(f"Caption: {caption_file}")
        print(f"URL: {image_url}")

    with open(POST_LINKS_FILE, "w", encoding="utf-8") as f:
        f.write("New Fish Counts Added\n\n")
        f.write("\n".join(post_links))

    with open(ALERT_FLAG_FILE, "w", encoding="utf-8") as f:
        f.write("new post created")

else:
    print("No new trips found.")


with open(SEEN_FILE, "w", encoding="utf-8") as f:
    json.dump(current_ids, f, indent=2)
