from typing import Dict, Optional, Literal, List
from pydantic import BaseModel, EmailStr




class OSMLocation(BaseModel):
    """
    Raw location coming from Overpass / OpenStreetMap.
    Represents MAP TRUTH only.
    """
    id: int
    lat: float
    lon: float
    tags: Dict[str, str]


    name: Optional[str] = None
    amenity: Optional[str] = None
    shop: Optional[str] = None

    @classmethod
    def from_overpass(cls, raw: dict) -> "OSMLocation":
        tags = raw.get("tags", {})

        return cls(
            id=raw["id"],
            lat=raw["lat"],
            lon=raw["lon"],
            tags=tags,
            name=tags.get("name"),
            amenity=tags.get("amenity"),
            shop=tags.get("shop"),
        )


#------------------------------------

class AppMetadata(BaseModel):
    """
    Data provided by vendors / users / app logic.
    This is NOT map truth.
    """
    pricing: Literal["free", "paid"]
    differently_abled_supported: bool
    rating: float
    reviews_count: int


#------------------------------------

class PlaceResponse(BaseModel):
    """
    Represents ANY place that has a toilet.
    Honest, place-centric, frontend-ready.
    """
    id: int
    lat: float
    lon: float

    name: Optional[str]

    place_type: Literal[
        "toilet",
        "restaurant",
        "fuel",
        "mall",
        "other"
    ]

    toilet_available: bool  # always True for this API

    pricing: Literal["free", "paid"]
    differently_abled_supported: bool

    rating: float
    reviews_count: int

#----------------------------------------------------

class PlacesWithToiletsResponse(BaseModel):
    count: int
    items: List[PlaceResponse]

