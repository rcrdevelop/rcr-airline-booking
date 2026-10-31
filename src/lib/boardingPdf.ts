import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { Booking, Flight } from "@/lib/flights";
import { fmtTime } from "@/lib/flights";

const BLUE = rgb(0.11, 0.31, 0.85);
const DARK = rgb(0.06, 0.09, 0.16);
const GREY = rgb(0.39, 0.45, 0.55);

/** Genera y descarga un PDF con un pase de abordar por pasajero y tramo. */
export async function downloadBoardingPassPdf(b: Booking) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const legs: { f: Flight; seat: (i: number) => string | undefined }[] = [
    { f: b.flight, seat: i => b.seats[i] }
  ];
  if (b.returnFlight)
    legs.push({ f: b.returnFlight, seat: i => b.returnSeats[i] });

  for (const { f, seat } of legs) {
    for (let i = 0; i < b.passengers.length; i++) {
      const pax = b.passengers[i]!;
      const page = doc.addPage([640, 300]);
      const { height } = page.getSize();

      page.drawRectangle({
        x: 0,
        y: height - 64,
        width: 640,
        height: 64,
        color: BLUE
      });
      page.drawText(f.airline.toUpperCase(), {
        x: 24,
        y: height - 40,
        size: 20,
        font: bold,
        color: rgb(1, 1, 1)
      });
      page.drawText(`PNR  ${b.pnr}`, {
        x: 480,
        y: height - 40,
        size: 16,
        font: bold,
        color: rgb(1, 1, 1)
      });
      page.drawText(`BOARDING PASS · ${b.cabin.toUpperCase()}`, {
        x: 24,
        y: height - 56,
        size: 9,
        font,
        color: rgb(0.85, 0.9, 1)
      });

      page.drawText(f.origin, {
        x: 24,
        y: height - 130,
        size: 44,
        font: bold,
        color: DARK
      });
      page.drawText(fmtTime(f.departure), {
        x: 24,
        y: height - 152,
        size: 11,
        font,
        color: GREY
      });
      page.drawText("→", {
        x: 300,
        y: height - 128,
        size: 28,
        font: bold,
        color: BLUE
      });
      page.drawText(f.destination, {
        x: 400,
        y: height - 130,
        size: 44,
        font: bold,
        color: DARK
      });
      page.drawText(fmtTime(f.arrival), {
        x: 400,
        y: height - 152,
        size: 11,
        font,
        color: GREY
      });

      field(page, font, bold, 24, height - 210, "PASAJERO", pax.name);
      field(page, font, bold, 220, height - 210, "VUELO", f.number);
      field(page, font, bold, 340, height - 210, "ASIENTO", seat(i) ?? "—");
      field(page, font, bold, 450, height - 210, "ESTADO", b.status);

      const payload = `RCRCHECKIN|${b.pnr}|${f.number}|${seat(i)}|${pax.name}`;
      const qrPng = await doc.embedPng(
        await QRCode.toDataURL(payload, { width: 120, margin: 0 })
      );
      page.drawImage(qrPng, { x: 480, y: 24, width: 110, height: 110 });
      page.drawText("Escanear en puerta", {
        x: 488,
        y: 14,
        size: 8,
        font,
        color: GREY
      });
      page.drawLine({
        start: { x: 24, y: 160 },
        end: { x: 616, y: 160 },
        thickness: 0.5,
        color: GREY
      });
      page.drawText(
        `Emitido ${new Date(b.createdAt).toLocaleString("es-ES")} · Documento no válido como identificación`,
        { x: 24, y: 24, size: 8, font, color: GREY }
      );
    }
  }

  const bytes = await doc.save();
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: "application/pdf"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `boarding-pass-${b.pnr}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function field(
  page: import("pdf-lib").PDFPage,
  font: import("pdf-lib").PDFFont,
  bold: import("pdf-lib").PDFFont,
  x: number,
  y: number,
  label: string,
  value: string
) {
  page.drawText(label, { x, y: y + 18, size: 8, font, color: GREY });
  page.drawText(value.slice(0, 26), {
    x,
    y,
    size: 12,
    font: bold,
    color: DARK
  });
}
