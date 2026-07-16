import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DepositRow {
  date: Date;
  qty: number;
  unit: string;
  grade: string | null;
  status: string;
  productName?: string;
}

interface ExportOptions {
  memberName: string;
  memberNumber: string;
  month: Date;
  deposits: DepositRow[];
  totalQty: number;
  avgPerDay: number;
  daysCount: number;
}

export function generateDepositPDF(options: ExportOptions): jsPDF {
  const doc = new jsPDF();
  const {
    memberName,
    memberNumber,
    month,
    deposits,
    totalQty,
    avgPerDay,
    daysCount,
  } = options;

  const pageWidth = doc.internal.pageSize.width;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const monthName = format(month, 'MMMM yyyy', { locale: id });

  // Colors
  const primaryColor: [number, number, number] = [27, 77, 62]; // #1B4D3E
  const textDark: [number, number, number] = [30, 30, 30];
  const textMuted: [number, number, number] = [100, 100, 100];
  const bgLight: [number, number, number] = [245, 240, 232]; // cream

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RIWAYAT SETORAN', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('KUD TRANSPARANSI', pageWidth / 2, 24, { align: 'center' });

  doc.setFontSize(10);
  doc.text(monthName, pageWidth / 2, 32, { align: 'center' });

  // Member Info Card
  const infoY = 45;
  doc.setFillColor(...bgLight);
  doc.roundedRect(marginLeft, infoY, contentWidth, 25, 3, 3, 'F');

  doc.setTextColor(...textDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Anggota', marginLeft + 5, infoY + 8);
  doc.text('No. Anggota', marginLeft + 5, infoY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(memberName, marginLeft + 60, infoY + 8);
  doc.text(memberNumber, marginLeft + 60, infoY + 18);

  // Summary Section
  const summaryY = 80;
  doc.setTextColor(...textDark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN BULAN INI', marginLeft, summaryY);

  // Deposit Table
  const tableStartY = summaryY;

  const tableData = deposits.map((d, i) => [
    i + 1,
    format(d.date, 'dd/MM/yyyy'),
    d.productName || '-',
    d.qty > 0 ? `${d.qty.toFixed(1)} ${d.unit}` : '-',
    d.grade || '-',
    d.qty > 0 ? 'Setor' : 'Libur',
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['No', 'Tanggal', 'Produk', 'Jumlah', 'Grade', 'Status']],
    body: tableData,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: bgLight,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 50;
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(
    `Dicetak: ${format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id })}`,
    marginLeft,
    finalY + 15
  );
  doc.text(
    'KUD Transparansi - Portal Anggota',
    pageWidth - marginRight,
    finalY + 15,
    { align: 'right' }
  );

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  return doc;
}

export function generateMemberQRUrl(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/portal/${token}`;
}
