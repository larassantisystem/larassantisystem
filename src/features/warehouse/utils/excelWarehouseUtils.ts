import * as XLSX from 'xlsx';
import { MaterialStockSummary } from '../types/stockTypes';

/**
/*******************************************************************************
 * STOCK OPNAME EXCEL TEMPLATE & PARSER
 *******************************************************************************/

export const downloadStockOpnameTemplate = (materials: MaterialStockSummary[] = []) => {
  const todayYYMMDD = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  
  const sampleRows = materials.length > 0
    ? materials.slice(0, 5).map((m) => ({
        'Kode Material': m.materialCode,
        'Nama Material': m.materialName,
        'Satuan': m.unit,
        'Saldo Fisik (Aktual)': m.stockReleased || 100,
        'Catatan / Alasan Opname': 'Opname Bulanan Routine',
      }))
    : [
        {
          'Kode Material': 'B0001',
          'Nama Material': 'Aqua Demineralisata',
          'Satuan': 'kg',
          'Saldo Fisik (Aktual)': 500.5,
          'Catatan / Alasan Opname': 'Rekonsiliasi Timbang Akhir Bulan',
        },
        {
          'Kode Material': 'K0001',
          'Nama Material': 'Pot Cream 12.5g Transparan',
          'Satuan': 'pcs',
          'Saldo Fisik (Aktual)': 1200,
          'Catatan / Alasan Opname': 'Audit Fisik Rak Gudang',
        },
      ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  
  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Kode Material
    { wch: 35 }, // Nama Material
    { wch: 10 }, // Satuan
    { wch: 22 }, // Saldo Fisik
    { wch: 35 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Opname');

  XLSX.writeFile(workbook, `Template_Stock_Opname_CPKB_${todayYYMMDD}.xlsx`);
};

export const parseStockOpnameExcel = (file: File): Promise<Array<{
  materialCode: string;
  actualQuantity: number;
  reason?: string;
  unit?: string;
}>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsed = rawJson.map((row) => {
          const materialCode = String(
            row['Kode Material'] || row['Kode Bahan'] || row['Kode'] || row['materialCode'] || ''
          ).trim();

          const actualQuantity = Number(
            row['Saldo Fisik (Aktual)'] || row['Jumlah Fisik'] || row['Saldo Fisik'] || row['actualQuantity'] || row['Qty'] || 0
          );

          const reason = String(
            row['Catatan / Alasan Opname'] || row['Alasan Penyesuaian'] || row['Alasan'] || row['reason'] || 'Impor Opname Excel'
          ).trim();

          const unit = String(row['Satuan'] || row['unit'] || 'kg').trim();

          return { materialCode, actualQuantity, reason, unit };
        }).filter((item) => item.materialCode !== '' && !isNaN(item.actualQuantity));

        resolve(parsed);
      } catch (err) {
        reject(new Error('Gagal membaca file Excel Stock Opname. Pastikan format kolom sesuai template.'));
      }
    };

    reader.onerror = () => reject(new Error('Gagal mengunggah file.'));
    reader.readAsArrayBuffer(file);
  });
};

/*******************************************************************************
 * STOCK DEDUCTION (POTONG STOK) EXCEL TEMPLATE & PARSER
 *******************************************************************************/

export const downloadStockDeductTemplate = (materials: MaterialStockSummary[] = []) => {
  const todayYYMMDD = new Date().toISOString().slice(2, 10).replace(/-/g, '');

  const sampleRows = materials.length > 0
    ? materials.slice(0, 5).map((m, idx) => ({
        'Kode Material': m.materialCode,
        'Nama Material': m.materialName,
        'No Lot Internal (Kosongkan utk FEFO)': m.lots[0]?.lotInternalNumber || '',
        'Jumlah Potong': 10,
        'Satuan': m.unit,
        'No SPK / Work Order': `SPK-2026-00${idx + 1}`,
        'Target Batch Produksi': 'BATCH-LOTION-01',
        'Catatan Penimbangan': 'Penimbangan R. Bersih A',
      }))
    : [
        {
          'Kode Material': 'B0001',
          'Nama Material': 'Aqua Demineralisata',
          'No Lot Internal (Kosongkan utk FEFO)': 'LBB260901-01',
          'Jumlah Potong': 25.5,
          'Satuan': 'kg',
          'No SPK / Work Order': 'SPK-2026-1001',
          'Target Batch Produksi': 'BATCH-CREAM-2609',
          'Catatan Penimbangan': 'Batching Mixing Shift 1',
        },
        {
          'Kode Material': 'K0001',
          'Nama Material': 'Pot Cream 12.5g Transparan',
          'No Lot Internal (Kosongkan utk FEFO)': '',
          'Jumlah Potong': 500,
          'Satuan': 'pcs',
          'No SPK / Work Order': 'SPK-2026-1002',
          'Target Batch Produksi': 'BATCH-CREAM-2609',
          'Catatan Penimbangan': 'Pengemasan Sekunder',
        },
      ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);

  worksheet['!cols'] = [
    { wch: 15 }, // Kode
    { wch: 30 }, // Nama
    { wch: 32 }, // No Lot
    { wch: 16 }, // Jumlah Potong
    { wch: 10 }, // Satuan
    { wch: 22 }, // SPK
    { wch: 25 }, // Target Batch
    { wch: 25 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Potong Stok');

  XLSX.writeFile(workbook, `Template_Potong_Stok_SPK_${todayYYMMDD}.xlsx`);
};

export const parseStockDeductExcel = (file: File): Promise<Array<{
  materialCode: string;
  lotInternalNumber?: string;
  deductQuantity: number;
  spkNumber?: string;
  batchTarget?: string;
  notes?: string;
  unit?: string;
}>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsed = rawJson.map((row) => {
          const materialCode = String(
            row['Kode Material'] || row['Kode Bahan'] || row['Kode'] || row['materialCode'] || ''
          ).trim();

          const lotInternalNumber = String(
            row['No Lot Internal (Kosongkan utk FEFO)'] || row['No Lot Internal'] || row['No Lot'] || row['lotInternalNumber'] || ''
          ).trim();

          const deductQuantity = Number(
            row['Jumlah Potong'] || row['Jumlah Pemakaian'] || row['Kuantitas'] || row['deductQuantity'] || row['Qty'] || 0
          );

          const spkNumber = String(
            row['No SPK / Work Order'] || row['No SPK'] || row['SPK'] || row['spkNumber'] || 'SPK-EXCEL'
          ).trim();

          const batchTarget = String(
            row['Target Batch Produksi'] || row['Target Batch'] || row['batchTarget'] || 'BATCH-PROD'
          ).trim();

          const notes = String(
            row['Catatan Penimbangan'] || row['Catatan'] || row['notes'] || 'Potong stok batch Excel'
          ).trim();

          const unit = String(row['Satuan'] || row['unit'] || 'kg').trim();

          return {
            materialCode,
            lotInternalNumber,
            deductQuantity,
            spkNumber,
            batchTarget,
            notes,
            unit,
          };
        }).filter((item) => item.materialCode !== '' && !isNaN(item.deductQuantity) && item.deductQuantity > 0);

        resolve(parsed);
      } catch (err) {
        reject(new Error('Gagal membaca file Excel Potong Stok. Pastikan format kolom sesuai template.'));
      }
    };

    reader.onerror = () => reject(new Error('Gagal mengunggah file.'));
    reader.readAsArrayBuffer(file);
  });
};
