from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import schemas
from database import get_db
from models import Commentaire, Incident, Notification, User
from core.security import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/incidents/{incident_id}/commentaires", tags=["Commentaires"])

class CommentaireCreate(BaseModel):
    contenu: str
    interne: bool = False

def get_accessible_incident(db: Session, incident_id: int, current_user):
    query = db.query(Incident).filter(Incident.id == incident_id)
    if current_user.role == "client":
        query = query.filter(Incident.declarant_id == current_user.id)
    elif current_user.role == "technicien":
        query = query.filter(Incident.assigne_id == current_user.id)
    incident = query.first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident non trouve ou acces non autorise")
    return incident

@router.get("", response_model=List[schemas.CommentaireOut])
@router.get("/", response_model=List[schemas.CommentaireOut])
def list_commentaires(incident_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    get_accessible_incident(db, incident_id, current_user)
    query = db.query(Commentaire).filter(Commentaire.incident_id == incident_id)
    if current_user.role == "client":
        query = query.filter(Commentaire.interne == False)
    return query.order_by(Commentaire.created_at.asc()).all()

@router.post("", status_code=201, response_model=schemas.CommentaireOut)
@router.post("/", status_code=201, response_model=schemas.CommentaireOut)
def add_commentaire(incident_id: int, data: CommentaireCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    incident = get_accessible_incident(db, incident_id, current_user)
    if current_user.role == "client":
        data.interne = False
    commentaire = Commentaire(
        incident_id=incident_id,
        auteur_id=current_user.id,
        contenu=data.contenu,
        interne=data.interne
    )
    db.add(commentaire)
    if current_user.role == "client":
        admins = db.query(User).filter(User.role == "admin", User.actif == True).all()
        for admin in admins:
            db.add(Notification(
                utilisateur_id=admin.id,
                incident_id=incident.id,
                type="commentaire",
                message=f"Nouveau commentaire client sur l'incident #{incident.id}: {incident.titre}"
            ))
    elif incident.declarant_id != current_user.id and not data.interne:
        db.add(Notification(
            utilisateur_id=incident.declarant_id,
            incident_id=incident.id,
            type="commentaire",
            message=f"Nouveau commentaire sur votre incident #{incident.id}: {incident.titre}"
        ))
    db.commit()
    db.refresh(commentaire)
    return commentaire
