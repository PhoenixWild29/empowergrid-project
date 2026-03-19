from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import jwt
from jwt.exceptions import PyJWTError as JWTError
from solders.pubkey import Pubkey
from nacl.signing import VerifyKey
from base58 import b58decode
import os
import secrets
from datetime import datetime, timedelta

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

nonces = {}  # wallet: nonce

class NonceResponse(BaseModel):
    nonce: str

class LoginRequest(BaseModel):
    wallet: str
    signature: str
    nonce: str

class Token(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_solana_signature(wallet: str, signature: str, message: str) -> bool:
    try:
        pubkey = Pubkey.from_string(wallet)
        message_bytes = message.encode()
        signature_bytes = b58decode(signature)
        verify_key = VerifyKey(pubkey.to_bytes())
        verify_key.verify(message_bytes, signature_bytes)
        return True
    except Exception:
        return False

@router.post("/auth/nonce", response_model=NonceResponse)
async def get_nonce(wallet: str):
    nonce = secrets.token_hex(16)
    nonces[wallet] = nonce
    return {"nonce": nonce}

@router.post("/auth/login", response_model=Token)
async def login(request: LoginRequest):
    if nonces.get(request.wallet) != request.nonce:
        raise HTTPException(status_code=400, detail="Invalid nonce")
    if not verify_solana_signature(request.wallet, request.signature, request.nonce):
        raise HTTPException(status_code=401, detail="Invalid signature")
    del nonces[request.wallet]
    access_token = create_access_token({"sub": request.wallet})
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        wallet: str = payload.get("sub")
        if wallet is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return wallet