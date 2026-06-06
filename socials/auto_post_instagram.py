import os
import time
import requests
from dotenv import load_dotenv

load_dotenv("socials/.env")

IG_ID = os.getenv("IG_ID")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")

BASE_IMAGE_URL = "https://thesocalbite.com/socials/output"

IMAGE_FILES = [
    "top-5-1-2-day.png",
    "top-5-3-4-day.png",
    "top-5-full-day.png",
    "top-5-overnight.png",
    "top-5-15-day.png",
    "top-5-2-day.png",
    "top-5-3-day.png"
]

CAPTION = """🏆 SoCal Bite Top Boats by Trip Type

Swipe through today's top boats ranked by Fish Per Angler.

Full rankings:
thesocalbite.com

#SoCalBite #SouthernCaliforniaFishing #Sportfishing #FishingReport #SaltwaterFishing"""

def create_image_container(image_url):
    response = requests.post(
        f"https://graph.facebook.com/v20.0/{IG_ID}/media",
        data={
            "image_url": image_url,
            "is_carousel_item": "true",
            "access_token": ACCESS_TOKEN
        }
    )

    print("Image container:")
    print(response.json())
    response.raise_for_status()

    return response.json()["id"]

def create_carousel_container(children):
    response = requests.post(
        f"https://graph.facebook.com/v20.0/{IG_ID}/media",
        data={
            "media_type": "CAROUSEL",
            "children": ",".join(children),
            "caption": CAPTION,
            "access_token": ACCESS_TOKEN
        }
    )

    print("Carousel container:")
    print(response.json())
    response.raise_for_status()

    return response.json()["id"]

def publish_container(creation_id):
    print("Waiting for Instagram to process carousel...")
    time.sleep(60)

    response = requests.post(
        f"https://graph.facebook.com/v20.0/{IG_ID}/media_publish",
        data={
            "creation_id": creation_id,
            "access_token": ACCESS_TOKEN
        }
    )

    print("Publish:")
    print(response.json())
    response.raise_for_status()

image_container_ids = []

for image_file in IMAGE_FILES:
    image_url = f"{BASE_IMAGE_URL}/{image_file}"
    print(f"Creating container for {image_url}")
    image_container_ids.append(create_image_container(image_url))
    time.sleep(5)

carousel_id = create_carousel_container(image_container_ids)
publish_container(carousel_id)

print("Carousel posted to Instagram.")