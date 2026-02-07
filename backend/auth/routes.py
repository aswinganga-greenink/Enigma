from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session


from auth.schemas import VendorSignupRequest, VendorLoginRequest, AuthResponse
from auth.security import hash_password, verify_password, create_access_token
from db.model import Vendor
from db.deps import get_db

router = APIRouter(prefix="/auth/vendor", tags=["Vendor Auth"])


@router.post("/signup")
def vendor_signup(
    payload: VendorSignupRequest,
    db: Session = Depends(get_db)
):
    existing = db.query(Vendor).filter(Vendor.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password too short")

    vendor = Vendor(
        email=payload.email,
        password_hash=hash_password(payload.password),
        business_name=payload.business_name
    )

    db.add(vendor)
    db.commit()
    db.refresh(vendor)

    return {"message": "Vendor registered successfully"}



@router.post("/login", response_model=AuthResponse)
def vendor_login(
    payload: VendorLoginRequest,
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.email == payload.email).first()

    if not vendor or not verify_password(payload.password, vendor.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(subject=vendor.id)

    return {
        "access_token": token,
        "token_type": "bearer"
    }

