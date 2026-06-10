import json

with open("boat-ratings.json", "r") as f:
    data = json.load(f)

print(f"Records found: {len(data)}")

for row in data[:5]:
    print(
        row["rank"],
        row["boat"],
        row["trip_type"],
        row["fpa"]
    )