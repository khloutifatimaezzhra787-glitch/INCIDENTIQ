from datetime import datetime
import os
import shutil
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session
from pydantic import BaseModel

from core.config import settings
from core.security import get_current_user
from database import get_db
from models import (
    Category,
    HistoriqueStatut,
    Incident,
    Notification,
    PieceJointe,
    PrioriteEnum,
    StatutEnum,
    User,
)
import schemas

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


class IncidentCreate(BaseModel):
    titre: str
    description: Optional[str] = None
    priorite: PrioriteEnum = PrioriteEnum.moyenne
    categorie_id: Optional[int] = None
    assigne_id: Optional[int] = None
    deadline: Optional[datetime] = None


class IncidentUpdate(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    notes_technicien: Optional[str] = None
    statut: Optional[StatutEnum] = None
    priorite: Optional[PrioriteEnum] = None
    categorie_id: Optional[int] = None
    assigne_id: Optional[int] = None
    deadline: Optional[datetime] = None


def _visible_incidents_query(db: Session, current_user):
    query = db.query(Incident)
    if current_user.role == "client":
        return query.filter(Incident.declarant_id == current_user.id)
    if current_user.role == "technicien":
        return query.filter(Incident.assigne_id == current_user.id)
    return query


def _get_visible_incident(db: Session, incident_id: int, current_user):
    incident = _visible_incidents_query(db, current_user).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident non trouve ou acces non autorise")
    return incident


def _notify_admins(db: Session, incident: Incident, message: str, notif_type: str = "statut"):
    admins = db.query(User).filter(User.role == "admin", User.actif == True).all()
    for admin in admins:
        db.add(Notification(
            utilisateur_id=admin.id,
            incident_id=incident.id,
            type=notif_type,
            message=message,
        ))


def _notify_user(db: Session, user_id: int, incident: Incident, message: str, notif_type: str = "statut"):
    db.add(Notification(
        utilisateur_id=user_id,
        incident_id=incident.id,
        type=notif_type,
        message=message,
    ))


def _validate_category(db: Session, categorie_id: Optional[int]):
    if not categorie_id:
        return
    category = db.query(Category).filter(Category.id == categorie_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Categorie introuvable")


@router.get("/", response_model=schemas.IncidentListOut)
def list_incidents(
    statut: Optional[str] = None,
    priorite: Optional[str] = None,
    categorie_id: Optional[int] = None,
    assigne_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = _visible_incidents_query(db, current_user)

    if statut:
        query = query.filter(Incident.statut == statut)
    if priorite:
        query = query.filter(Incident.priorite == priorite)
    if categorie_id:
        query = query.filter(Incident.categorie_id == categorie_id)
    if assigne_id and current_user.role == "admin":
        query = query.filter(Incident.assigne_id == assigne_id)

    total = query.count()
    incidents = query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": incidents}


@router.get("/{incident_id}", response_model=schemas.IncidentDetailOut)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return _get_visible_incident(db, incident_id, current_user)


@router.post("/", status_code=201, response_model=schemas.IncidentOut)
def create_incident(
    data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent creer des incidents")

    _validate_category(db, data.categorie_id)

    payload = data.dict()
    payload.pop("assigne_id", None)
    incident = Incident(**payload, declarant_id=current_user.id, statut=StatutEnum.en_attente)
    db.add(incident)
    db.commit()
    db.refresh(incident)

    _notify_admins(
        db,
        incident,
        f"Nouvel incident #{incident.id}: {incident.titre} par {current_user.prenom} {current_user.nom}",
        "assignation",
    )
    db.commit()
    db.refresh(incident)
    return incident


@router.put("/{incident_id}", response_model=schemas.IncidentOut)
def update_incident(
    incident_id: int,
    data: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    incident = _get_visible_incident(db, incident_id, current_user)
    updates = data.dict(exclude_unset=True)

    if current_user.role == "client":
        allowed_fields = {"titre", "description"}
        if any(field not in allowed_fields for field in updates):
            raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que le titre et la description")
    elif current_user.role == "technicien":
        allowed_fields = {"description", "notes_technicien"}
        if any(field not in allowed_fields for field in updates):
            raise HTTPException(status_code=403, detail="Seul l'administrateur peut modifier le statut ou l'affectation")

    if "statut" in updates and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seul l'administrateur peut modifier le statut")

    if "categorie_id" in updates:
        _validate_category(db, updates["categorie_id"])

    if "assigne_id" in updates and updates["assigne_id"]:
        technicien = db.query(User).filter(
            User.id == updates["assigne_id"],
            User.role == "technicien",
            User.actif == True,
        ).first()
        if not technicien:
            raise HTTPException(status_code=400, detail="Technicien introuvable ou inactif")

    ancien_statut = incident.statut
    ancien_assigne_id = incident.assigne_id

    for key, value in updates.items():
        if key == "notes_technicien":
            value = (value or "").strip() or None
        setattr(incident, key, value)

    if data.statut and data.statut != ancien_statut:
        db.add(HistoriqueStatut(
            incident_id=incident.id,
            ancien_statut=ancien_statut.value if hasattr(ancien_statut, "value") else ancien_statut,
            nouveau_statut=data.statut.value if hasattr(data.statut, "value") else data.statut,
            modifie_par=current_user.id,
        ))

        if data.statut == StatutEnum.resolu:
            incident.resolved_at = datetime.utcnow()
            _notify_user(
                db,
                incident.declarant_id,
                incident,
                f"Votre incident #{incident.id} ({incident.titre}) est resolu",
                "statut",
            )
        elif data.statut and data.statut != StatutEnum.resolu:
            incident.resolved_at = None

    if current_user.role == "admin" and "assigne_id" in updates and incident.assigne_id != ancien_assigne_id:
        if incident.assigne_id:
            _notify_user(
                db,
                incident.assigne_id,
                incident,
                f"Vous avez ete assigne a l'incident #{incident.id}: {incident.titre}",
                "assignation",
            )

    db.commit()
    db.refresh(incident)
    return incident


@router.delete("/{incident_id}", status_code=204)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acces non autorise")
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident non trouve")
    db.delete(incident)
    db.commit()


@router.post("/{incident_id}/upload")
async def upload_piece_jointe(
    incident_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    incident = _get_visible_incident(db, incident_id, current_user)
    
    original_name = os.path.basename(file.filename or "piece_jointe")
    allowed_extensions = {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".txt", ".csv", ".zip", ".rar", ".7z",
    }
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Format de fichier non autorise")
    
    # Create uploads directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    
    try:
        with open(filepath, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        size = os.path.getsize(filepath)
        if size > 20 * 1024 * 1024:
            os.remove(filepath)
            raise HTTPException(status_code=400, detail="Le fichier depasse 20 MB")
        pj = PieceJointe(
            incident_id=incident.id,
            nom_fichier=original_name,
            chemin=filename,  # Store only filename, not full path
            type_mime=file.content_type,
            taille=size,
            uploade_par=current_user.id,
        )
        db.add(pj)
        db.commit()
        db.refresh(pj)
        return pj
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=500, detail=f"Erreur lors du téléchargement: {str(e)}")


@router.get("/{incident_id}/pieces-jointes")
def list_pieces_jointes(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    incident = _get_visible_incident(db, incident_id, current_user)
    pieces = db.query(PieceJointe).filter(PieceJointe.incident_id == incident_id).all()
    return pieces


@router.delete("/{incident_id}/pieces-jointes/{piece_id}", status_code=204)
def delete_piece_jointe(
    incident_id: int,
    piece_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    incident = _get_visible_incident(db, incident_id, current_user)
    piece = db.query(PieceJointe).filter(
        PieceJointe.id == piece_id,
        PieceJointe.incident_id == incident_id
    ).first()
    if not piece:
        raise HTTPException(status_code=404, detail="Pièce jointe non trouvée")
    
    # Delete file from disk
    filepath = os.path.join(settings.UPLOAD_DIR, piece.chemin)
    if os.path.exists(filepath):
        os.remove(filepath)
    
    db.delete(piece)
    db.commit()
