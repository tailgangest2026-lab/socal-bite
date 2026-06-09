import json
from pathlib import Path

REPORT_FILE = Path("reports/daily-report-latest.json")
SEEN_FILE = Path("last-seen-trips.json")
POST_FILE = Path("socials/new-trip-post.txt")

POST_FILE.parent.mkdir(parents=True, exist_ok=True)

with open(REPORT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

if isinstance(data, list):
    trips = data
elif isinstance(data, dict):
    trips = (
        data.get("data")
        or data.get("trips")
        or data.get("reports")
        or data.get("rows")
        or []
    )
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

# First run only saves the current trips
if not seen_trips:
    with open(SEEN_FILE, "w", encoding="utf-8") as f:
        json.dump(current_ids, f, indent=2)

    print(f"First run complete. Saved {len(current_ids)} trips.")
    exit()

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

    print(f"New trips found: {len(new_trips)}")
    print(f"Post saved to {POST_FILE}")
else:
    print("No new trips found.")

with open(SEEN_FILE, "w", encoding="utf-8") as f:
    json.dump(current_ids, f, indent=2)
