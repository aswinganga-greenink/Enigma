from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.schemas import VendorLocationCreate
from db.location_model import VendorLocation
from auth.deps import get_current_vendor
from db.deps import get_db
from db.model import Vendor

router = APIRouter(prefix="/vendor", tags=["Vendor"])


@router.post("/locations")
def add_vendor_location(
    payload: VendorLocationCreate,
    vendor: Vendor = Depends(get_current_vendor),
    db: Session = Depends(get_db)
):
    location = VendorLocation(
        vendor_id=vendor.id,
        name=payload.name,
        lat=payload.lat,
        lon=payload.lon,
        pricing=payload.pricing,
        differently_abled_supported=payload.differently_abled_supported
    )

    db.add(location)
    db.commit()
    db.refresh(location)

    return {
        "id": location.id,
        "message": "Location added successfully"
    }
