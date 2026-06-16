import re

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.security import create_access_token, get_current_user, hash_password, verify_password
from database import get_db
from models import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])

GMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@gmail\.com$")


def normalize_gmail(email: str) -> str:
    normalized = (email or "").strip().lower()
    if not GMAIL_RE.fullmatch(normalized):
        raise HTTPException(
            status_code=400,
            detail="Utilisez une adresse Gmail valide, ex: nom@gmail.com",
        )
    return normalized


class RegisterSchema(BaseModel):
    nom: str
    prenom: str
    email: str
    mot_de_passe: str


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = normalize_gmail(form_data.username)
    # Rechercher en normalisant l'email stocké aussi (case-insensitive)
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user or not verify_password(form_data.password, user.mot_de_passe):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not user.actif:
        raise HTTPException(status_code=403, detail="Compte desactive")
    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "email": user.email,
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "nom": current_user.nom,
        "prenom": current_user.prenom,
        "role": current_user.role,
        "actif": current_user.actif,
    }


@router.post("/register", status_code=201)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    email = normalize_gmail(data.email)
    if not data.nom.strip() or not data.prenom.strip():
        raise HTTPException(status_code=400, detail="Nom et prenom obligatoires")
    if len(data.mot_de_passe) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caracteres")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email deja utilise")
    user = User(
        nom=data.nom.strip(),
        prenom=data.prenom.strip(),
        email=email,
        mot_de_passe=hash_password(data.mot_de_passe),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Compte cree avec succes", "id": user.id}
