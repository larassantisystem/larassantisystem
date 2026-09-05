import React, { useState } from 'react';
import { BulkFormulation, PackagingMaterial, RawMaterial } from '../../types';
import { useAuth } from '../../core/auth/AuthContext';
import { canWriteModule } from '../../core/auth/permissionGuard';
import {
  FlaskConical,
  Layers,
  Sliders,
  ArrowRightLeft,
  Cpu,
  Calculator,
  RefreshCw,
  CheckCircle2,
  Lock,
  Eye,
} from 'lucide-react';

interface RndBomCalculatorTabProps {
  formulations: BulkFormulation[];
  packagingMaterials: PackagingMaterial[];
  rawMaterials: RawMaterial[];
  selectedFormulation: BulkFormulation | null;
  onSelectFormulation: (f: BulkFormulation) => void;
}

export const RndBomCalculatorTab: React.FC<RndBomCalculatorTabProps> = ({
  formulations,
  packagingMaterials,
  rawMaterials,
  selectedFormulation,
  onSelectFormulation,
}) => {
  const { user } = useAuth();
  const canWrite = canWriteModule(user, 'rnd');

  const [targetBulkAllocation, setTargetBulkAllocation] = useState<number>(100);
  const [packAllocations, setPackAllocations] = useState<{ [pmCode: string]: number }>({});

  // Simulator Modal states
  const [showSubSimulator, setShowSubSimulator] = useState(false);
  const [simSelectedPMToSwap, setSimSelectedPMToSwap] = useState<string>('');
  const [simTargetUnits, setSimTargetUnits] = useState<number>(1000);
  const [simNewPMCode, setSimNewPMCode] = useState<string>('');
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const availablePrimaries = packagingMaterials.filter((p) => p.type === 'primary');

  const calculateDynamicBOM = () => {
    if (!selectedFormulation) return null;

    const bulkRequiredKg = targetBulkAllocation;

    // 1. Ingredients BOM
    const ingredientBOM = selectedFormulation.ingredients.map((ing) => {
      const rm = rawMaterials.find((r) => r.code === ing.rawMaterialCode);
      const neededKg = (ing.percentage / 100) * bulkRequiredKg;
      return {
        code: ing.rawMaterialCode,
        name: rm ? rm.name : ing.rawMaterialCode,
        percentage: ing.percentage,
        neededKg,
        storage: rm ? rm.storageConditions : 'Suhu Ruang',
      };
    });

    // 2. Packaging Materials BOM
    let totalBulkFilledGrams = 0;
    const packagingBOM: {
      code: string;
      name: string;
      neededUnits: number;
      material: string;
      artwork: string;
    }[] = [];

    availablePrimaries.forEach((pm) => {
      const allocatedUnits = packAllocations[pm.code] || 0;
      if (allocatedUnits > 0) {
        totalBulkFilledGrams += allocatedUnits * (pm.unitCapacityGrams || 0);

        // Add primary container
        packagingBOM.push({
          code: pm.code,
          name: pm.name,
          neededUnits: allocatedUnits,
          material: pm.supplier ? `Supplier: ${pm.supplier}` : (pm.materialSpec || 'Standard Packaging'),
          artwork: pm.unit || pm.artworkVersion || 'Pcs',
        });

        // Add matching secondary box if available
        const secBox = packagingMaterials.find(
          (p) => p.type === 'secondary' && p.code.includes(pm.code.split('-')[1])
        );
        if (secBox) {
          packagingBOM.push({
            code: secBox.code,
            name: secBox.name,
            neededUnits: allocatedUnits,
            material: secBox.supplier ? `Supplier: ${secBox.supplier}` : (secBox.materialSpec || 'Standard Packaging'),
            artwork: secBox.unit || secBox.artworkVersion || 'Pcs',
          });
        }
      }
    });

    const totalBulkFilledKg = totalBulkFilledGrams / 1000;
    const residualBulkKg = bulkRequiredKg - totalBulkFilledKg;

    return {
      bulkRequiredKg,
      totalBulkFilledKg,
      residualBulkKg,
      ingredientBOM,
      packagingBOM,
    };
  };

  const bomResult = calculateDynamicBOM();

  const handleLaunchSubSimulator = (pmCode: string, currentUnits: number) => {
    setSimSelectedPMToSwap(pmCode);
    setSimTargetUnits(currentUnits);
    const otherPM = availablePrimaries.find((p) => p.code !== pmCode);
    if (otherPM) setSimNewPMCode(otherPM.code);
    setShowSubSimulator(true);
    setSimulationLog([]);
  };

  const handleExecuteSimulation = () => {
    const oldPM = packagingMaterials.find((p) => p.code === simSelectedPMToSwap);
    const newPM = packagingMaterials.find((p) => p.code === simNewPMCode);

    if (!oldPM || !newPM) return;

    const oldVolGram = (oldPM.unitCapacityGrams || 10) * simTargetUnits;
    const newUnitCap = newPM.unitCapacityGrams || 1;
    const newCalculatedUnits = Math.floor(oldVolGram / newUnitCap);
    const leftoverGrams = oldVolGram % newUnitCap;

    const logs: string[] = [
      `[SIMULASI ALOKASI KEMASAN DARURAT CPKB]`,
      `> Kemasan Lama: ${oldPM.code} (${oldPM.name}) @ ${oldPM.unitCapacityGrams}g x ${simTargetUnits} pcs`,
      `> Total Volume Terlibat: ${(oldVolGram / 1000).toFixed(2)} Kg bulk (${oldVolGram.toLocaleString()} gram)`,
      `> Target Kemasan Pengganti: ${newPM.code} (${newPM.name}) @ ${newPM.unitCapacityGrams}g`,
      `> [HASIL KONVERSI] Dibutuhkan ${newCalculatedUnits.toLocaleString()} pcs kemasan ${newPM.code}`,
    ];

    if (leftoverGrams > 0) {
      logs.push(`> [PERINGATAN SISAL] Sisa bulk residual: ${leftoverGrams} gram (alokasikan ke buffer lab / retention sample).`);
    } else {
      logs.push(`> [SUKSES] Konversi massa 100% sempurna tanpa sisa residu.`);
    }

    setSimulationLog(logs);

    // Apply update to allocations
    setPackAllocations((prev) => ({
      ...prev,
      [oldPM.code]: Math.max(0, (prev[oldPM.code] || 0) - simTargetUnits),
      [newPM.code]: (prev[newPM.code] || 0) + newCalculatedUnits,
    }));
  };

  return (
    <div className="space-y-6 font-sans">
      {!canWrite && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">Akses Khusus R&D: Mode Baca (Read-Only)</div>
              <div className="text-[11px] text-amber-700">
                Akun Anda ({user?.name || user?.nik}) memiliki hak akses khusus Read-Only untuk modul R&D.
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/60 text-amber-900 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Eye className="w-3 h-3" /> Read-Only
          </span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1">
            Kalkulator Bill of Materials (BOM) & Alokasi Varian Kemasan
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sesuaikan kapasitas mixing tangki bulk dan tentukan berapa banyak unit botol / jar ukuran tertentu yang akan diisi. Sistem akan mengalkulasi total kebutuhan bahan baku & kemasan sekunder/tersier secara presisi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Formula & Qty Target Input */}
          <div className="space-y-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
            <h4 className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Langkah 1: Pilih Formula & Ukuran Batch
            </h4>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Pilih Formula</label>
              <select
                value={selectedFormulation?.id || ''}
                onChange={(e) => {
                  const f = formulations.find((form) => form.id === e.target.value);
                  if (f) onSelectFormulation(f);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600 font-semibold"
              >
                {formulations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} - {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Kapasitas Tangki Mixing (Kg)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <input
                  type="number"
                  required
                  value={targetBulkAllocation}
                  onChange={(e) => setTargetBulkAllocation(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-10 text-xs text-slate-800 focus:outline-none focus:border-purple-600 font-mono font-bold"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 font-bold">
                  Kg
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Standard batch pabrik adalah {selectedFormulation?.bulkQuantityKg} Kg.
              </p>
            </div>
          </div>

          {/* Package Allocations */}
          <div className="space-y-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-200 md:col-span-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Langkah 2: Alokasikan ke Multi-Varian Kemasan Primer
              </h4>
              <button
                onClick={() => {
                  const cleared = { ...packAllocations };
                  Object.keys(cleared).forEach((k) => (cleared[k] = 0));
                  setPackAllocations(cleared);
                }}
                className="text-[10px] font-bold text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
              >
                Reset Alokasi
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availablePrimaries.map((pm) => (
                <div
                  key={pm.id}
                  className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-[9px] font-bold text-purple-700 block">{pm.code}</span>
                    <span className="text-xs font-bold text-slate-800 block truncate">{pm.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Kapasitas: {pm.unitCapacityGrams}g / unit
                    </span>
                  </div>

                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      min="0"
                      placeholder="0 unit"
                      value={packAllocations[pm.code] || 0}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setPackAllocations({ ...packAllocations, [pm.code]: val });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-800 text-right font-mono font-bold focus:outline-none focus:bg-white focus:border-purple-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Mass balance checker */}
            {bomResult && (
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Total Massa Adonan Dikemas:</span>
                  <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {bomResult.totalBulkFilledKg.toLocaleString()} Kg
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Sisa Adonan Bulk (Residual):</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded border ${
                      bomResult.residualBulkKg < 0
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : bomResult.residualBulkKg === 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {bomResult.residualBulkKg.toLocaleString()} Kg
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOM Results Display */}
      {bomResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ingredient Bill of Materials */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-purple-600" />
                Kebutuhan Bahan Baku (Ingredient BOM)
              </h3>
              <span className="font-mono text-[10px] text-slate-500 font-bold">
                Untuk {bomResult.bulkRequiredKg} Kg Bulk
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {bomResult.ingredientBOM.map((ing, idx) => (
                <div
                  key={ing.code}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-purple-50/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center font-mono font-bold text-[11px] text-slate-400 shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{ing.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {ing.code} • Persentase: {ing.percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-purple-950 text-xs sm:text-sm">
                      {ing.neededKg.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}{' '}
                      Kg
                    </span>
                    <div className="text-[9px] text-slate-400 mt-0.5">{ing.storage}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Packaging Materials Bill of Materials */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                Kebutuhan Bahan Kemas (Packaging BOM)
              </h3>
              <span className="text-[10px] text-emerald-700 font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                CPKB Terverifikasi
              </span>
            </div>

            {bomResult.packagingBOM.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {bomResult.packagingBOM.map((pm, idx) => (
                  <div
                    key={pm.code}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-purple-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-mono font-bold text-[11px] text-slate-400 shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{pm.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {pm.code} • Satuan: {pm.artwork}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-purple-950 text-xs sm:text-sm">
                        {pm.neededUnits.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                      </span>
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-xs">{pm.material}</div>

                      {packagingMaterials.find((p) => p.code === pm.code)?.type === 'primary' && (
                        <button
                          onClick={() => handleLaunchSubSimulator(pm.code, pm.neededUnits)}
                          className="text-[9px] text-purple-700 hover:text-purple-900 font-bold block mt-1.5 ml-auto border border-purple-200 rounded px-2 py-0.5 bg-white hover:bg-purple-50 cursor-pointer shadow-2xs"
                        >
                          Ganti Ukuran / Simulasi Pengalihan Kemasan
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 italic text-xs">
                Belum ada alokasi kemasan primer yang didefinisikan pada Langkah 2.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Packaging Substitution Simulator Modal */}
      {showSubSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl text-slate-800 relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                Simulasi Pengalihan Kemasan Darurat (CPKB)
              </h3>
              <button
                onClick={() => setShowSubSimulator(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-2xl text-xs text-purple-900 leading-relaxed">
              <p>
                <strong>Mengatasi Masalah Kemasan Mid-Process:</strong> Menangani kondisi darurat ketika alokasi mixing yang semula direncanakan pada ukuran kemasan tertentu, harus dialihkan ke ukuran kemasan lain karena kendala stok/mesin. Simulator ini menghitung ulang rasio konversi volumetrik secara instan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Kemasan Lama Terhambat</span>
                <span className="text-xs font-bold text-slate-800 block">
                  {packagingMaterials.find((p) => p.code === simSelectedPMToSwap)?.name}
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-700 block">
                  Jumlah Semula: {simTargetUnits.toLocaleString()} unit
                </span>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Pilih Kemasan Alternatif Baru</span>
                <select
                  value={simNewPMCode}
                  onChange={(e) => setSimNewPMCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-purple-600"
                >
                  {availablePrimaries.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.code} - {p.name} ({p.unitCapacityGrams}g)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleExecuteSimulation}
                className="w-full bg-purple-700 text-xs font-bold text-white py-2.5 rounded-xl hover:bg-purple-800 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Cpu className="w-4 h-4 text-amber-300" />
                <span>Hitung Konversi Volumetrik & Update BOM</span>
              </button>
            </div>

            {simulationLog.length > 0 && (
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-200 leading-relaxed shadow-inner">
                {simulationLog.map((log, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-1.5 ${
                      log.includes('[SUKSES]')
                        ? 'text-emerald-400 font-bold'
                        : log.includes('[PERINGATAN')
                        ? 'text-amber-400 font-semibold'
                        : ''
                    }`}
                  >
                    <span>&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
