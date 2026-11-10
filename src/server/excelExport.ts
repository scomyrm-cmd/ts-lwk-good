import ExcelJS from 'exceljs';

export interface StudentExportItem {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  className: string;
  gender?: string;
  dateOfBirth?: string;
  guardianContact?: string;
  todayStatus?: string;
  attendanceRatePercent?: number | null;
  totalAbsences?: number;
  notes?: string;
  createdAt?: string;
}

// Formula Injection Sanitizer
// Prevents DDE/CSV/Excel formula execution via =, +, -, @, tab, or carriage return
export function sanitizeExcelCell(val: any): any {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  const raw = String(val);
  if (/^[=+\-@\t\r]/.test(raw) || /^[=+\-@\t\r]/.test(raw.trim())) {
    return `'${raw}`;
  }
  return raw.trim();
}

export async function generateStudentsExcelWorkbook(options: {
  schoolName: string;
  exportedBy: string;
  exportDate: string;
  students: StudentExportItem[];
  filterClass?: string;
  filterStatus?: string;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Campus OS Educational System';
  workbook.lastModifiedBy = options.exportedBy;
  workbook.created = new Date();
  workbook.modified = new Date();

  const excelDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value.slice(0, 10) + 'T00:00:00Z');
    return Number.isFinite(date.valueOf()) ? date : null;
  };

  const worksheet = workbook.addWorksheet('Student Registry', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
    views: [{ state: 'frozen', ySplit: 5 }],
  });

  // Title Banner
  worksheet.mergeCells('A1:L1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `${options.schoolName.toUpperCase()} — OFFICIAL STUDENT REGISTRY`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Deep Blue
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 34;

  // Metadata Row
  worksheet.mergeCells('A2:L2');
  const metaCell = worksheet.getCell('A2');
  metaCell.value = `Export Date: ${options.exportDate} | Administrator: ${options.exportedBy} | Total Records: ${options.students.length}${options.filterClass && options.filterClass !== 'all' ? ` | Filter: Class ${options.filterClass}` : ''}`;
  metaCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  metaCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  };
  metaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(2).height = 20;

  // Blank row
  worksheet.getRow(3).height = 8;

  // Headers (Row 4)
  const headers = [
    { key: 'studentId', label: 'Student ID', width: 16 },
    { key: 'fullName', label: 'Full Name', width: 24 },
    { key: 'className', label: 'Class / Grade', width: 16 },
    { key: 'gender', label: 'Gender', width: 12 },
    { key: 'dateOfBirth', label: 'Date of Birth', width: 15 },
    { key: 'guardianContact', label: 'Guardian Phone', width: 20 },
    { key: 'todayStatus', label: "Today's Status", width: 16 },
    { key: 'attendanceRate', label: 'Attendance %', width: 16 },
    { key: 'totalAbsences', label: 'Total Absences', width: 16 },
    { key: 'notes', label: 'Administrative Notes', width: 30 },
    { key: 'registeredDate', label: 'Registration Date', width: 18 },
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.height = 26;

  headers.forEach((h, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.label;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }, // Primary Blue
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
    worksheet.getColumn(colNumber).width = h.width;
  });

  // Populate Data Rows
  options.students.forEach((s, idx) => {
    const rowIndex = idx + 5;
    const row = worksheet.getRow(rowIndex);
    row.height = 22;

    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    const values = [
      sanitizeExcelCell(s.studentId),
      sanitizeExcelCell(`${s.firstName} ${s.lastName}`.trim()),
      sanitizeExcelCell(s.className),
      sanitizeExcelCell(s.gender || 'Not specified'),
      excelDate(s.dateOfBirth),
      sanitizeExcelCell(s.guardianContact || '-'),
      sanitizeExcelCell(s.todayStatus ? s.todayStatus.toUpperCase() : 'UNMARKED'),
      s.attendanceRatePercent == null ? null : s.attendanceRatePercent / 100,
      sanitizeExcelCell(s.totalAbsences ?? 0),
      sanitizeExcelCell(s.notes || '-'),
      excelDate(s.createdAt),
    ];

    values.forEach((val, vIdx) => {
      const cell = row.getCell(vIdx + 1);
      cell.value = val;
      if (vIdx === 4 || vIdx === 10) cell.numFmt = 'yyyy-mm-dd';
      if (vIdx === 7) cell.numFmt = '0%';
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Alignment rules
      if (vIdx === 0 || vIdx === 3 || vIdx === 4 || vIdx === 6 || vIdx === 7 || vIdx === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      }

      // Status color highlighting
      if (vIdx === 6) {
        const statusUpper = String(val).toUpperCase();
        if (statusUpper.includes('PRESENT')) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF16A34A' } };
        } else if (statusUpper.includes('ABSENT')) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
        } else if (statusUpper.includes('LATE')) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFD97706' } };
        }
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
