from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.security import get_current_user, require_role
from database import get_db
from models import Category

router = APIRouter(prefix="/api/categories", tags=["Categories"])


class CategoryCreate(BaseModel):
    nom: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None


def clean_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip()
    return value or None


def normalize_name(value: str) -> str:
    return " ".join(value.strip().casefold().split())


def validate_parent(db: Session, parent_id: Optional[int]) -> Optional[int]:
    if not parent_id:
        return None

    parent = db.query(Category).filter(Category.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Categorie parente non trouvee")
    if parent.parent_id:
        raise HTTPException(status_code=400, detail="Une sous-categorie ne peut pas etre parente")
    return parent.id


def ensure_unique_name(db: Session, nom: str, parent_id: Optional[int], category_id: Optional[int] = None):
    normalized = normalize_name(nom)
    for category in db.query(Category).all():
        if category_id and category.id == category_id:
            continue
        same_parent = (category.parent_id or None) == (parent_id or None)
        if same_parent and normalize_name(category.nom) == normalized:
            raise HTTPException(status_code=400, detail="Une categorie avec ce nom existe deja")


def get_category_or_404(db: Session, category_id: int) -> Category:
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categorie non trouvee")
    return category


@router.get("")
@router.get("/")
def list_categories(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Category).order_by(Category.parent_id.isnot(None), Category.nom.asc()).all()


@router.get("/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_category_or_404(db, category_id)


@router.post("", status_code=201)
@router.post("/", status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    nom = clean_text(data.nom)
    if not nom:
        raise HTTPException(status_code=400, detail="Le nom de la categorie est obligatoire")

    parent_id = validate_parent(db, data.parent_id)
    ensure_unique_name(db, nom, parent_id)

    category = Category(
        nom=nom,
        description=clean_text(data.description),
        parent_id=parent_id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}")
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    category = get_category_or_404(db, category_id)
    updates = data.dict(exclude_unset=True)

    nom = clean_text(updates.get("nom", category.nom))
    if not nom:
        raise HTTPException(status_code=400, detail="Le nom de la categorie est obligatoire")

    parent_id = updates.get("parent_id", category.parent_id)
    parent_id = validate_parent(db, parent_id)
    if parent_id == category.id:
        raise HTTPException(status_code=400, detail="Une categorie ne peut pas etre sa propre parente")
    if parent_id and category.enfants:
        raise HTTPException(status_code=400, detail="Une categorie avec des sous-categories doit rester principale")

    ensure_unique_name(db, nom, parent_id, category_id=category.id)

    category.nom = nom
    if "description" in updates:
        category.description = clean_text(updates["description"])
    category.parent_id = parent_id

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    category = get_category_or_404(db, category_id)
    if category.enfants:
        raise HTTPException(status_code=400, detail="Supprimez d'abord les sous-categories")
    if category.incidents:
        raise HTTPException(status_code=400, detail="Impossible de supprimer une categorie liee a des incidents")
    db.delete(category)
    db.commit()
