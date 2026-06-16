from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    technicien = "technicien"
    client = "client"

class StatutEnum(str, enum.Enum):
    en_attente = "en_attente"
    ouvert = "ouvert"
    en_cours = "en_cours"
    resolu = "resolu"
    ferme = "ferme"
    annule = "annule"

class PrioriteEnum(str, enum.Enum):
    faible = "faible"
    moyenne = "moyenne"
    haute = "haute"
    critique = "critique"

class NotifTypeEnum(str, enum.Enum):
    assignation = "assignation"
    commentaire = "commentaire"
    statut = "statut"
    deadline = "deadline"

class RapportTypeEnum(str, enum.Enum):
    journalier = "journalier"
    hebdomadaire = "hebdomadaire"
    mensuel = "mensuel"
    personnalise = "personnalise"

class RapportFormatEnum(str, enum.Enum):
    pdf = "pdf"
    excel = "excel"
    csv = "csv"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    mot_de_passe = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.client)
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    incidents_declares = relationship("Incident", foreign_keys="Incident.declarant_id", back_populates="declarant")
    incidents_assignes = relationship("Incident", foreign_keys="Incident.assigne_id", back_populates="assigne")
    commentaires = relationship("Commentaire", back_populates="auteur")
    notifications = relationship("Notification", back_populates="utilisateur")
    rapports = relationship("Rapport", back_populates="genere_par_user")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    parent = relationship("Category", remote_side="Category.id", back_populates="enfants")
    enfants = relationship("Category", back_populates="parent")
    incidents = relationship("Incident", back_populates="categorie")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String(255), nullable=False)
    description = Column(Text)
    statut = Column(Enum(StatutEnum), default=StatutEnum.en_attente, index=True)
    priorite = Column(Enum(PrioriteEnum), default=PrioriteEnum.moyenne, index=True)
    categorie_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    declarant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigne_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    notes_technicien = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime, nullable=True)
    deadline = Column(DateTime, nullable=True)
    declarant = relationship("User", foreign_keys=[declarant_id], back_populates="incidents_declares")
    assigne = relationship("User", foreign_keys=[assigne_id], back_populates="incidents_assignes")
    categorie = relationship("Category", back_populates="incidents")
    commentaires = relationship("Commentaire", back_populates="incident", cascade="all, delete-orphan")
    historique = relationship("HistoriqueStatut", back_populates="incident", cascade="all, delete-orphan")
    pieces_jointes = relationship("PieceJointe", back_populates="incident", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="incident", cascade="all, delete-orphan")
    rapports = relationship("Rapport", back_populates="incident")

class Commentaire(Base):
    __tablename__ = "commentaires"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    auteur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contenu = Column(Text, nullable=False)
    interne = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    incident = relationship("Incident", back_populates="commentaires")
    auteur = relationship("User", back_populates="commentaires")

class HistoriqueStatut(Base):
    __tablename__ = "historique_statuts"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    ancien_statut = Column(String(50))
    nouveau_statut = Column(String(50))
    modifie_par = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    incident = relationship("Incident", back_populates="historique")

class PieceJointe(Base):
    __tablename__ = "pieces_jointes"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    nom_fichier = Column(String(255), nullable=False)
    chemin = Column(String(500), nullable=False)
    type_mime = Column(String(100))
    taille = Column(Integer)
    uploade_par = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    incident = relationship("Incident", back_populates="pieces_jointes")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    utilisateur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=True)
    type = Column(Enum(NotifTypeEnum))
    message = Column(Text)
    lu = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    utilisateur = relationship("User", back_populates="notifications")
    incident = relationship("Incident", back_populates="notifications")

class SLA(Base):
    __tablename__ = "sla"
    id = Column(Integer, primary_key=True, index=True)
    priorite = Column(Enum(PrioriteEnum), unique=True, nullable=False)
    delai_reponse_h = Column(Integer, nullable=False)
    delai_resolution_h = Column(Integer, nullable=False)

class Rapport(Base):
    __tablename__ = "rapports"
    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String(255), nullable=False)
    type = Column(Enum(RapportTypeEnum))
    format = Column(Enum(RapportFormatEnum))
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    genere_par = Column(Integer, ForeignKey("users.id"))
    chemin_fichier = Column(String(500))
    taille = Column(Integer)
    notes_technicien = Column(Text, nullable=True)
    publie_client = Column(Boolean, default=False, nullable=False)
    supprime = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    incident = relationship("Incident", back_populates="rapports")
    genere_par_user = relationship("User", back_populates="rapports")
    filtres = relationship("RapportFiltre", back_populates="rapport", cascade="all, delete-orphan")

class RapportFiltre(Base):
    __tablename__ = "rapport_filtres"
    id = Column(Integer, primary_key=True, index=True)
    rapport_id = Column(Integer, ForeignKey("rapports.id", ondelete="CASCADE"), nullable=False)
    date_debut = Column(Date, nullable=True)
    date_fin = Column(Date, nullable=True)
    statut_filtre = Column(String(50), nullable=True)
    priorite_filtre = Column(String(50), nullable=True)
    categorie_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    assigne_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    rapport = relationship("Rapport", back_populates="filtres")
