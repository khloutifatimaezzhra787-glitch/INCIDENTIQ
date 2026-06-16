from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from models import RoleEnum, StatutEnum, PrioriteEnum, NotifTypeEnum, RapportTypeEnum, RapportFormatEnum


# ─── Auth ─────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int


# ─── Users ────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: RoleEnum
    actif: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserShort(BaseModel):
    id: int
    nom: str
    prenom: str
    role: RoleEnum

    class Config:
        from_attributes = True


# ─── Categories ───────────────────────────────────────────────────────────────

class CategoryOut(BaseModel):
    id: int
    nom: str
    description: Optional[str]
    parent_id: Optional[int]

    class Config:
        from_attributes = True






# ─── Incidents ────────────────────────────────────────────────────────────────

class IncidentOut(BaseModel):
    id: int
    titre: str
    description: Optional[str]
    statut: StatutEnum
    priorite: PrioriteEnum
    categorie_id: Optional[int]
    declarant_id: int
    assigne_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    deadline: Optional[datetime]
    notes_technicien: Optional[str] = None
    declarant: Optional[UserShort]
    assigne: Optional[UserShort]
    categorie: Optional[CategoryOut]

    class Config:
        from_attributes = True

# ─── Historique ───────────────────────────────────────────────────────────────

class HistoriqueOut(BaseModel):
    id: int
    incident_id: int
    ancien_statut: Optional[str]
    nouveau_statut: Optional[str]
    modifie_par: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
        

class IncidentDetailOut(IncidentOut):
    historique: List[HistoriqueOut] = []

class IncidentListOut(BaseModel):
    total: int
    items: List[IncidentOut]


# ─── Commentaires ─────────────────────────────────────────────────────────────

class CommentaireOut(BaseModel):
    id: int
    incident_id: int
    contenu: str
    interne: bool
    created_at: datetime
    auteur: Optional[UserShort]

    class Config:
        from_attributes = True




# ─── Pieces Jointes ───────────────────────────────────────────────────────────

class PieceJointeOut(BaseModel):
    id: int
    incident_id: int
    nom_fichier: str
    type_mime: Optional[str]
    taille: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Notifications ────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    utilisateur_id: int
    incident_id: Optional[int]
    type: Optional[NotifTypeEnum]
    message: Optional[str]
    lu: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── SLA ──────────────────────────────────────────────────────────────────────

class SLAOut(BaseModel):
    id: int
    priorite: PrioriteEnum
    delai_reponse_h: int
    delai_resolution_h: int

    class Config:
        from_attributes = True


# ─── Rapports ─────────────────────────────────────────────────────────────────

class RapportOut(BaseModel):
    id: int
    titre: str
    type: RapportTypeEnum
    format: RapportFormatEnum
    incident_id: Optional[int]
    genere_par: Optional[int]
    chemin_fichier: Optional[str]
    taille: Optional[int]
    notes_technicien: Optional[str] = None
    publie_client: bool = False
    supprime: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class RapportFiltreOut(BaseModel):
    id: int
    rapport_id: int
    date_debut: Optional[date]
    date_fin: Optional[date]
    statut_filtre: Optional[str]
    priorite_filtre: Optional[str]
    categorie_id: Optional[int]
    assigne_id: Optional[int]

    class Config:
        from_attributes = True
