import csv
import os
from datetime import datetime

from sqlalchemy.orm import Session

from core.config import settings
from models import Incident, Rapport, RapportFiltre


def _enum_value(value):
    return value.value if hasattr(value, "value") else value


def _user_name(user):
    if not user:
        return "Non renseigne"
    return f"{user.prenom} {user.nom} ({user.email})"


def _category_name(category):
    return category.nom if category else "Non classe"


def _format_dt(value):
    return value.strftime("%Y-%m-%d %H:%M") if value else ""


def _incident_row(inc):
    return [
        inc.id,
        inc.titre,
        inc.description or "",
        _enum_value(inc.statut),
        _enum_value(inc.priorite),
        _category_name(inc.categorie),
        _user_name(inc.declarant),
        _user_name(inc.assigne),
        _format_dt(inc.created_at),
        _format_dt(inc.updated_at),
        _format_dt(inc.deadline),
        _format_dt(inc.resolved_at),
        inc.notes_technicien or "",
    ]


def _technician_notes(data):
    return (getattr(data, "notes_technicien", None) or "").strip()


def generer_rapport(db: Session, data, user_id: int):
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)

    query = db.query(Incident)
    if getattr(data, "incident_id", None):
        query = query.filter(Incident.id == data.incident_id)
    if data.date_debut:
        query = query.filter(Incident.created_at >= data.date_debut)
    if data.date_fin:
        query = query.filter(Incident.created_at <= data.date_fin)
    if data.statut_filtre:
        query = query.filter(Incident.statut == data.statut_filtre)
    if data.priorite_filtre:
        query = query.filter(Incident.priorite == data.priorite_filtre)
    if data.categorie_id:
        query = query.filter(Incident.categorie_id == data.categorie_id)
    if data.assigne_id:
        query = query.filter(Incident.assigne_id == data.assigne_id)
    incidents = query.all()
    notes_technicien = _technician_notes(data)
    if not notes_technicien and getattr(data, "incident_id", None) and incidents:
        notes_technicien = (incidents[0].notes_technicien or "").strip()

    rapport_format = _enum_value(data.format)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{data.titre.replace(' ', '_')}_{timestamp}.{rapport_format}"
    filepath = os.path.join(settings.REPORTS_DIR, filename)

    rapport = Rapport(
        titre=data.titre,
        type=data.type,
        format=data.format,
        incident_id=getattr(data, "incident_id", None),
        genere_par=user_id,
        chemin_fichier=filepath,
        taille=0,
        notes_technicien=notes_technicien or None,
    )
    db.add(rapport)
    db.flush()

    if rapport_format == "csv":
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if notes_technicien:
                writer.writerow(["Notes du technicien", notes_technicien])
                writer.writerow([])
            writer.writerow([
                "ID", "Titre", "Description", "Statut", "Priorite", "Categorie",
                "Declarant", "Technicien", "Cree le", "Mis a jour", "Deadline", "Resolu le", "Notes du technicien",
            ])
            for inc in incidents:
                writer.writerow(_incident_row(inc))

    elif rapport_format == "excel":
        from openpyxl import Workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Incidents"
        if notes_technicien:
            ws.append(["Notes du technicien"])
            ws.append([notes_technicien])
            ws.append([])
        ws.append([
            "ID", "Titre", "Description", "Statut", "Priorite", "Categorie",
            "Declarant", "Technicien", "Cree le", "Mis a jour", "Deadline", "Resolu le", "Notes du technicien",
        ])
        for inc in incidents:
            ws.append(_incident_row(inc))
        for column in ws.columns:
            max_length = max(len(str(cell.value or "")) for cell in column)
            ws.column_dimensions[column[0].column_letter].width = min(max_length + 2, 42)
        wb.save(filepath)

    elif rapport_format == "pdf":
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=1.4 * cm,
            leftMargin=1.4 * cm,
            topMargin=1.2 * cm,
            bottomMargin=1.2 * cm,
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            textColor=colors.HexColor("#0f6b4f"),
            fontSize=18,
            leading=22,
            spaceAfter=12,
        )
        section_style = ParagraphStyle(
            "SectionTitle",
            parent=styles["Heading2"],
            textColor=colors.HexColor("#0f6b4f"),
            fontSize=12,
            leading=15,
            spaceBefore=10,
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["BodyText"],
            fontSize=9,
            leading=12,
        )
        small_style = ParagraphStyle(
            "Small",
            parent=styles["BodyText"],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#475569"),
        )

        def p(value, style=body_style):
            text = str(value or "-").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            text = "<br/>".join(text.splitlines())
            return Paragraph(text, style)

        story = [
            Paragraph(data.titre, title_style),
            Paragraph(f"Genere le {_format_dt(datetime.now())} | Nombre d'incidents: {len(incidents)}", small_style),
            Spacer(1, 8),
        ]

        if notes_technicien:
            story.append(Paragraph("Notes du technicien", section_style))
            story.extend([p(notes_technicien, body_style), Spacer(1, 10)])

        summary = {}
        for inc in incidents:
            summary[_enum_value(inc.statut)] = summary.get(_enum_value(inc.statut), 0) + 1

        story.append(Paragraph("Resume", section_style))
        summary_rows = [[p("Statut", small_style), p("Nombre", small_style)]]
        for status, count in sorted(summary.items()):
            summary_rows.append([p(status, body_style), p(count, body_style)])
        if len(summary_rows) == 1:
            summary_rows.append([p("Aucun incident", body_style), p("0", body_style)])
        summary_table = Table(summary_rows, colWidths=[10 * cm, 4 * cm])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f6b4f")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#fffdf6")),
        ]))
        story.extend([summary_table, Spacer(1, 10)])

        story.append(Paragraph("Synthese des incidents", section_style))
        table_rows = [[
            p("ID", small_style),
            p("Titre", small_style),
            p("Statut", small_style),
            p("Priorite", small_style),
            p("Categorie", small_style),
            p("Technicien", small_style),
        ]]
        for inc in incidents:
            table_rows.append([
                p(inc.id),
                p(inc.titre),
                p(_enum_value(inc.statut)),
                p(_enum_value(inc.priorite)),
                p(_category_name(inc.categorie)),
                p(_user_name(inc.assigne)),
            ])
        overview_table = Table(table_rows, colWidths=[1.1 * cm, 4.2 * cm, 2.1 * cm, 2.0 * cm, 3.0 * cm, 4.0 * cm], repeatRows=1)
        overview_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#d4af37")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#122118")),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        story.extend([overview_table, Spacer(1, 12)])

        story.append(Paragraph("Details", section_style))
        for inc in incidents:
            detail_rows = [
                [p("Titre", small_style), p(inc.titre)],
                [p("Description", small_style), p(inc.description or "Aucune description")],
                [p("Statut", small_style), p(_enum_value(inc.statut))],
                [p("Priorite", small_style), p(_enum_value(inc.priorite))],
                [p("Categorie", small_style), p(_category_name(inc.categorie))],
                [p("Declarant", small_style), p(_user_name(inc.declarant))],
                [p("Technicien", small_style), p(_user_name(inc.assigne))],
                [p("Date creation", small_style), p(_format_dt(inc.created_at))],
                [p("Mise a jour", small_style), p(_format_dt(inc.updated_at))],
                [p("Deadline", small_style), p(_format_dt(inc.deadline) or "Non definie")],
                [p("Resolution", small_style), p(_format_dt(inc.resolved_at) or "Non resolu")],
                [p("Notes du technicien", small_style), p(inc.notes_technicien or "Aucune note")],
            ]
            story.append(Paragraph(f"Incident #{inc.id}", section_style))
            detail_table = Table(detail_rows, colWidths=[3.2 * cm, 13.2 * cm])
            detail_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e8f4ef")),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#0f6b4f")),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            story.extend([detail_table, Spacer(1, 10)])

        doc.build(story)

    rapport.taille = os.path.getsize(filepath)

    filtre = RapportFiltre(
        rapport_id=rapport.id,
        date_debut=data.date_debut,
        date_fin=data.date_fin,
        statut_filtre=data.statut_filtre,
        priorite_filtre=data.priorite_filtre,
        categorie_id=data.categorie_id,
        assigne_id=data.assigne_id,
    )
    db.add(filtre)
    db.commit()
    db.refresh(rapport)
    return rapport, filepath
