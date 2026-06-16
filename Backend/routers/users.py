import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import User, RoleEnum
from core.security import get_current_user, require_role, hash_password
from pydantic import BaseModel

router = APIRouter(prefix="/api/users", tags=["Users"])

GMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@gmail\.com$")
ALLOWED_ROLES = {role.value for role in RoleEnum}


def normalize_gmail(email: str) -> str:
    normalized = (email or "").strip().lower()
    if not GMAIL_RE.fullmatch(normalized):
        raise HTTPException(
            status_code=400,
            detail="Utilisez une adresse Gmail valide, ex: nom@gmail.com",
        )
    return normalized


def normalize_role(role: RoleEnum | str) -> RoleEnum:
    value = role.value if isinstance(role, RoleEnum) else str(role)
    if value not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Role invalide. Valeurs autorisees: admin, technicien, client",
        )
    return RoleEnum(value)


def validate_user_payload(nom: str, prenom: str, mot_de_passe: str | None = None):
    if not nom.strip() or not prenom.strip():
        raise HTTPException(status_code=400, detail="Nom et prenom obligatoires")
    if mot_de_passe is not None and len(mot_de_passe) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caracteres")

class UserUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    role: Optional[RoleEnum] = None
    actif: Optional[bool] = None

class PasswordUpdate(BaseModel):
    ancien_mot_de_passe: str
    nouveau_mot_de_passe: str

class UserCreate(BaseModel):
    nom: str
    prenom: str
    email: str
    mot_de_passe: str
    role: RoleEnum = RoleEnum.client

@router.get("/")
def list_users(
    role: Optional[str] = None,
    actif: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "technicien"))
):
    query = db.query(User)
    if role:
        role = normalize_role(role).value
        query = query.filter(User.role == role)
    if actif is not None:
        query = query.filter(User.actif == actif)
    return query.order_by(User.nom.asc()).all()

@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return current_user

@router.get("/techniciens")
def list_techniciens(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(User).filter(
        User.role == "technicien",
        User.actif == True
    ).all()

@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.post("/", status_code=201)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    email = normalize_gmail(data.email)
    role = normalize_role(data.role)
    validate_user_payload(data.nom, data.prenom, data.mot_de_passe)
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    user = User(
        nom=data.nom.strip(),
        prenom=data.prenom.strip(),
        email=email,
        mot_de_passe=hash_password(data.mot_de_passe),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/techniciens", status_code=201)
def create_technicien(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    data.role = RoleEnum.technicien
    return create_user(data=data, db=db, current_user=current_user)

@router.put("/me")
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    for key, value in data.dict(exclude_none=True).items():
        if key == "role":
            continue  # l'utilisateur ne peut pas changer son propre rôle
        if key == "email":
            value = normalize_gmail(value)
        elif key in {"nom", "prenom"}:
            value = value.strip()
            if not value:
                raise HTTPException(status_code=400, detail="Nom et prenom obligatoires")
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password")
def update_password(
    data: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    from core.security import verify_password
    if not verify_password(data.ancien_mot_de_passe, current_user.mot_de_passe):
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
    current_user.mot_de_passe = hash_password(data.nouveau_mot_de_passe)
    db.commit()
    return {"message": "Mot de passe mis à jour avec succès"}

@router.put("/{user_id}")
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    for key, value in data.dict(exclude_none=True).items():
        if key == "email":
            value = normalize_gmail(value)
        elif key == "role":
            value = normalize_role(value)
        elif key in {"nom", "prenom"}:
            value = value.strip()
            if not value:
                raise HTTPException(status_code=400, detail="Nom et prenom obligatoires")
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Impossible de supprimer votre propre compte")
    user.actif = False  # soft delete
    db.commit()
