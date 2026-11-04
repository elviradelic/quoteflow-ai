
from io import BytesIO
from decimal import Decimal
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)


PURPLE = colors.HexColor("#7454E8")
DARK = colors.HexColor("#252A40")
MUTED = colors.HexColor("#7B8196")
LIGHT = colors.HexColor("#F4F1FF")
BORDER = colors.HexColor("#E9EAF1")


def safe_text(value):
    return escape(str(value or ""))


def money(value, currency):
    amount = Decimal(str(value))
    return f"{currency} {amount:,.2f}"


def generate_quote_pdf(quote):
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=(595.28, 841.89),
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45,
        title=f"Quote QT-{quote.id:03d}",
        author="QuoteFlow AI",
    )

    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="BrandCustom",
            fontName="Helvetica-Bold",
            fontSize=19,
            leading=24,
            textColor=PURPLE,
        )
    )

    styles.add(
        ParagraphStyle(
            name="TitleCustom",
            fontName="Helvetica-Bold",
            fontSize=25,
            leading=31,
            textColor=DARK,
            alignment=TA_RIGHT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="LabelCustom",
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=13,
            textColor=MUTED,
        )
    )

    styles.add(
        ParagraphStyle(
            name="BodyCustom",
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            textColor=DARK,
        )
    )

    styles.add(
        ParagraphStyle(
            name="RightCustom",
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            textColor=DARK,
            alignment=TA_RIGHT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="TableHeaderCustom",
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=13,
            textColor=colors.white,
        )
    )

    styles.add(
        ParagraphStyle(
            name="TableCellCustom",
            fontName="Helvetica",
            fontSize=9,
            leading=14,
            textColor=DARK,
        )
    )

    styles.add(
        ParagraphStyle(
            name="TableCellRightCustom",
            parent=styles["TableCellCustom"],
            alignment=TA_RIGHT,
        )
    )

    story = []

    header = Table(
        [
            [
                Paragraph("QuoteFlow AI", styles["BrandCustom"]),
                Paragraph("QUOTATION", styles["TitleCustom"]),
            ]
        ],
        colWidths=[250, 255],
    )

    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    story.append(header)
    story.append(Spacer(1, 28))

    created_at = quote.created_at.strftime("%B %d, %Y")

    info = Table(
        [
            [
                Paragraph("PREPARED FOR", styles["LabelCustom"]),
                Paragraph("QUOTE DETAILS", styles["LabelCustom"]),
            ],
            [
                Paragraph(
                    safe_text(quote.client_name),
                    styles["BodyCustom"],
                ),
                Paragraph(
                    f"Quote: QT-{quote.id:03d}",
                    styles["RightCustom"],
                ),
            ],
            [
                Paragraph(
                    safe_text(quote.project_name),
                    styles["BodyCustom"],
                ),
                Paragraph(
                    safe_text(created_at),
                    styles["RightCustom"],
                ),
            ],
        ],
        colWidths=[252, 253],
    )

    info.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    story.append(info)
    story.append(Spacer(1, 28))

    rows = [
        [
            Paragraph("DESCRIPTION", styles["TableHeaderCustom"]),
            Paragraph("QTY", styles["TableHeaderCustom"]),
            Paragraph("UNIT PRICE", styles["TableHeaderCustom"]),
            Paragraph("AMOUNT", styles["TableHeaderCustom"]),
        ]
    ]

    subtotal = Decimal("0.00")

    for item in quote.items:
        line_total = item.quantity * item.unit_price
        subtotal += line_total

        rows.append(
            [
                Paragraph(
                    safe_text(item.description),
                    styles["TableCellCustom"],
                ),
                Paragraph(
                    str(item.quantity),
                    styles["TableCellRightCustom"],
                ),
                Paragraph(
                    money(item.unit_price, quote.currency),
                    styles["TableCellRightCustom"],
                ),
                Paragraph(
                    money(line_total, quote.currency),
                    styles["TableCellRightCustom"],
                ),
            ]
        )

    items_table = Table(
        rows,
        colWidths=[210, 55, 115, 125],
        repeatRows=1,
        hAlign="LEFT",
    )

    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PURPLE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("LINEBELOW", (0, 1), (-1, -1), 0.5, BORDER),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [
                    colors.white,
                    colors.HexColor("#FAFAFD"),
                ]),
            ]
        )
    )

    story.append(items_table)
    story.append(Spacer(1, 24))

    total_table = Table(
        [
            [
                Paragraph("TOTAL", styles["LabelCustom"]),
                Paragraph(
                    money(subtotal, quote.currency),
                    styles["TitleCustom"],
                ),
            ]
        ],
        colWidths=[252, 253],
    )

    total_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 16),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
            ]
        )
    )

    story.append(KeepTogether(total_table))
    story.append(Spacer(1, 35))

    story.append(
        Paragraph(
            "Thank you for considering this proposal.",
            styles["BodyCustom"],
        )
    )

    story.append(Spacer(1, 8))

    story.append(
        Paragraph(
            "Taxes and discounts are not included. "
            "Please confirm the final terms before acceptance.",
            styles["BodyCustom"],
        )
    )

    def draw_footer(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(BORDER)
        canvas.line(45, 42, 550, 42)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(
            45,
            28,
            "Generated with QuoteFlow AI",
        )
        canvas.drawRightString(
            550,
            28,
            f"Page {doc.page}",
        )
        canvas.restoreState()

    document.build(
        story,
        onFirstPage=draw_footer,
        onLaterPages=draw_footer,
    )

    buffer.seek(0)
    return buffer
