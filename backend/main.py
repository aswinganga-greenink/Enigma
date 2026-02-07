from fastapi import FastAPI
from ingest_osm import fetch_osm_map_data
from validation import OSMLocation, PlaceResponse, PlacesWithToiletsResponse
import random
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware




from auth.routes import router as vendor_auth_router
from auth.vendor_routes import router as vendor_router
from comments.routes import router as comments_router





from db.database import engine, Base
from db.model import Vendor
from db.location_model import VendorLocation

Base.metadata.create_all(bind=engine)


KOZHIKODE_BBOX = (
    11.05,   # south latitude
    75.60,   # west longitude
    11.45,   # north latitude
    76.10    # east longitude
)


osm_cache = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    global osm_cache

    raw_data = await fetch_osm_map_data(KOZHIKODE_BBOX)

    validated_osm = [
        OSMLocation.from_overpass(item)
        for item in raw_data
        if isinstance(item, dict)
    ]

    osm_cache = validated_osm

    yield  # app starts serving requests here 

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://0.0.0.0:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vendor_auth_router)
app.include_router(vendor_router)
app.include_router(comments_router)

@app.get("/toilets", response_model=PlacesWithToiletsResponse)
async def get_toilets():
    places = [transform_osm_to_place(osm) for osm in osm_cache]

    return PlacesWithToiletsResponse(
        count=len(places),
        items=places
    )



def transform_osm_to_place(osm: OSMLocation) -> PlaceResponse:
    """
    Convert raw OSM location into a place-with-toilet response.
    """

    # Decide place_type based on OSM tags
    if osm.amenity == "toilets":
        place_type = "toilet"
    elif osm.amenity == "restaurant":
        place_type = "restaurant"
    elif osm.amenity == "fuel":
        place_type = "fuel"
    elif osm.shop == "mall":
        place_type = "mall"
    else:
        place_type = "other"

    return PlaceResponse(
        id=osm.id,
        lat=osm.lat,
        lon=osm.lon,
        name=osm.name,
        place_type=place_type,
        toilet_available=True,  # invariant for this API

        pricing=random.choice(["free", "paid"]),
        differently_abled_supported=random.choice([True, False]),
        rating=round(random.uniform(2.5, 5.0), 1),
        reviews_count=random.randint(0, 120),
    )

