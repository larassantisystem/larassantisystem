import React, { useState, useEffect } from 'react';
import { RawMaterial, PackagingMaterial, BulkFormulation } from '../types';
import { RndMaterialsTab } from './rnd/RndMaterialsTab';
import { RndPackagingTab } from './rnd/RndPackagingTab';
import { RndFormulaTab } from './rnd/RndFormulaTab';
import { RndBomCalculatorTab } from './rnd/RndBomCalculatorTab';
import {
  FlaskConical,
  Layers,
  Sliders,
  FileSpreadsheet,
  CheckCircle2,
  Database
} from 'lucide-react';

export const RndModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'packaging' | 'formula' | 'bom-calculator'>('materials');

  // --- RAW MATERIALS STATE ---
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  // --- PACKAGING MATERIALS STATE ---
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>([]);
  // --- FORMULATIONS STATE ---
  const [formulations, setFormulations] = useState<BulkFormulation[]>([]);
  const [selectedFormulation, setSelectedFormulation] = useState<BulkFormulation | null>(null);

  // Initial Data Seeding
  useEffect(() => {
    // 1. Raw Materials
    const savedRM = localStorage.getItem('lsm_raw_materials');
    if (savedRM) {
      setRawMaterials(JSON.parse(savedRM));
    } else {
      const defaultRM: RawMaterial[] = [
        {
          id: 'rm-1',
          code: 'RM-101',
          name: 'Niacinamide (Vitamin B3)',
          chemicalName: 'Pyridine-3-carboxamide',
          category: 'active',
          phMin: 5.5,
          phMax: 6.5,
          storageConditions: 'Suhu Dingin (2-8°C), wadah tertutup rapat',
          sdsDocNumber: 'SDS-LSM-101',
          approvedSubstitutes: ['RM-102'],
          specGrade: 'Cosmetic Grade USP',
        },
        {
          id: 'rm-2',
          code: 'RM-102',
          name: 'Zinc PCA',
          chemicalName: 'Zinc Pyrrolidone Carboxylate',
          category: 'active',
          phMin: 5.0,
          phMax: 6.0,
          storageConditions: 'Suhu Ruang Terkontrol (15-25°C)',
          sdsDocNumber: 'SDS-LSM-102',
          approvedSubstitutes: ['RM-101'],
          specGrade: 'Pharma Grade Pure',
        },
        {
          id: 'rm-3',
          code: 'RM-103',
          name: 'Hyaluronic Acid 1% Solution',
          chemicalName: 'Sodium Hyaluronate',
          category: 'active',
          phMin: 6.0,
          phMax: 7.5,
          storageConditions: 'Suhu Ruang (20-25°C)',
          sdsDocNumber: 'SDS-LSM-103',
          approvedSubstitutes: ['RM-104'],
          specGrade: 'Cosmetic Grade USP',
        },
        {
          id: 'rm-4',
          code: 'RM-104',
          name: 'Glycerin Pure Vegetable',
          chemicalName: 'Propane-1,2,3-triol',
          category: 'excipient',
          phMin: 5.5,
          phMax: 7.0,
          storageConditions: 'Suhu Ruang (15-30°C)',
          sdsDocNumber: 'SDS-LSM-104',
          approvedSubstitutes: ['RM-103'],
          specGrade: 'Pharma Grade USP',
        },
        {
          id: 'rm-5',
          code: 'RM-105',
          name: 'Phenoxyethanol (Preservative)',
          chemicalName: '2-Phenoxyethanol',
          category: 'preservative',
          phMin: 4.0,
          phMax: 8.5,
          storageConditions: 'Suhu Ruang (20-25°C)',
          sdsDocNumber: 'SDS-LSM-105',
          approvedSubstitutes: [],
          specGrade: 'Cosmetic Preservative Grade',
        },
        {
          id: 'rm-6',
          code: 'RM-106',
          name: 'Purified Water (Aqua Demin)',
          chemicalName: 'Hydrogen Oxide',
          category: 'solvent',
          phMin: 6.5,
          phMax: 7.5,
          storageConditions: 'Suhu Ruang (20-25°C)',
          sdsDocNumber: 'SDS-LSM-106',
          approvedSubstitutes: [],
          specGrade: 'Purified Water USP',
        },
        {
          id: 'rm-7',
          code: 'RM-107',
          name: 'Cetyl Alcohol NF',
          chemicalName: 'Hexadecan-1-ol',
          category: 'emulsifier',
          phMin: 5.5,
          phMax: 7.5,
          storageConditions: 'Suhu Ruang Terkontrol (15-25°C)',
          sdsDocNumber: 'SDS-LSM-107',
          approvedSubstitutes: [],
          specGrade: 'USP Emulsifying Wax',
        },
      ];
      setRawMaterials(defaultRM);
      localStorage.setItem('lsm_raw_materials', JSON.stringify(defaultRM));
    }

    // 2. Packaging Materials
    const savedPM = localStorage.getItem('lsm_packaging_materials');
    if (savedPM) {
      setPackagingMaterials(JSON.parse(savedPM));
    } else {
      const defaultPM: PackagingMaterial[] = [
        {
          id: 'pm-1',
          code: 'PM-201',
          name: 'Luxury Acrylic Gold Jar 10g',
          type: 'primary',
          unitCapacityGrams: 10,
          materialSpec: 'PMMA Double-walled Gold Painted with Inner Lid',
          artworkVersion: 'v1.2 (BPOM Verified)',
        },
        {
          id: 'pm-2',
          code: 'PM-202',
          name: 'Luxury Acrylic Gold Jar 20g',
          type: 'primary',
          unitCapacityGrams: 20,
          materialSpec: 'PMMA Double-walled Gold Painted with Inner Lid',
          artworkVersion: 'v1.2 (BPOM Verified)',
        },
        {
          id: 'pm-3',
          code: 'PM-203',
          name: 'Cosmetic Squeeze Tube 50g',
          type: 'primary',
          unitCapacityGrams: 50,
          materialSpec: 'LDPE White Glossy with Gold Cap',
          artworkVersion: 'v2.0 (BPOM Verified)',
        },
        {
          id: 'pm-4',
          code: 'PM-204',
          name: 'Premium Gold Carton Box (10g/20g)',
          type: 'secondary',
          unitCapacityGrams: 0,
          materialSpec: 'Art Paper 350gsm with Hot Gold Foil Embellishment',
          artworkVersion: 'v1.0',
        },
        {
          id: 'pm-5',
          code: 'PM-205',
          name: 'Master Outer Box Corrugated (24 units)',
          type: 'tertiary',
          unitCapacityGrams: 0,
          materialSpec: 'Double Wall Kraft Carton B-Flute',
          artworkVersion: 'v1.0',
        },
      ];
      setPackagingMaterials(defaultPM);
      localStorage.setItem('lsm_packaging_materials', JSON.stringify(defaultPM));
    }

    // 3. Formulations
    const savedFormulas = localStorage.getItem('lsm_formulations');
    if (savedFormulas) {
      const parsed = JSON.parse(savedFormulas);
      setFormulations(parsed);
      if (parsed.length > 0) setSelectedFormulation(parsed[0]);
    } else {
      const defaultFormulas: BulkFormulation[] = [
        {
          id: 'form-1',
          code: 'FORM-01',
          name: 'Luxury Brightening Facial Cream (Gold Series)',
          bulkQuantityKg: 100,
          ingredients: [
            { rawMaterialCode: 'RM-106', percentage: 74 },
            { rawMaterialCode: 'RM-107', percentage: 10 },
            { rawMaterialCode: 'RM-104', percentage: 8 },
            { rawMaterialCode: 'RM-101', percentage: 5 },
            { rawMaterialCode: 'RM-102', percentage: 2 },
            { rawMaterialCode: 'RM-105', percentage: 1 },
          ],
          targetPh: 5.8,
          phTolerance: 0.3,
          targetViscosity: '18,000 - 22,000 cPs',
          gravityTarget: 1.015,
          mixingInstructions:
            '1. Panaskan Air Purified ke suhu 75°C.\n2. Lebur Cetyl Alcohol di wadah fase minyak terpisah pada suhu 75°C.\n3. Satukan fase air dan minyak, lakukan emulsifikasi berkecepatan 3000 RPM selama 20 menit.\n4. Turunkan suhu ke 40°C, tambahkan Niacinamide, Zinc PCA, Glycerin, dan Phenoxyethanol. Homogenkan selama 10 menit.\n5. IPC Quality sampling untuk pH dan viskositas.',
        },
        {
          id: 'form-2',
          code: 'FORM-02',
          name: 'Deep Hydrating Serum Booster',
          bulkQuantityKg: 100,
          ingredients: [
            { rawMaterialCode: 'RM-106', percentage: 80 },
            { rawMaterialCode: 'RM-103', percentage: 10 },
            { rawMaterialCode: 'RM-104', percentage: 6 },
            { rawMaterialCode: 'RM-101', percentage: 3 },
            { rawMaterialCode: 'RM-105', percentage: 1 },
          ],
          targetPh: 6.2,
          phTolerance: 0.2,
          targetViscosity: '3,000 - 5,000 cPs',
          gravityTarget: 1.008,
          mixingInstructions:
            '1. Masukkan Purified Water ke tangki utama pada suhu ruang.\n2. Larutkan Hyaluronic Acid perlahan dengan pengaduk turbin kecepatan sedang hingga larut sempurna tanpa gumpalan.\n3. Tambahkan Glycerin, Niacinamide, dan Phenoxyethanol.\n4. Lakukan aerasi purging dan uji konfirmasi pH.',
        },
      ];
      setFormulations(defaultFormulas);
      setSelectedFormulation(defaultFormulas[0]);
      localStorage.setItem('lsm_formulations', JSON.stringify(defaultFormulas));
    }
  }, []);

  const handleSaveRM = (newRM: RawMaterial) => {
    const exists = rawMaterials.some((r) => r.id === newRM.id);
    let updated: RawMaterial[];
    if (exists) {
      updated = rawMaterials.map((r) => (r.id === newRM.id ? newRM : r));
    } else {
      updated = [newRM, ...rawMaterials];
    }
    setRawMaterials(updated);
    localStorage.setItem('lsm_raw_materials', JSON.stringify(updated));
  };

  const handleDeleteRM = (id: string) => {
    const updated = rawMaterials.filter((r) => r.id !== id);
    setRawMaterials(updated);
    localStorage.setItem('lsm_raw_materials', JSON.stringify(updated));
  };

  const handleSavePM = (newPM: PackagingMaterial) => {
    const exists = packagingMaterials.some((p) => p.id === newPM.id);
    let updated: PackagingMaterial[];
    if (exists) {
      updated = packagingMaterials.map((p) => (p.id === newPM.id ? newPM : p));
    } else {
      updated = [newPM, ...packagingMaterials];
    }
    setPackagingMaterials(updated);
    localStorage.setItem('lsm_packaging_materials', JSON.stringify(updated));
  };

  const handleDeletePM = (id: string) => {
    const updated = packagingMaterials.filter((p) => p.id !== id);
    setPackagingMaterials(updated);
    localStorage.setItem('lsm_packaging_materials', JSON.stringify(updated));
  };

  const handleSaveFormula = (newFormula: BulkFormulation) => {
    const updated = [newFormula, ...formulations];
    setFormulations(updated);
    setSelectedFormulation(newFormula);
    localStorage.setItem('lsm_formulations', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
              Master Data CPKB / GMP
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Spesifikasi Teknis & Dynamic BOM</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Research & Development (RnD Master Data)
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Pusat master data bahan baku (Raw Material), kemasan (Packaging Material), standarisasi formulasi bulk, dan kalkulator kebutuhan material yang terverifikasi standar mutu kosmetik BPOM.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Formulasi</span>
            <span className="text-lg font-black text-purple-700 font-mono">{formulations.length} Master</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Bahan RM</span>
            <span className="text-lg font-black text-slate-800 font-mono">{rawMaterials.length} Item</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('materials')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'materials'
              ? 'bg-purple-700 border-purple-700 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Bahan Baku (Raw Materials)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('packaging')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'packaging'
              ? 'bg-purple-700 border-purple-700 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kemasan (Packaging)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('formula')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'formula'
              ? 'bg-purple-700 border-purple-700 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Master Formula & Instruksi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bom-calculator')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'bom-calculator'
              ? 'bg-purple-700 border-purple-700 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Dynamic BOM & Multi-Packaging Calculator</span>
        </button>
      </div>

      {/* Sub-Tab Panels */}
      {activeSubTab === 'materials' && (
        <RndMaterialsTab
          rawMaterials={rawMaterials}
          onSaveRM={handleSaveRM}
          onDeleteRM={handleDeleteRM}
        />
      )}

      {activeSubTab === 'packaging' && (
        <RndPackagingTab
          packagingMaterials={packagingMaterials}
          onSavePM={handleSavePM}
          onDeletePM={handleDeletePM}
        />
      )}

      {activeSubTab === 'formula' && (
        <RndFormulaTab
          formulations={formulations}
          rawMaterials={rawMaterials}
          selectedFormulation={selectedFormulation}
          onSelectFormulation={setSelectedFormulation}
          onSaveFormula={handleSaveFormula}
        />
      )}

      {activeSubTab === 'bom-calculator' && (
        <RndBomCalculatorTab
          formulations={formulations}
          packagingMaterials={packagingMaterials}
          rawMaterials={rawMaterials}
          selectedFormulation={selectedFormulation}
          onSelectFormulation={setSelectedFormulation}
        />
      )}
    </div>
  );
};
