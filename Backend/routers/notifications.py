from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Notification
from core.security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
@router.get("/")
def get_notifications(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    notifs = db.query(Notification).filter(
        Notification.utilisateur_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    return notifs

@router.put("/{notif_id}/lire")
def marquer_lu(notif_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.utilisateur_id == current_user.id
    ).first()
    if notif:
        notif.lu = True
        db.commit()
    return {"message": "Notification marquée comme lue"}

@router.put("/lire-tout")
@router.put("/lire-tout/")
def marquer_tout_lu(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.utilisateur_id == current_user.id,
        Notification.lu == False
    ).update({"lu": True})
    db.commit()
    return {"message": "Toutes les notifications marquées comme lues"}
