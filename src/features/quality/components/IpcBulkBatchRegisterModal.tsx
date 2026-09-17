import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Clipboard,
  PenTool,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Database,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ipcBulkService, IpcBulkBatchInput, IpcAuditResult } from '../services/ipcBulkService';
import { IpcBulkTest } from '../utils/qcExtData';

interface IpcBulkBatchRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedList: IpcBulkTest[], auditResult?: IpcAuditResult) => void;
}

export const IpcBulkBatchRegisterModal: React.FC<IpcBulkBatchRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'paste' | 'manual'>('excel');

  // Parsed Batch List for Preview
  const [previewBatches, setPreviewBatches] = useState<IpcBulkBatchInput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Paste Textarea State
  const [pasteContent, setPasteContent] = useState('');

  // Single Manual Form State
  const [manualForm, setManualForm] = useState<IpcBulkBatchInput>({
    batchNo: '',
    productCode: '',
    productName: '',
    mixingQtyKg: 100,
    mixingDate: new Date().toISOString().split('T')[0],
    analyst: 'Staf QC Lab (IPC)',
    notes: '',
  });

  if (!isOpen) return null;

  // Handle Excel File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawData.length < 2) {
          setErrorMessage('File Excel kosong atau tidak memiliki baris data.');
          setIsProcessing(false);
          return;
        }

        // Detect header row
        const headerRow = rawData[0].map((h) => String(h || '').toLowerCase().trim());
        const findColIndex = (keywords: string[]) => {
          return headerRow.findIndex((col) => keywords.some((kw) => col.includes(kw)));
        };

        const batchIdx = findColIndex(['bets', 'batch', 'no_bets', 'no.bets', 'nobets', 'lot']);
        const codeIdx = findColIndex(['kode', 'code', 'product_code', 'kd']);
        const nameIdx = findColIndex(['nama', 'product', 'produk', 'product_name']);
        const qtyIdx = findColIndex(['qty', 'jumlah', 'mixing', 'kuantitas', 'kg', 'liter']);
        const dateIdx = findColIndex(['tanggal', 'date', 'tgl', 'mixing_date']);

        const parsed: IpcBulkBatchInput[] = [];

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const batchNoVal = batchIdx !== -1 && row[batchIdx] ? String(row[batchIdx]).trim() : String(row[0] || '').trim();
          const nameVal = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : String(row[1] || row[2] || 'Produk Ruahan').trim();

          if (!batchNoVal) continue; // Skip completely empty rows

          parsed.push({
            batchNo: batchNoVal.toUpperCase(),
            productCode: codeIdx !== -1 && row[codeIdx] ? String(row[codeIdx]).trim() : '',
            productName: nameVal,
            mixingQtyKg: qtyIdx !== -1 && row[qtyIdx] ? Number(row[qtyIdx]) || 100 : 100,
            mixingDate: dateIdx !== -1 && row[dateIdx] ? String(row[dateIdx]).trim() : new Date().toISOString().split('T')[0],
            analyst: 'Staf QC Lab (IPC)',
            origin: 'EXCEL_IMPORT',
          });
        }

        if (parsed.length === 0) {
          setErrorMessage('Gagal mengekstrak data dari file Excel. Pastikan kolom "Nomor Bets" dan "Nama Produk" tersedia.');
        } else {
          setPreviewBatches(parsed);
        }
      } catch (err: any) {
        console.error('Error reading excel:', err);
        setErrorMessage(`Terjadi kesalahan saat membaca file Excel: ${err?.message || err}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Handle Paste Matrix Processing
  const handleProcessPaste = () => {
    if (!pasteContent.trim()) {
      setErrorMessage('Area paste masih kosong. Silakan copy baris dari Excel terlebih dahulu.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const lines = pasteContent.trim().split(/\r?\n/);
      const parsed: IpcBulkBatchInput[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        // Split by Tab or Comma or Semicolon
        const cells = line.includes('\t')
          ? line.split('\t')
          : line.includes(';')
          ? line.split(';')
          : line.split(',');

        const cleaned = cells.map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const batchNoVal = cleaned[0] || '';
        if (!batchNoVal) continue;

        // Smart column assignments based on column length
        let productCode = '';
        let productName = '';
        let mixingQtyKg = 100;
        let mixingDate = new Date().toISOString().split('T')[0];

        if (cleaned.length >= 4) {
          // Format: [BatchNo, ProductCode, ProductName, Qty, Date]
          productCode = cleaned[1] || '';
          productName = cleaned[2] || 'Produk Ruahan';
          mixingQtyKg = Number(cleaned[3]) || 100;
          if (cleaned[4]) mixingDate = cleaned[4];
        } else if (cleaned.length === 3) {
          // Format: [BatchNo, ProductName, Qty]
          productName = cleaned[1] || 'Produk Ruahan';
          mixingQtyKg = Number(cleaned[2]) || 100;
        } else {
          // Format: [BatchNo, ProductName]
          productName = cleaned[1] || 'Produk Ruahan';
        }

        parsed.push({
          batchNo: batchNoVal.toUpperCase(),
          productCode,
          productName,
          mixingQtyKg,
          mixingDate,
          analyst: 'Staf QC Lab (IPC)',
          origin: 'PASTE_IMPORT',
        });
      }

      if (parsed.length === 0) {
        setErrorMessage('Format data paste tidak valid. Gunakan pemisah Tab atau Koma.');
      } else {
        setPreviewBatches(parsed);
      }
    } catch (err: any) {
      setErrorMessage(`Terjadi kesalahan saat memproses data paste: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove single row from preview
  const handleRemovePreviewRow = (index: number) => {
    setPreviewBatches((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add Manual Form item to preview
  const handleAddManualToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.batchNo.trim() || !manualForm.productName.trim()) {
      setErrorMessage('Nomor Bets dan Nama Produk wajib diisi.');
      return;
    }

    const newItem: IpcBulkBatchInput = {
      ...manualForm,
      batchNo: manualForm.batchNo.trim().toUpperCase(),
      productName: manualForm.productName.trim(),
      origin: 'MANUAL_ENTRY',
    };

    setPreviewBatches((prev) => [newItem, ...prev]);
    setManualForm({
      batchNo: '',
      productCode: '',
      productName: '',
      mixingQtyKg: 100,
      mixingDate: new Date().toISOString().split('T')[0],
      analyst: 'Staf QC Lab (IPC)',
      notes: '',
    });
    setErrorMessage(null);
  };

  // Commit and Save to Supabase (100% Direct Sync Bypass LocalStorage)
  const handleSaveAllToSupabase = async () => {
    if (previewBatches.length === 0) {
      setErrorMessage('Tidak ada data batch untuk didaftarkan. Tambahkan minimal 1 nomor bets.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // 1. Save directly to Supabase
      const updatedBatches = await ipcBulkService.saveBatches(previewBatches);

      // 2. Perform Post-Execution Audit Verification on Supabase
      const auditRes = await ipcBulkService.auditIpcBulkBatches();

      // 3. Notify parent component
      onSuccess(updatedBatches, auditRes);
      onClose();
    } catch (err: any) {
      setErrorMessage(`Gagal menyimpan ke Supabase: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700/50 border border-purple-500/30 flex items-center justify-center text-purple-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                <span>Registrasi Batch Ruahan (Analisa IPC)</span>
                <span className="bg-purple-500/30 text-purple-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-purple-400/30">
                  Direct Supabase Sync
                </span>
              </h3>
              <p className="text-xs text-purple-200/80">
                Input nomor bets ruahan secara manual, upload file Excel, atau copy-paste grid.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 pt-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
              activeTab === 'excel'
                ? 'bg-white border-slate-200 text-purple-800 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>1. Upload Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
              activeTab === 'paste'
                ? 'bg-white border-slate-200 text-purple-800 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clipboard className="w-4 h-4 text-blue-600" />
            <span>2. Paste dari Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
              activeTab === 'manual'
                ? 'bg-white border-slate-200 text-purple-800 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <PenTool className="w-4 h-4 text-amber-600" />
            <span>3. Input Manual Single Form</span>
          </button>
        </div>

        {/* Error Alert Bar */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 px-5 flex items-center gap-2.5 text-rose-800 text-xs font-medium shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-5 space-y-5 overflow-y-auto grow">
          {/* TAB 1: EXCEL UPLOAD */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-purple-200 bg-purple-50/40 rounded-xl p-6 text-center hover:bg-purple-50/80 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      Klik atau Drag & Drop File Excel / CSV di Sini
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Format kolom otomatis terbaca: <strong className="text-purple-800">Nomor Bets, Kode Produk, Nama Produk, Qty Mixing, Tanggal</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE MATRIX */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clipboard className="w-4 h-4 text-blue-600" />
                  <span>Paste Baris Data Excel (Salin lalu Ctrl+V):</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Format Tabular: <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700">No_Bets \t Kode_Produk \t Nama_Produk \t Qty_Mixing</code>
                </span>
              </div>
              <textarea
                rows={5}
                placeholder={`Contoh Paste Excel:\nBCH-20260917-A1\tPJ001\tLarassanti Serum Glow\t150\nBCH-20260917-A2\tPJ002\tLarassanti Face Lotion\t200`}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white resize-y"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProcessPaste}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Proses & Pratinjau Data Paste</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SINGLE MANUAL FORM */}
          {activeTab === 'manual' && (
            <form onSubmit={handleAddManualToPreview} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 block">
                  Nomor Bets Ruahan (Manual) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BCH-20260917-A1"
                  value={manualForm.batchNo}
                  onChange={(e) => setManualForm({ ...manualForm, batchNo: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 block">
                  Kode Produk (RnD)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PJ-SERUM-001"
                  value={manualForm.productCode}
                  onChange={(e) => setManualForm({ ...manualForm, productCode: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 block">
                  Nama Produk Jadi / Ruahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Larassanti Brightening Glow Serum"
                  value={manualForm.productName}
                  onChange={(e) => setManualForm({ ...manualForm, productName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 block">
                  Jumlah / Qty Mixing (kg / Litres)
                </label>
                <input
                  type="number"
                  min={1}
                  value={manualForm.mixingQtyKg}
                  onChange={(e) => setManualForm({ ...manualForm, mixingQtyKg: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 block">
                  Tanggal Pembuatan Mixing
                </label>
                <input
                  type="date"
                  value={manualForm.mixingDate}
                  onChange={(e) => setManualForm({ ...manualForm, mixingDate: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Tambahkan ke Tabel Pratinjau</span>
                </button>
              </div>
            </form>
          )}

          {/* PREVIEW TABLE OF BATCHES TO REGISTER */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>Pratinjau Batch Siap Didaftarkan ke Supabase</span>
                <span className="bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full text-[11px]">
                  {previewBatches.length} Batch
                </span>
              </h4>
              {previewBatches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPreviewBatches([])}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Semua</span>
                </button>
              )}
            </div>

            {previewBatches.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-medium space-y-1">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p>Belum ada batch yang dimasukkan ke pratinjau.</p>
                <p className="text-[11px] text-slate-400">
                  Gunakan tab Upload Excel, Paste, atau Form Manual di atas.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse bg-white text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-black text-slate-600 uppercase tracking-wider sticky top-0">
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Nomor Bets</th>
                      <th className="p-2.5">Kode Produk</th>
                      <th className="p-2.5">Nama Produk</th>
                      <th className="p-2.5 text-right">Qty Mixing</th>
                      <th className="p-2.5">Tgl Mixing</th>
                      <th className="p-2.5 text-center">Metode</th>
                      <th className="p-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {previewBatches.map((b, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                        <td className="p-2.5 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-purple-900 font-mono">{b.batchNo}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{b.productCode || '-'}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{b.productName}</td>
                        <td className="p-2.5 text-right font-bold text-slate-800">{b.mixingQtyKg || 100} kg</td>
                        <td className="p-2.5 text-slate-500">{b.mixingDate}</td>
                        <td className="p-2.5 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                            {b.origin || 'MANUAL'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePreviewRow(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Integrasi Langsung ke Database Supabase (Direct Sync)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveAllToSupabase}
              disabled={isSaving || previewBatches.length === 0}
              className="bg-purple-800 hover:bg-purple-900 disabled:opacity-50 text-white text-xs font-extrabold px-5 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-purple-200" />
                  <span>Simpan & Daftarkan Batch ke Supabase ({previewBatches.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
