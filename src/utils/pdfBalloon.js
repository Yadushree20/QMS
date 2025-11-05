import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function addBalloonsToPdf(pdfBytes, balloonCount = 30) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const balloonsPerPage = Math.ceil(balloonCount / pages.length);
  let globalIndex = 1;

  for (const page of pages) {
    const { width, height } = page.getSize();
    const cols = Math.ceil(Math.sqrt(balloonsPerPage));
    const rows = Math.ceil(balloonsPerPage / cols);
    const cellW = width / (cols + 1);
    const cellH = height / (rows + 1);

    for (let r = 1; r <= rows && globalIndex <= balloonCount; r++) {
      for (let c = 1; c <= cols && globalIndex <= balloonCount; c++) {
        const cx = c * cellW;
        const cy = height - r * cellH;

        page.drawCircle({
          x: cx,
          y: cy,
          size: 12,
          borderColor: rgb(1, 0, 0),
          borderWidth: 2,
          opacity: 0.8,
        });

        const text = globalIndex.toString();
        const textWidth = font.widthOfTextAtSize(text, 12);
        page.drawText(text, {
          x: cx - textWidth / 2,
          y: cy - 8,
          size: 12,
          font,
          color: rgb(1, 1, 1),
        });

        globalIndex++;
      }
    }
  }

  return await pdfDoc.save();
}