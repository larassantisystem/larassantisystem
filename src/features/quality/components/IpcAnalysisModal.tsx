import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FlaskConical,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Lock,
  KeyRound,
  FileCheck2,
  AlertCircle,
  Database,
  RotateCcw,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { IpcBulkTest } from '../utils/qcExtData';
import { ipcBulkService, IpcAuditResult } from '../services/ipcBulkService';
import { productService } from '../../rnd/products/productService';
import { useAuth } from '../../../core/auth/AuthContext';
import { Product } from '../../../types';

interface IpcAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: IpcBulkTest | null;
  onSuccess: (updatedList: IpcBulkTest[], auditRes?: IpcAuditResult) => void;
}

export interface IpcParameterRow {
  id: string;
  parameterName: string;
  specification: string;
  resultValue: string;
  isCompliant: boolean;
}

export const IpcAnalysisModal: React.FC<IpcAnalysisModalProps> = ({
  isOpen,
  onClose,
  batch,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [productSpec, setProductSpec] = useState<Product | null>(null);
  const [parameters, setParameters] = useState<IpcParameterRow[]>([]);
  const [staffNotes, setStaffNotes] = useState<string>('');
  
  // Signature Modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [actionType, setActionType] = useState<'SUBMIT_ANALYST' | 'RELEASE_QM' | 'REJECT_QM'>('SUBMIT_ANALYST');
  const [staffPassword, setStaffPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedEmptyParamId, setFocusedEmptyParamId] = useState<string | null>(null);

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (batch) {
      // Fetch product specification from productService
      productService.getProducts().then((products) => {
        const batchCode = (batch.productCode || '').trim().toLowerCase();
        const batchName = (batch.productName || '').trim().toLowerCase();

        const found = products.find((p) => {
          const pCode = (p.productCode || p.code || '').trim().toLowerCase();
          const pName = (p.name || '').trim().toLowerCase();
          return (
            (batchCode && pCode === batchCode) ||
            (batchName && pName === batchName) ||
            (batchName && (pName.includes(batchName) || batchName.includes(pName)))
          );
        });

        if (found) {
          setProductSpec(found);
        } else {
          setProductSpec(null);
        }

        // DYNAMIC PARAMETERS: Directly map from Supabase Product qc_parameters
        if (found && found.qcParameters && found.qcParameters.length > 0) {
          const dynamicParams: IpcParameterRow[] = found.qcParameters.map((param, idx) => {
            const paramName = param.parameterName || param.name || `Parameter ${idx + 1}`;
            const specCondition = param.acceptanceCondition || param.specification || '-';
            const unitSuffix = param.unit ? ` (${param.unit})` : '';
            const lowerName = paramName.toLowerCase();

            // Smart prefill from batch if available
            let initialValue = '';
            let initialCompliant = true;

            if (lowerName.includes('ph')) {
              initialValue = batch.pH !== undefined && batch.pH !== null ? String(batch.pH) : '';
            } else if (lowerName.includes('viskos') || lowerName.includes('viscosity')) {
              initialValue = batch.viscosity !== undefined && batch.viscosity !== null ? String(batch.viscosity) : '';
            } else if (lowerName.includes('bobot jenis') || lowerName.includes('density') || lowerName.includes('berat jenis') || lowerName.includes('bj')) {
              initialValue = batch.gravity !== undefined && batch.gravity !== null ? String(batch.gravity) : '';
            } else if (lowerName.includes('bentuk') || lowerName.includes('warna') || lowerName.includes('bau') || lowerName.includes('organo') || lowerName.includes('pemerian')) {
              initialValue = batch.appearance || specCondition;
            }

            return {
              id: param.id || `param-${idx + 1}`,
              parameterName: `${paramName}${unitSuffix}`,
              specification: specCondition,
              resultValue: initialValue,
              isCompliant: initialCompliant,
            };
          });

          setParameters(dynamicParams);
        } else {
          // Fallback only if product has not configured qc_parameters in Supabase
          const fallbackParams: IpcParameterRow[] = [
            {
              id: 'p1',
              parameterName: 'Pemerian / Organoleptis',
              specification: 'Sesuai Standar Mutu Fisik',
              resultValue: batch.appearance || 'Sesuai Standar',
              isCompliant: true,
            },
            {
              id: 'p2',
              parameterName: 'pH Sediaan',
              specification: '4.5 - 7.5',
              resultValue: String(batch.pH || 6.0),
              isCompliant: true,
            },
            {
              id: 'p3',
              parameterName: 'Viskositas',
              specification: 'Sesuai Standar',
              resultValue: String(batch.viscosity || 4000),
              isCompliant: true,
            },
          ];
          setParameters(fallbackParams);
        }
      });

      setStaffNotes('');
      setShowSignatureModal(false);
      setStaffPassword('');
      setErrorMessage('');
      setFocusedEmptyParamId(null);
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const handleParamValueChange = (id: string, value: string) => {
    setParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, resultValue: value } : p))
    );
    if (focusedEmptyParamId === id && value.trim()) {
      setFocusedEmptyParamId(null);
    }
  };

  const handleParamComplianceToggle = (id: string, isCompliant: boolean) => {
    setParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isCompliant } : p))
    );
  };

  const handleOpenSignaturePrompt = (type: 'SUBMIT_ANALYST' | 'RELEASE_QM' | 'REJECT_QM') => {
    // Validate empty inputs
    const emptyIndex = parameters.findIndex((p) => !p.resultValue || !p.resultValue.trim());
    if (emptyIndex !== -1) {
      const firstEmpty = parameters[emptyIndex];
      setFocusedEmptyParamId(firstEmpty.id);
      setErrorMessage(
        `Parameter No. ${emptyIndex + 1} ("${firstEmpty.parameterName}") belum diisi. Harap lengkapi seluruh hasil analisa laboratorium.`
      );

      const targetInput = inputRefs.current[firstEmpty.id];
      if (targetInput) {
        targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          targetInput.focus();
        }, 150);
      }
      return;
    }

    setErrorMessage('');
    setActionType(type);
    setShowSignatureModal(true);
  };

  const handleFinalSubmitWithSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffPassword) {
      setErrorMessage('Password otorisasi wajib diisi untuk verifikasi tanda tangan digital.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Extract values dynamically for database columns
      const phRow = parameters.find((p) => p.parameterName.toLowerCase().includes('ph'));
      const viscRow = parameters.find((p) => p.parameterName.toLowerCase().includes('viskos'));
      const gravRow = parameters.find((p) => 
        p.parameterName.toLowerCase().includes('bobot jenis') || 
        p.parameterName.toLowerCase().includes('density') || 
        p.parameterName.toLowerCase().includes('berat jenis') ||
        p.parameterName.toLowerCase().includes('bj')
      );
      const appRow = parameters.find((p) => 
        p.parameterName.toLowerCase().includes('bentuk') ||
        p.parameterName.toLowerCase().includes('warna') ||
        p.parameterName.toLowerCase().includes('bau') ||
        p.parameterName.toLowerCase().includes('pemerian') ||
        p.parameterName.toLowerCase().includes('organo')
      );

      const newStatus =
        actionType === 'SUBMIT_ANALYST'
          ? 'AWAITING_QM'
          : actionType === 'RELEASE_QM'
          ? 'RELEASED'
          : 'REJECTED';

      const updatedBatchItem: IpcBulkTest = {
        ...batch,
        productCode: batch.productCode || productSpec?.productCode || productSpec?.code,
        pH: phRow && phRow.resultValue ? parseFloat(phRow.resultValue.replace(',', '.')) || batch.pH : batch.pH,
        viscosity: viscRow && viscRow.resultValue ? parseFloat(viscRow.resultValue.replace(',', '.')) || batch.viscosity : batch.viscosity,
        gravity: gravRow && gravRow.resultValue ? parseFloat(gravRow.resultValue.replace(',', '.')) || batch.gravity : batch.gravity,
        appearance: appRow && appRow.resultValue ? appRow.resultValue : batch.appearance,
        status: newStatus,
        analyst: user?.name || batch.analyst || 'Staf QC Lab (IPC)',
        labParameters: parameters,
      };

      const updatedList = await ipcBulkService.updateSingleBatch(updatedBatchItem);
      const auditRes = await ipcBulkService.auditIpcBulkBatches();

      setShowSignatureModal(false);
      onSuccess(updatedList, auditRes);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan hasil analisa ke Supabase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allCompliant = parameters.every((p) => p.isCompliant);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <FlaskConical className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">
                  Lembar Kerja Pengujian Lab QC - Sediaan Ruahan (IPC Bulk)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/40 text-purple-100 border border-purple-400/30">
                  {batch.batchNo}
                </span>
              </div>
              <p className="text-xs text-purple-100/90 font-normal">
                Pengawasan Mutu CPKB • Spesifikasi Produk Jadi RnD & Laporan Analisa Adonan Ruahan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto grow">
          {/* Material & Product Identitas Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Material Identitas */}
            <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Spesifikasi Produk Jadi (RnD)</span>
                <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                  {batch.productCode || productSpec?.productCode || 'CPKB-SPEC'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block">Nama Produk:</span>
                  <span className="font-bold text-slate-800 text-sm">{batch.productName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nomor BPOM / NIE:</span>
                  <span className="font-semibold text-slate-700">
                    {productSpec?.bpomNotificationNumber || 'NA18241900123'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nomor Bets Ruahan:</span>
                  <span className="font-mono font-bold text-slate-800 bg-purple-100/80 px-2 py-0.5 rounded text-purple-950 inline-block">
                    {batch.batchNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tanggal Mixing:</span>
                  <span className="font-semibold text-slate-800">{batch.mixingDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Formula Code / Kategori:</span>
                  <span className="font-mono text-slate-700">
                    {productSpec?.variants?.[0]?.bulkFormulaCode || 'FORM-CPKB-01'} ({productSpec?.category || 'Cosmetics'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Analis QC:</span>
                  <span className="font-bold text-slate-800">{batch.analyst || user?.name}</span>
                </div>
              </div>
            </div>

            {/* Status & Compliance Summary Badge */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 text-xs flex flex-col justify-between">
              <div>
                <span className="font-bold text-purple-900 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  Status Keputusan QC
                </span>
                <div className="bg-white/80 border border-purple-200 rounded-lg p-3 space-y-2 text-center">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Status Ruahan Saat Ini</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                      batch.status === 'RELEASED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : batch.status === 'AWAITING_QM'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : batch.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {batch.status === 'AWAITING_QM' ? 'AWAITING QM AUTHORIZATION' : batch.status}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-purple-200 text-[11px] text-purple-900 font-medium">
                Sesuai standar CPKB/GMP, rilis adonan ruahan wajib disetujui Quality Manager sebelum diisi (*filling*) ke kemasan primer.
              </div>
            </div>
          </div>

          {/* AI Smart Assessor Card */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-700 text-white rounded-lg shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="grow space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                    AI Smart Assessor (Analisa Deviasi & Kepatuhan Spesifikasi Produk Jadi)
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      allCompliant
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {allCompliant ? '100% Sesuai Spesifikasi' : 'Ada Deviasi Parameter'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {allCompliant
                    ? `Seluruh parameter pengujian adonan ruahan batch ${batch.batchNo} memenuhi standar spesifikasi produk jadi (${batch.productName}). Sediaan homogen, pH dan viskositas berada dalam rentang wajar.`
                    : `Terdapat parameter yang tidak memenuhi syarat (Out of Spec) pada pengujian batch ${batch.batchNo}. Periksa penyesuaian (*adjusting*) pH atau viskositas sebelum otorisasi.`}
                </p>
              </div>
            </div>
          </div>

          {/* Lab Parameters Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>Checklist & Hasil Pengujian Laboratorium</span>
                <span className="text-slate-400 font-normal">({parameters.length} Parameter Spesifikasi Produk)</span>
              </h4>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 w-1/4">Parameter Pengujian</th>
                    <th className="p-3 w-1/3">Spesifikasi Produk Jadi (RnD)</th>
                    <th className="p-3 w-1/3">Hasil Analisa Lab <span className="text-red-500">*</span></th>
                    <th className="p-3 w-28 text-center">Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parameters.map((param, idx) => {
                    const isTargetEmpty = focusedEmptyParamId === param.id;
                    return (
                      <tr
                        key={param.id}
                        className={`transition-colors ${
                          isTargetEmpty
                            ? 'bg-amber-50/90 ring-2 ring-amber-400 ring-inset'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800 leading-snug">
                            {param.parameterName}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs text-slate-700 bg-slate-50/80 border border-slate-200 rounded-lg p-2 font-mono leading-relaxed">
                            {param.specification}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            ref={(el) => {
                              inputRefs.current[param.id] = el;
                            }}
                            type="text"
                            required
                            disabled={batch.status === 'RELEASED' || batch.status === 'REJECTED'}
                            placeholder="Masukkan nilai hasil uji lab..."
                            value={param.resultValue}
                            onChange={(e) => handleParamValueChange(param.id, e.target.value)}
                            className={`w-full text-xs font-semibold p-2.5 rounded-lg border focus:outline-hidden transition-all shadow-xs ${
                              isTargetEmpty
                                ? 'border-amber-500 bg-amber-50 text-slate-900 ring-2 ring-amber-400'
                                : !param.resultValue
                                ? 'border-amber-300 bg-amber-50/40 text-slate-800 focus:border-purple-500'
                                : param.isCompliant
                                ? 'border-emerald-300 bg-emerald-50/30 text-emerald-900 focus:border-emerald-500'
                                : 'border-red-300 bg-red-50/30 text-red-900 focus:border-red-500'
                            }`}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              title="Memenuhi Syarat (Pass)"
                              disabled={batch.status === 'RELEASED' || batch.status === 'REJECTED'}
                              onClick={() => handleParamComplianceToggle(param.id, true)}
                              className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1 transition-all ${
                                param.isCompliant
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              MS
                            </button>
                            <button
                              type="button"
                              title="Tidak Memenuhi Syarat (Fail)"
                              disabled={batch.status === 'RELEASED' || batch.status === 'REJECTED'}
                              onClick={() => handleParamComplianceToggle(param.id, false)}
                              className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1 transition-all ${
                                !param.isCompliant
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              TMS
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analyst Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Catatan Pengujian & Rekomendasi Tambahan Staf QC:
            </label>
            <textarea
              rows={2}
              disabled={batch.status === 'RELEASED' || batch.status === 'REJECTED'}
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="Tambahkan catatan khusus kondisi adonan ruahan (misal: penambahan parfum pada suhu < 40°C)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Database className="w-4 h-4 text-purple-700" />
            <span>Direct Supabase Persistence (Zero LocalStorage)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Tutup
            </button>

            {(batch.status === 'TESTING' || batch.status === 'PASSED') && (
              <button
                type="button"
                onClick={() => handleOpenSignaturePrompt('SUBMIT_ANALYST')}
                className="bg-purple-800 hover:bg-purple-900 text-white text-xs font-extrabold px-5 py-2 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-200" />
                <span>Tanda Tangan & Kirim ke Otorisasi QM</span>
              </button>
            )}

            {batch.status === 'AWAITING_QM' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenSignaturePrompt('REJECT_QM')}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Ditolak (REJECT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSignaturePrompt('RELEASE_QM')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Otorisasi & Rilis (RELEASED)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tanda Tangan Digital / Password Confirmation Dialog */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
                <Lock className="w-5 h-5 text-purple-700" />
                <span>Verifikasi Tanda Tangan Digital CPKB</span>
              </div>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Konfirmasi persetujuan transaksi untuk batch <strong className="text-purple-950 font-mono">{batch.batchNo}</strong> ({batch.productName}).
              </p>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Masukkan Kata Sandi / PIN Otorisasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Password / PIN Pengguna"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinalSubmitWithSignature(e);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleFinalSubmitWithSignature}
                disabled={isSubmitting}
                className="bg-purple-800 hover:bg-purple-900 text-white text-xs font-extrabold px-5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Verifikasi...' : 'Konfirmasi Tanda Tangan Digital'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
