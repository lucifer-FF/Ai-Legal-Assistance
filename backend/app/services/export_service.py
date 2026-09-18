import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable


def generate_document_pdf_report(doc_title: str, analysis: dict, risks: list, dates: list, checklist_items: list) -> bytes:
    """
    Generate an executive legal intelligence PDF report.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#94A3B8'),
        spaceBefore=10
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("LexiGuard Legal Intelligence Dossier", title_style))
    story.append(Paragraph(f"Document: <b>{doc_title}</b> | Generated on: {datetime.now().strftime('%B %d, %Y')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=10))

    # Executive Summary
    summary_text = analysis.get("summary", "No executive summary available.")
    story.append(Paragraph("Executive Summary", h2_style))
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 10))

    # Key Metadata Table
    doc_type = analysis.get("document_type", "General Agreement")
    eff_date = analysis.get("effective_date", "Unspecified")
    exp_date = analysis.get("expiry_date", "Unspecified")
    jurisdiction = analysis.get("governing_jurisdiction", "Unspecified")

    meta_data = [
        ["Document Type", doc_type, "Governing Law", jurisdiction],
        ["Effective Date", eff_date, "Term / Expiration", exp_date]
    ]
    meta_table = Table(meta_data, colWidths=[110, 150, 110, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0F172A')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # Potential Risks Section
    if risks:
        story.append(Paragraph("Identified Legal Risks & Exposures", h2_style))
        risk_rows = [["Risk Level", "Finding Title", "Source", "Explanation"]]
        for r in risks[:6]:
            level = getattr(r, "level", "MEDIUM")
            title = getattr(r, "title", "Risk")
            sec = getattr(r, "section_ref", "")
            exp = getattr(r, "explanation", "")[:120] + "..."
            risk_rows.append([level, title, sec, exp])

        risk_table = Table(risk_rows, colWidths=[70, 130, 80, 240])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(risk_table)
        story.append(Spacer(1, 14))

    # Important Dates Section
    if dates:
        story.append(Paragraph("Key Deadlines & Dates", h2_style))
        date_rows = [["Event", "Date / Window", "Type", "Section"]]
        for d in dates[:6]:
            event = getattr(d, "event_name", "Deadline")
            d_str = getattr(d, "date_str", "Unspecified")
            d_type = getattr(d, "date_type", "Deadline")
            sec = getattr(d, "section_ref", "")
            date_rows.append([event, d_str, d_type, sec])

        date_table = Table(date_rows, colWidths=[160, 140, 100, 120])
        date_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(date_table)
        story.append(Spacer(1, 14))

    # Actionable Checklist Section
    if checklist_items:
        story.append(Paragraph("Actionable Legal Verification Checklist", h2_style))
        for item in checklist_items[:8]:
            status_box = "[X]" if getattr(item, "is_completed", False) else "[  ]"
            title = getattr(item, "title", "Task")
            sec = getattr(item, "section_ref", "")
            pri = getattr(item, "priority", "MEDIUM")
            story.append(Paragraph(f"{status_box} <b>{title}</b> ({pri}) — <i>{sec}</i>", body_style))
        story.append(Spacer(1, 14))

    # Mandatory Legal Safety Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
    disclaimer_text = (
        "<b>LEGAL DISCLAIMER:</b> LexiGuard provides AI-generated legal information and document analysis for informational "
        "purposes only. It does not provide legal advice, establish an attorney-client relationship, or replace a qualified "
        "legal professional. Users must consult with an attorney licensed in their jurisdiction for formal legal counsel."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    return buffer.getvalue()
