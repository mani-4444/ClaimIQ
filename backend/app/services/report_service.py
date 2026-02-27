import io
from typing import Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.utils.logger import logger


class ReportService:
    """Generate PDF claim reports."""

    async def generate_pdf(self, claim: dict) -> io.BytesIO:
        """Generate a PDF report for a processed claim."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=20,
            spaceAfter=12,
            textColor=colors.HexColor("#1a1a2e"),
        )
        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            fontSize=14,
            spaceAfter=8,
            textColor=colors.HexColor("#16213e"),
        )

        elements = []

        # Title
        elements.append(Paragraph("ClaimIQ — Claim Report", title_style))
        elements.append(Spacer(1, 6 * mm))

        # Claim Info
        elements.append(Paragraph("Claim Information", heading_style))
        claim_info = [
            ["Claim ID", str(claim.get("id", "N/A"))],
            ["Status", str(claim.get("status", "N/A")).upper()],
            ["Policy Number", str(claim.get("policy_number", "N/A"))],
            ["Created", str(claim.get("created_at", "N/A"))],
            ["Processed", str(claim.get("processed_at", "N/A"))],
        ]
        elements.append(self._make_table(claim_info))
        elements.append(Spacer(1, 6 * mm))

        # Damage Summary
        elements.append(Paragraph("Damage Assessment", heading_style))
        damage_json = claim.get("damage_json")
        if damage_json:
            if isinstance(damage_json, str):
                import json
                damage_json = json.loads(damage_json)

            damage_data = [["Zone", "Severity", "Confidence"]]
            for d in damage_json:
                damage_data.append([
                    str(d.get("zone", "N/A")),
                    str(d.get("severity", "N/A")).capitalize(),
                    f"{float(d.get('confidence', 0)):.0%}",
                ])
            elements.append(self._make_table(damage_data, header=True))
        else:
            elements.append(Paragraph("No damage data available.", styles["Normal"]))
        elements.append(Spacer(1, 6 * mm))

        # Cost Breakdown
        elements.append(Paragraph("Cost Breakdown", heading_style))
        cost_breakdown = claim.get("cost_breakdown")
        if cost_breakdown:
            if isinstance(cost_breakdown, str):
                import json
                cost_breakdown = json.loads(cost_breakdown)

            cost_data = [["Zone", "Severity", "Base Cost", "Labor", "Total"]]
            for c in cost_breakdown:
                cost_data.append([
                    str(c.get("zone", "N/A")),
                    str(c.get("severity", "N/A")).capitalize(),
                    f"₹{c.get('base_cost', 0):,}",
                    f"₹{c.get('labor_cost', 0):,}",
                    f"₹{c.get('total', 0):,}",
                ])
            cost_data.append(["", "", "", "TOTAL", f"₹{claim.get('cost_total', 0):,}"])
            elements.append(self._make_table(cost_data, header=True))
        else:
            elements.append(Paragraph("No cost data available.", styles["Normal"]))
        elements.append(Spacer(1, 6 * mm))

        # Fraud Analysis
        elements.append(Paragraph("Fraud Analysis", heading_style))
        fraud_info = [
            ["Fraud Score", f"{claim.get('fraud_score', 0)} / 100"],
            ["Risk Level", str(claim.get('risk_level', 'N/A')).capitalize()],
        ]
        fraud_flags = claim.get("fraud_flags", [])
        if fraud_flags:
            fraud_info.append(["Flags", ", ".join(fraud_flags)])
        elements.append(self._make_table(fraud_info))
        elements.append(Spacer(1, 6 * mm))

        # Decision
        elements.append(Paragraph("Decision", heading_style))
        decision_info = [
            ["Decision", str(claim.get("decision", "N/A")).replace("_", " ").title()],
            ["Confidence", f"{float(claim.get('decision_confidence', 0)):.0%}"],
            ["Risk Level", str(claim.get('risk_level', 'N/A')).capitalize()],
        ]
        elements.append(self._make_table(decision_info))
        elements.append(Spacer(1, 6 * mm))

        # AI Explanation
        ai_explanation = claim.get("ai_explanation")
        if ai_explanation:
            elements.append(Paragraph("AI Explanation", heading_style))
            elements.append(Paragraph(ai_explanation, styles["Normal"]))

        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        logger.info(f"PDF report generated for claim {claim.get('id')}")
        return buffer

    def _make_table(self, data: list, header: bool = False) -> Table:
        """Create a styled table."""
        table = Table(data, hAlign="LEFT")
        style_commands = [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0e0e0") if header else colors.HexColor("#f5f5f5")),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]
        table.setStyle(TableStyle(style_commands))
        return table
