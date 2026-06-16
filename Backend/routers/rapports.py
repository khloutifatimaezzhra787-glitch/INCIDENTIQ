from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.security import get_current_user, require_role
from database import get_db
from models import (
    Incident,
    Notification,
    Rapport,
    RapportFormatEnum,
    RapportTypeEnum,
    User,
)
import schemas
from services.rapport_service import generer_rapport

router = APIRouter(prefix="/api/rapports", tags=["Rapports"])


class RapportCreate(BaseModel):
    titre: str
    type: RapportTypeEnum
    format: RapportFormatEnum
    incident_id: Optional[int] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut_filtre: Optional[str] = None
    priorite_filtre: Optional[str] = None
    categorie_id: Optional[int] = None
    assigne_id: Optional[int] = None
    notes_technicien: Optional[str] = None


@router.post("", status_code=201)
@router.post("/", status_code=201)
def creer_rapport(
    data: RapportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "technicien")),
):
    incident = None
    if data.incident_id:
        incident = db.query(Incident).filter(Incident.id == data.incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident non trouve")
        data.titre = incident.titre

    if current_user.role == "technicien":
        if not data.incident_id:
            raise HTTPException(status_code=400, detail="Le technicien doit associer le rapport a un incident")
        incident = db.query(Incident).filter(
            Incident.id == data.incident_id,
            Incident.assigne_id == current_user.id,
        ).first()
        if not incident:
            raise HTTPException(status_code=403, detail="Vous ne pouvez generer un rapport que pour vos incidents affectes")
        if data.notes_technicien:
            data.notes_technicien = data.notes_technicien.strip()
            incident.notes_technicien = data.notes_technicien
            db.add(incident)

    rapport, chemin = generer_rapport(db, data, current_user.id)

    if current_user.role == "technicien":
        admins = db.query(User).filter(User.role == "admin", User.actif == True).all()
        for admin in admins:
            db.add(Notification(
                utilisateur_id=admin.id,
                incident_id=data.incident_id,
                type="statut",
                message=f"Nouveau rapport du technicien {current_user.prenom} {current_user.nom} pour l'incident #{data.incident_id}: {data.titre}",
            ))
        db.commit()

    return {"message": "Rapport genere", "id": rapport.id, "chemin": chemin}


@router.get("")
@router.get("/")
def list_rapports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Rapport).filter(Rapport.supprime == False)

    if current_user.role == "client":
        query = query.join(Incident, Rapport.incident_id == Incident.id).filter(
            Incident.declarant_id == current_user.id,
            Rapport.publie_client == True,
        )
    elif current_user.role == "technicien":
        query = query.filter(Rapport.genere_par == current_user.id)

    return query.order_by(Rapport.created_at.desc()).all()


@router.get("/incident/{incident_id}", response_model=list[schemas.RapportOut])
def list_rapports_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident non trouve")

    query = db.query(Rapport).filter(Rapport.incident_id == incident_id, Rapport.supprime == False)
    if current_user.role == "client":
        if incident.declarant_id != current_user.id:
            raise HTTPException(status_code=403, detail="Acces non autorise")
        query = query.filter(Rapport.publie_client == True)
    elif current_user.role == "technicien":
        if incident.assigne_id != current_user.id:
            raise HTTPException(status_code=403, detail="Acces non autorise")
        query = query.filter(Rapport.genere_par == current_user.id)

    return query.order_by(Rapport.created_at.desc()).all()


@router.put("/{rapport_id}/publier", response_model=schemas.RapportOut)
def publier_rapport_client(
    rapport_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    rapport = db.query(Rapport).filter(Rapport.id == rapport_id, Rapport.supprime == False).first()
    if not rapport:
        raise HTTPException(status_code=404, detail="Rapport non trouve")
    if not rapport.incident:
        raise HTTPException(status_code=400, detail="Ce rapport n'est pas associe a un incident")

    rapport.publie_client = True
    statut = rapport.incident.statut.value if hasattr(rapport.incident.statut, "value") else rapport.incident.statut
    message = f"Le rapport de votre incident #{rapport.incident.id} est disponible."
    if statut == "resolu":
        message += " Votre incident est resolu."
    db.add(Notification(
        utilisateur_id=rapport.incident.declarant_id,
        incident_id=rapport.incident.id,
        type="statut",
        message=message,
    ))
    db.commit()
    db.refresh(rapport)
    return rapport


@router.get("/{rapport_id}/telecharger")
def telecharger_rapport(
    rapport_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rapport = db.query(Rapport).filter(Rapport.id == rapport_id, Rapport.supprime == False).first()
    if not rapport:
        raise HTTPException(status_code=404, detail="Rapport non trouve")

    if current_user.role == "client":
        if not rapport.incident or rapport.incident.declarant_id != current_user.id or not rapport.publie_client:
            raise HTTPException(status_code=403, detail="Vous n'avez pas acces a ce rapport")
    elif current_user.role == "technicien" and rapport.genere_par != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'avez pas acces a ce rapport")

    rapport_format = rapport.format.value if hasattr(rapport.format, "value") else rapport.format
    return FileResponse(rapport.chemin_fichier, filename=f"{rapport.titre}.{rapport_format}")


@router.delete("/{rapport_id}", status_code=204)
def supprimer_rapport(
    rapport_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "technicien")),
):
    rapport = db.query(Rapport).filter(Rapport.id == rapport_id, Rapport.supprime == False).first()
    if not rapport:
        raise HTTPException(status_code=404, detail="Rapport non trouve")

    if current_user.role == "technicien" and rapport.genere_par != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres rapports")

    rapport.supprime = True
    db.commit()
    return None
