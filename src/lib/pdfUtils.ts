import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportToPdf(elementId: string, fileName: string = 'document.pdf') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const originalStyle = element.getAttribute('style') || '';
  element.style.width = '794px';
  element.style.minWidth = '794px';
  element.style.maxWidth = '794px';
  element.style.backgroundColor = '#ffffff';
  element.style.border = '2px solid #000';
  element.style.padding = '1cm';
  element.style.boxSizing = 'border-box';

  const images = element.querySelectorAll('img');
  await Promise.all(Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>(resolve => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  }));

  await new Promise(r => setTimeout(r, 300));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: 794,
    windowWidth: 794,
  });

  element.setAttribute('style', originalStyle);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const margin = 5;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, margin, pdfWidth - margin * 2, pdfHeight - margin * 2);

  const contentWidth = pdfWidth - margin * 4;
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = contentWidth / imgWidth;
  let scaledHeight = imgHeight * ratio;
  const maxContentHeight = pdfHeight - margin * 4;

  let finalWidth = contentWidth;
  let finalHeight = scaledHeight;
  if (scaledHeight > maxContentHeight) {
    const scale = maxContentHeight / scaledHeight;
    finalWidth = contentWidth * scale;
    finalHeight = maxContentHeight;
  }

  const imgX = (pdfWidth - finalWidth) / 2;
  const imgY = margin * 2;

  pdf.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight);
  pdf.save(fileName);
}

export async function exportToHtml(elementId: string, fileName: string = 'document.html') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fileName.replace('.html', '')}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; color: #000; font-weight: bold; background: #fff; }
  .print-page { max-width: 210mm; margin: 0 auto; padding: 1cm; border: 2px solid #000; border-radius: 5px; font-size: 13px; line-height: 1.4; }
  .compact-table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 12px; }
  .compact-table th, .compact-table td { border: 1px solid #000; padding: 3px 6px; text-align: center; vertical-align: middle; }
  .compact-table th { background-color: #f0f0f0; }
  .flex-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .dotted-line { flex-grow: 1; border-bottom: 1.5px dotted #000; margin: 0 10px; text-align: center; font-weight: bold; min-width: 60px; }
  .out-text { font-weight: bold; color: #000 !important; }
  .box { border: 1px solid #000; border-radius: 6px; padding: 6px 10px; margin-bottom: 6px; background-color: #fcfcfc; }
  .box-receipt { background-color: #f9f9f9; border: 2px solid #000; }
</style>
</head>
<body>
${element.outerHTML}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function shareViaWhatsApp(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function shareViaEmail(subject: string, body: string) {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, '_blank');
}

export function printElement(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; color: #000; font-weight: bold; }
  body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; margin: 0; padding: 0; }
  .print-page { max-width: 210mm; margin: 0 auto; padding: 1cm; border: 2px solid #000; font-size: 13px; line-height: 1.4; }
  .compact-table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 12px; }
  .compact-table th, .compact-table td { border: 1px solid #000; padding: 3px 6px; text-align: center; vertical-align: middle; }
  .compact-table th { background-color: #f0f0f0; }
  .flex-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .dotted-line { flex-grow: 1; border-bottom: 1.5px dotted #000; margin: 0 10px; text-align: center; font-weight: bold; min-width: 60px; }
  .out-text { font-weight: bold; color: #000 !important; }
  .box { border: 1px solid #000; border-radius: 6px; padding: 6px 10px; margin-bottom: 6px; }
  .box-receipt { background-color: #f9f9f9; border: 2px solid #000; }
  .signature-display { width: 200px; height: auto; max-height: 120px; filter: contrast(2.5) brightness(0.3) saturate(2); }
  @page { size: A4; margin: 0.5cm; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>${element.outerHTML}</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
}
