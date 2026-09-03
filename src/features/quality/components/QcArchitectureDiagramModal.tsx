import React from 'react';
import {
  X,
  Workflow,
  Warehouse,
  Bell,
  FlaskConical,
  KeyRound,
  ShieldCheck,
  FileCheck2,
  Lock,
  Sparkles,
  ArrowRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface QcArchitectureDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QcArchitectureDiagramModal: React.FC<QcArchitectureDiagramModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      number: '01',
      title: 'Input GRN & Kunci Data Gudang',
      actor: 'Gudang (Warehouse Staff)',
      icon: Warehouse,
      color: 'amber',
      description:
        'Penerimaan bahan diinput ke GRN (No. GRN, Produsen, Pemasok, Batch, Qty 3 desimal). Status otomatis KARANTINA. Setelah masuk QC, data gudang TERKUNCI total untuk menjaga integritas data.',
      badge: 'Data Locked in Warehouse',
      outputs: ['No. GRN Baru', 'Label Karantina (Kuning)', 'Proteksi Edit'],
    },
    {
      number: '02',
      title: 'Notifikasi Otomatis & Rencana Sampling',
      actor: 'Sistem Terpadu CPKB & MIL-STD',
      icon: Bell,
      color: 'blue',
      description:
        'Sistem mengirimkan notifikasi instan ke Departemen QC (SPV & Analis). Sistem secara otomatis menghitung rencana sampling berdasar jenis bahan:',
      subList: [
        'Bahan Baku (BB): Rumus Standar CPKB n = 1 + √N wadah',
        'Bahan Kemas (BK): Standar MIL-STD-105E Level II (Code Letter A - R)',
      ],
      badge: 'AI Sampling Calculation',
      outputs: ['Notifikasi Departemen QC', 'Ukuran Sampel (n) & Wadah'],
    },
    {
      number: '03',
      title: 'Laboratorium & AI Smart Assessor',
      actor: 'Staf Analis QC',
      icon: FlaskConical,
      color: 'teal',
      description:
        'Staf QC mengambil sampel dan menguji parameter baku mutu fisikokimia / visual dimensi. AI Smart Assessor menganalisa hasil pengujian real-time untuk mendeteksi deviasi dan menghitung persentase kepatuhan standar spesifikasi.',
      badge: 'Analytical Testing & AI Assessment',
      outputs: ['Checklist Parameter Mutu', 'Skor Kepatuhan AI (0-100%)', 'Deteksi Risiko Deviasi'],
    },
    {
      number: '04',
      title: 'Keputusan Staf & Digital Signature',
      actor: 'Staf Analis QC',
      icon: KeyRound,
      color: 'purple',
      description:
        'Staf membuat rekomendasi awal (Rilis / Reject) dan menandatangani secara digital dengan otentikasi kata sandi. Sistem otomatis menerbitkan Nomor Lot Internal & No. Laporan Pemeriksaan unik.',
      subList: [
        'Format Lot BB: LBB + Tahun (26) + Bulan (09) + Urut (001) -> LBB2609001',
        'Format Lot BK: LBK + Tahun (26) + Bulan (09) + Urut (001) -> LBK2609001',
        'Nomor urut otomatis me-reset setiap pergantian bulan.',
      ],
      badge: 'Digital Signature Staff',
      outputs: ['Nomor Lot Internal Resmi', 'Hash Tanda Tangan Staf', 'Status: Awaiting QM'],
    },
    {
      number: '05',
      title: 'Otorisasi Quality Manager (Password Confirmed)',
      actor: 'Quality Manager / Apoteker PJ',
      icon: ShieldCheck,
      color: 'indigo',
      description:
        'Quality Manager meninjau data pengujian, rekomendasi staf, dan analisa AI. Keputusan final wajib dikonfirmasi dengan Password QM. Jika hasil memenuhi syarat -> Release. Jika ada deviasi minor -> Release by Deviation (No. Deviasi). Jika tidak memenuhi -> Reject.',
      badge: 'QM Strict Authorization',
      outputs: ['Disposisi Final Resmi', 'Hash Otorisasi Manager', 'Dual Digital Signature'],
    },
    {
      number: '06',
      title: 'Disposisi Multi-Departemen & Arsip CoA',
      actor: 'Gudang, Produksi, PPIC, QA',
      icon: FileCheck2,
      color: 'emerald',
      description:
        'Hasil otorisasi otomatis disiarkan via notifikasi ke SPV QC, Staf, dan Gudang. Bahan lolos dapat langsung digunakan untuk produksi. Tersedia tombol Cetak Laporan Pemeriksaan (Kop PT. Larassanti Makmur Sejahtera) dan Label Status Lolos / Tolak.',
      badge: 'End-to-End Traceability',
      outputs: ['Laporan Pemeriksaan PDF', 'Label Lolos / Reject', 'Notifikasi Multi-Departemen'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 rounded-xl border border-teal-400/30 text-teal-300">
              <Workflow className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Diagram Arsitektur Alur Kerja Terpadu QC & CPKB
              </h3>
              <p className="text-xs text-teal-200/80">
                PT. LARASSANTI MAKMUR SEJAHTERA • Traceability, Dual Digital Signature, & AI Queue Optimization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 space-y-8 overflow-y-auto grow bg-slate-50/50">
          {/* Top Overview Card */}
          <div className="bg-gradient-to-r from-teal-800 to-indigo-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Siklus Mutu Tertutup (Closed-Loop Quality Control)</span>
              </div>
              <h4 className="text-base font-black">
                Integrasi Gudang Penerimaan ➔ Laboratorium Pengujian ➔ Otorisasi Quality Manager
              </h4>
              <p className="text-xs text-teal-100/90 max-w-3xl">
                Alur kerja dirancang untuk mematuhi regulasi CPKB (Cara Pembuatan Kosmetika yang Baik) Golongan A dan standar sampling internasional MIL-STD-105E dengan integritas data anti-manipulasi.
              </p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-xs text-right shrink-0">
              <div className="font-mono font-bold text-teal-200">ISO 22716 / CPKB</div>
              <div className="text-[11px] text-teal-100">Zero Data Tampering</div>
            </div>
          </div>

          {/* Workflow Step Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>6 Tahapan Utama Arsitektur Proses QC</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {steps.map((step) => {
                const IconComponent = step.icon;
                return (
                  <div
                    key={step.number}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-2xl text-slate-200">
                          {step.number}
                        </span>
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                          <IconComponent className="w-5 h-5" />
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                          {step.actor}
                        </div>
                        <h5 className="font-bold text-slate-900 text-sm leading-tight mt-0.5">
                          {step.title}
                        </h5>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {step.description}
                      </p>

                      {step.subList && (
                        <ul className="text-[11px] text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
                          {step.subList.map((li, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-teal-600 font-bold">•</span>
                              <span>{li}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Output / Hasil:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {step.outputs.map((out, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold"
                          >
                            {out}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Special Process: Revert Protocol */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <span>Protokol Revert Data ke Gudang (Data Integrity Guard)</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Untuk mencegah pengubahan data sepihak pada lot yang telah dikarantina, staf gudang <strong>tidak dapat mengedit atau menghapus</strong> data penerimaan (GRN). Apabila terdapat ketidaksesuaian dokumen fisik (misal salah ketik No. Batch Vendor atau kuantitas koli), <strong>hanya Departemen QC yang dapat mengembalikan (Revert) data ke Gudang</strong> dengan mencantumkan alasan resmi dan jejak audit elektronik (Audit Trail).
            </p>
          </div>

          {/* Numbering Convention Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-400" />
                <h4 className="text-sm font-bold text-white">
                  Struktur Penomoran No. Lot Internal & Laporan Pemeriksaan
                </h4>
              </div>
              <span className="text-[11px] font-mono text-teal-300 bg-teal-900/60 px-2.5 py-0.5 rounded-md border border-teal-500/30">
                SOP-QC-NUM-001
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2">
                <div className="font-mono font-bold text-teal-300 text-sm">
                  LBB2609001 (Bahan Baku)
                </div>
                <div className="text-slate-300 space-y-1 text-[11px]">
                  <div><strong className="text-white">LBB</strong> = Lot Bahan Baku</div>
                  <div><strong className="text-white">26</strong> = Tahun 2026 berjalan</div>
                  <div><strong className="text-white">09</strong> = Bulan September berjalan</div>
                  <div><strong className="text-white">001</strong> = Nomor urut bahan baku (reset tiap bulan)</div>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2">
                <div className="font-mono font-bold text-purple-300 text-sm">
                  LBK2609001 (Bahan Kemas)
                </div>
                <div className="text-slate-300 space-y-1 text-[11px]">
                  <div><strong className="text-white">LBK</strong> = Lot Bahan Kemas</div>
                  <div><strong className="text-white">26</strong> = Tahun 2026 berjalan</div>
                  <div><strong className="text-white">09</strong> = Bulan September berjalan</div>
                  <div><strong className="text-white">001</strong> = Nomor urut bahan kemas (reset tiap bulan)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Dokumentasi Arsitektur Sistem QC • PT. Larassanti Makmur Sejahtera</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
          >
            Tutup Diagram
          </button>
        </div>
      </div>
    </div>
  );
};
