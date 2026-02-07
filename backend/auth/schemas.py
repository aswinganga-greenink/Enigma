from pydantic import BaseModel, EmailStr, Field
from typing import Literal

class VendorSignupRequest(BaseModel):
    email: EmailStr
    password: str
    business_name: str

class VendorLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"]

class VendorLocationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    pricing: Literal["free", "paid"]
    differently_abled_supported: bool