#!/usr/bin/env python
"""
Initialise les comptes de base: un admin, trois techniciens et un client demo.
"""
from database import SessionLocal, init_db
from models import User, RoleEnum
from core.security import hash_password

USERS_DATA = [
    {
        "nom": "Admin",
        "prenom": "Principal",
        "email": "admin1@gmail.com",
        "password": "Admin123!@#",
        "role": RoleEnum.admin,
    },
    {
        "nom": "Tech",
        "prenom": "Reseau",
        "email": "tech1@gmail.com",
        "password": "Tech123!@#",
        "role": RoleEnum.technicien,
    },
    {
        "nom": "Tech",
        "prenom": "Materiel",
        "email": "tech2@gmail.com",
        "password": "Tech123!@#",
        "role": RoleEnum.technicien,
    },
    {
        "nom": "Tech",
        "prenom": "Logiciel",
        "email": "tech3@gmail.com",
        "password": "Tech123!@#",
        "role": RoleEnum.technicien,
    },
    {
        "nom": "Mahdi",
        "prenom": "Technicien",
        "email": "mahdi@gmail.com",
        "password": "Tech123!@#",
        "role": RoleEnum.technicien,
    },
    {
        "nom": "Client",
        "prenom": "Utilisateur",
        "email": "client@gmail.com",
        "password": "Client123!@#",
        "role": RoleEnum.client,
    },
]


def setup_users():
    init_db()
    db = SessionLocal()

    try:
        db.query(User).filter(User.role.in_([RoleEnum.admin, RoleEnum.technicien])).delete(synchronize_session=False)
        db.commit()

        for user_data in USERS_DATA:
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                db.delete(existing_user)
                db.commit()

            user = User(
                nom=user_data["nom"],
                prenom=user_data["prenom"],
                email=user_data["email"],
                mot_de_passe=hash_password(user_data["password"]),
                role=user_data["role"],
                actif=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            print(f"{user.role.value}: {user.email} / {user_data['password']}")
    except Exception as exc:
        db.rollback()
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    setup_users()
