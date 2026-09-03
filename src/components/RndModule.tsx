import React, { useState, useEffect } from 'react';
import { RawMaterial, PackagingMaterial, BulkFormulation, Product, ProductVariant } from '../types';
import { RndMaterialsTab } from './rnd/RndMaterialsTab';
import { RndPackagingTab } from './rnd/RndPackagingTab';
import { RndProductsTab } from './rnd/RndProductsTab';
import { RndFormulaTab } from './rnd/RndFormulaTab';
import { RndBomCalculatorTab } from './rnd/RndBomCalculatorTab';
import { productService } from '../features/rnd/products/productService';
import {
  FlaskConical,
  Layers,
  Sliders,
  FileSpreadsheet,
  PackageCheck,
  CheckCircle2,
  Database,
  Boxes
} from 'lucide-react';

interface RndModuleProps {
  activeSubTab?: 'materials' | 'packaging' | 'products' | 'formula' | 'bom-calculator';
  onSelectSubTab?: (subTab: 'materials' | 'packaging' | 'products' | 'formula' | 'bom-calculator') => void;
}

export const RndModule: React.FC<RndModuleProps> = ({
  activeSubTab: externalSubTab,
  onSelectSubTab: setExternalSubTab,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<'materials' | 'packaging' | 'products' | 'formula' | 'bom-calculator'>('products');
  
  const activeSubTab = externalSubTab || internalSubTab;
  const setActiveSubTab = (tab: 'materials' | 'packaging' | 'products' | 'formula' | 'bom-calculator') => {
    if (setExternalSubTab) {
      setExternalSubTab(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  // --- RAW MATERIALS STATE (B0001 dst) ---
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  // --- PACKAGING MATERIALS STATE (K0001 dst) ---
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>([]);
  // --- PRODUCTS STATE (PJ0001 dst & Multi-Variants) ---
  const [products, setProducts] = useState<Product[]>([]);
  // --- FORMULATIONS STATE ---
  const [formulations, setFormulations] = useState<BulkFormulation[]>([]);
  const [selectedFormulation, setSelectedFormulation] = useState<BulkFormulation | null>(null);

  // Initial Data Seeding
  useEffect(() => {
    // 1. Raw Materials (B0001 dst)
    const savedRM = localStorage.getItem('lsm_raw_materials_b');
    if (savedRM) {
      try {
        const parsed = JSON.parse(savedRM) as any[];
        const migrated = parsed.map((item) => {
          if (!item.qcParameters) {
            return {
              id: item.id || `rm-${Date.now()}-${Math.random()}`,
              code: item.code,
              name: item.name,
              chemicalName: item.chemicalName,
              category: item.category || 'active',
              storageConditions: item.storageConditions || 'Suhu ruang (15-25°C), kedap udara',
              sdsDocNumber: item.sdsDocNumber || 'SDS-N/A',
              approvedSubstitutes: item.approvedSubstitutes || [],
              manufacturer: item.manufacturer || 'General Manufacturer',
              qcParameters: [
                { name: 'Bentuk', specification: item.category === 'solvent' ? 'Cairan Jernih' : 'Bubuk Kristal' },
                { name: 'Warna', specification: item.category === 'solvent' ? 'Jernih tidak berwarna' : 'Putih' },
                { name: 'Bau', specification: 'Khas lemah' },
                { name: 'pH', specification: item.phMin !== undefined ? `${item.phMin.toFixed(1)} - ${item.phMax.toFixed(1)}` : '5.5 - 7.5' },
                { name: 'Kelarutan', specification: 'Mudah larut dalam air' },
                { name: 'Densitas', specification: '1.2 g/cm³' },
                { name: 'Viskositas', specification: item.category === 'solvent' ? '1.0 - 5.0 cPs' : 'N/A' }
              ]
            };
          } else {
            // Check if Viskositas is missing, and if so add it
            const hasViscosity = item.qcParameters.some((p: any) => p.name.toLowerCase() === 'viskositas');
            if (!hasViscosity) {
              return {
                ...item,
                qcParameters: [
                  ...item.qcParameters,
                  { name: 'Viskositas', specification: item.category === 'solvent' ? '1.0 - 5.0 cPs' : 'N/A' }
                ]
              };
            }
          }
          return item;
        });
        setRawMaterials(migrated);
        localStorage.setItem('lsm_raw_materials_b', JSON.stringify(migrated));
      } catch (e) {
        localStorage.removeItem('lsm_raw_materials_b');
      }
    } else {
      const defaultRM: RawMaterial[] = [
        {
          id: 'rm-1',
          code: 'B0001',
          name: 'Niacinamide (Vitamin B3)',
          chemicalName: 'Pyridine-3-carboxamide',
          category: 'active',
          storageConditions: 'Suhu Dingin (2-8°C), wadah tertutup rapat',
          sdsDocNumber: 'SDS-LMS-B0001',
          approvedSubstitutes: ['B0002'],
          manufacturer: 'DSM Nutritional Products',
          qcParameters: [
            { name: 'Bentuk', specification: 'Bubuk Kristal' },
            { name: 'Warna', specification: 'Putih' },
            { name: 'Bau', specification: 'Tidak berbau' },
            { name: 'pH', specification: '5.5 - 6.5 (solusi 5%)' },
            { name: 'Kelarutan', specification: 'Mudah larut dalam air' },
            { name: 'Densitas', specification: '1.40 g/cm³' },
            { name: 'Viskositas', specification: 'N/A (Padat)' }
          ]
        },
        {
          id: 'rm-2',
          code: 'B0002',
          name: 'Zinc PCA',
          chemicalName: 'Zinc Pyrrolidone Carboxylate',
          category: 'active',
          storageConditions: 'Suhu Ruang Terkontrol (15-25°C)',
          sdsDocNumber: 'SDS-LMS-B0002',
          approvedSubstitutes: ['B0001'],
          manufacturer: 'Ajinomoto Co., Inc.',
          qcParameters: [
            { name: 'Bentuk', specification: 'Bubuk' },
            { name: 'Warna', specification: 'Putih sampai krem' },
            { name: 'Bau', specification: 'Khas lemah' },
            { name: 'pH', specification: '5.0 - 6.0 (solusi 10%)' },
            { name: 'Kelarutan', specification: 'Larut dalam air dan etanol' },
            { name: 'Densitas', specification: '1.35 g/cm³' },
            { name: 'Viskositas', specification: 'N/A (Padat)' }
          ]
        },
        {
          id: 'rm-3',
          code: 'B0003',
          name: 'Hyaluronic Acid 1% Solution',
          chemicalName: 'Sodium Hyaluronate',
          category: 'active',
          storageConditions: 'Suhu Ruang (20-25°C)',
          sdsDocNumber: 'SDS-LMS-B0003',
          approvedSubstitutes: ['B0004'],
          manufacturer: 'Contipro a.s.',
          qcParameters: [
            { name: 'Bentuk', specification: 'Cairan Kental (Gel)' },
            { name: 'Warna', specification: 'Jernih tidak berwarna' },
            { name: 'Bau', specification: 'Tidak berbau' },
            { name: 'pH', specification: '6.0 - 7.5' },
            { name: 'Kelarutan', specification: 'Larut dalam air' },
            { name: 'Densitas', specification: '1.01 g/cm³' },
            { name: 'Viskositas', specification: '1,000 - 5,000 cPs' }
          ]
        },
        {
          id: 'rm-4',
          code: 'B0004',
          name: 'Glycerin Pure Vegetable',
          chemicalName: 'Propane-1,2,3-triol',
          category: 'excipient',
          storageConditions: 'Suhu Ruang (15-30°C)',
          sdsDocNumber: 'SDS-LMS-B0004',
          approvedSubstitutes: ['B0003'],
          manufacturer: 'Wilmar International',
          qcParameters: [
            { name: 'Bentuk', specification: 'Cairan Jernih Kental' },
            { name: 'Warna', specification: 'Jernih tidak berwarna' },
            { name: 'Bau', specification: 'Tidak berbau / Khas lemah' },
            { name: 'pH', specification: '5.5 - 7.0' },
            { name: 'Kelarutan', specification: 'Bercampur dengan air' },
            { name: 'Densitas', specification: '1.26 g/cm³' },
            { name: 'Viskositas', specification: '900 - 1,200 cPs (25°C)' }
          ]
        },
        {
          id: 'rm-5',
          code: 'B0005',
          name: 'Phenoxyethanol (Preservative)',
          chemicalName: '2-Phenoxyethanol',
          category: 'preservative',
          storageConditions: 'Suhu Ruang (20-25°C)',
          sdsDocNumber: 'SDS-LMS-B0005',
          approvedSubstitutes: [],
          manufacturer: 'Clariant SE',
          qcParameters: [
            { name: 'Bentuk', specification: 'Cairan Berminyak' },
            { name: 'Warna', specification: 'Jernih tidak berwarna' },
            { name: 'Bau', specification: 'Bau khas mawar' },
            { name: 'pH', specification: '4.0 - 8.5' },
            { name: 'Kelarutan', specification: 'Sedikit larut air, larut dalam alkohol' },
            { name: 'Densitas', specification: '1.11 g/cm³' },
            { name: 'Viskositas', specification: '20 - 40 cPs' }
          ]
        },
        {
          id: 'rm-6',
          code: 'B0006',
          name: 'Purified Water (Aqua Demin)',
          chemicalName: 'Hydrogen Oxide',
          category: 'solvent',
          storageConditions: 'Suhu Ruang (20-25°C)',
          sdsDocNumber: 'SDS-LMS-B0006',
          approvedSubstitutes: [],
          manufacturer: 'PT. Brataco',
          qcParameters: [
            { name: 'Bentuk', specification: 'Cairan Cair' },
            { name: 'Warna', specification: 'Jernih tidak berwarna' },
            { name: 'Bau', specification: 'Tidak berbau' },
            { name: 'pH', specification: '6.5 - 7.5' },
            { name: 'Kelarutan', specification: 'Sangat bercampur air' },
            { name: 'Densitas', specification: '1.00 g/cm³' },
            { name: 'Viskositas', specification: '0.89 cPs (Suhu ruang)' }
          ]
        },
        {
          id: 'rm-7',
          code: 'B0007',
          name: 'Cetyl Alcohol NF',
          chemicalName: 'Hexadecan-1-ol',
          category: 'emulsifier',
          storageConditions: 'Suhu Ruang Terkontrol (15-25°C)',
          sdsDocNumber: 'SDS-LMS-B0007',
          approvedSubstitutes: [],
          manufacturer: 'BASF SE',
          qcParameters: [
            { name: 'Bentuk', specification: 'Serpihan / Lilin Padat' },
            { name: 'Warna', specification: 'Putih bersih' },
            { name: 'Bau', specification: 'Bau khas lemah' },
            { name: 'pH', specification: '5.5 - 7.5' },
            { name: 'Kelarutan', specification: 'Tidak larut air, larut dalam minyak hangat' },
            { name: 'Densitas', specification: '0.81 g/cm³' },
            { name: 'Viskositas', specification: 'N/A (Padat)' }
          ]
        },
      ];
      setRawMaterials(defaultRM);
      localStorage.setItem('lsm_raw_materials_b', JSON.stringify(defaultRM));
    }

    // 2. Packaging Materials (K0001 dst)
    const savedPM = localStorage.getItem('lsm_packaging_materials_k');
    if (savedPM) {
      setPackagingMaterials(JSON.parse(savedPM));
    } else {
      const defaultPM: PackagingMaterial[] = [
        {
          id: 'pm-1',
          code: 'K0001',
          name: 'Luxury Acrylic Gold Jar 20g',
          type: 'primary',
          unit: 'Pot / Jar',
          unitCapacityGrams: 20,
          supplier: 'PT. Prima Kemas Lestari',
          storageLocation: 'Rak A-01-B',
          storageConditions: 'Suhu ruang (15-25°C), Kering & Bersih',
        },
        {
          id: 'pm-2',
          code: 'K0002',
          name: 'Airless Pump Bottle 50ml Glossy',
          type: 'primary',
          unit: 'Botol',
          unitCapacityGrams: 50,
          supplier: 'PT. Kemas Unggul Abadi',
          storageLocation: 'Rak A-02-C',
          storageConditions: 'Suhu ruang (15-25°C), Kering',
        },
        {
          id: 'pm-3',
          code: 'K0003',
          name: 'Cosmetic Squeeze Tube 50g',
          type: 'primary',
          unit: 'Tube',
          unitCapacityGrams: 50,
          supplier: 'PT. Kemas Unggul Abadi',
          storageLocation: 'Rak A-03-A',
          storageConditions: 'Suhu ruang (15-25°C), Bebas sinar UV',
        },
        {
          id: 'pm-4',
          code: 'K0004',
          name: 'Premium Gold Carton Box',
          type: 'secondary',
          unit: 'Box / Dus',
          unitCapacityGrams: 0,
          supplier: 'PT. Cetak Box Mulia',
          storageLocation: 'Rak B-01-A',
          storageConditions: 'Tempat Kering & Bebas Lembap',
        },
        {
          id: 'pm-5',
          code: 'K0005',
          name: 'Master Outer Box Corrugated (24-50 units)',
          type: 'tertiary',
          unit: 'Karton',
          unitCapacityGrams: 0,
          supplier: 'PT. Karton Indonesia',
          storageLocation: 'Area Palet T-01',
          storageConditions: 'Suhu ruang, Ditumpuk Maks 5',
        },
      ];
      setPackagingMaterials(defaultPM);
      localStorage.setItem('lsm_packaging_materials_k', JSON.stringify(defaultPM));
    }

    // 3. Products & Multi-Variants (PJ0001, PJ0002)
    productService.getProducts().then((res) => {
      setProducts(res);
    });

    // 4. Formulations (using B0001-B0007)
    const savedFormulas = localStorage.getItem('lsm_formulations_v2');
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
            { rawMaterialCode: 'B0006', percentage: 74 },
            { rawMaterialCode: 'B0007', percentage: 10 },
            { rawMaterialCode: 'B0004', percentage: 8 },
            { rawMaterialCode: 'B0001', percentage: 5 },
            { rawMaterialCode: 'B0002', percentage: 2 },
            { rawMaterialCode: 'B0005', percentage: 1 },
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
            { rawMaterialCode: 'B0006', percentage: 80 },
            { rawMaterialCode: 'B0003', percentage: 10 },
            { rawMaterialCode: 'B0004', percentage: 6 },
            { rawMaterialCode: 'B0001', percentage: 3 },
            { rawMaterialCode: 'B0005', percentage: 1 },
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
      localStorage.setItem('lsm_formulations_v2', JSON.stringify(defaultFormulas));
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
    localStorage.setItem('lsm_raw_materials_b', JSON.stringify(updated));
  };

  const handleDeleteRM = (id: string) => {
    const updated = rawMaterials.filter((r) => r.id !== id);
    setRawMaterials(updated);
    localStorage.setItem('lsm_raw_materials_b', JSON.stringify(updated));
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
    localStorage.setItem('lsm_packaging_materials_k', JSON.stringify(updated));
  };

  const handleDeletePM = (id: string) => {
    const updated = packagingMaterials.filter((p) => p.id !== id);
    setPackagingMaterials(updated);
    localStorage.setItem('lsm_packaging_materials_k', JSON.stringify(updated));
  };

  const handleSaveFormula = (newFormula: BulkFormulation) => {
    const exists = formulations.some((f) => f.id === newFormula.id);
    let updated: BulkFormulation[];
    if (exists) {
      updated = formulations.map((f) => (f.id === newFormula.id ? newFormula : f));
    } else {
      updated = [newFormula, ...formulations];
    }
    setFormulations(updated);
    setSelectedFormulation(newFormula);
    localStorage.setItem('lsm_formulations_v2', JSON.stringify(updated));
  };

  // --- PRODUCTS & VARIANTS HANDLERS ---
  const handleSaveProduct = (newProd: Product) => {
    const exists = products.some((p) => p.id === newProd.id);
    let updated: Product[];
    if (exists) {
      updated = products.map((p) => (p.id === newProd.id ? newProd : p));
    } else {
      updated = [newProd, ...products];
    }
    setProducts(updated);
    productService.saveProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    productService.saveProducts(updated);
  };

  const handleSaveVariant = (productId: string, variant: ProductVariant) => {
    const updated = products.map((prod) => {
      if (prod.id !== productId) return prod;
      const vExists = prod.variants.some((v) => v.id === variant.id);
      let newVariants: ProductVariant[];
      if (vExists) {
        newVariants = prod.variants.map((v) => (v.id === variant.id ? variant : v));
      } else {
        newVariants = [...prod.variants, variant];
      }
      return { ...prod, variants: newVariants };
    });
    setProducts(updated);
    productService.saveProducts(updated);
  };

  const handleDeleteVariant = (productId: string, variantId: string) => {
    const updated = products.map((prod) => {
      if (prod.id !== productId) return prod;
      return {
        ...prod,
        variants: prod.variants.filter((v) => v.id !== variantId),
      };
    });
    setProducts(updated);
    productService.saveProducts(updated);
  };

  const totalVariantsCount = products.reduce((sum, p) => sum + p.variants.length, 0);

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
            <span className="text-xs text-slate-500 font-medium">Pengkodean B0001, K0001, PJ0001 & Dynamic BOM</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Research & Development (RnD Master Data)
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Pusat master data Bahan Baku (<span className="font-mono font-bold text-purple-700">B0001 dst</span>), Bahan Kemas (<span className="font-mono font-bold text-purple-700">K0001 dst</span>), Produk Jadi Multi-Varian (<span className="font-mono font-bold text-purple-700">PJ0001 dst</span>), standarisasi formulasi bulk, dan kalkulator kebutuhan material yang terverifikasi BPOM.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Produk (PJ)</span>
            <span className="text-base font-black text-purple-700 font-mono">{products.length} ({totalVariantsCount} Varian)</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Bahan Baku (B)</span>
            <span className="text-base font-black text-slate-800 font-mono">{rawMaterials.length} Item</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Bahan Kemas (K)</span>
            <span className="text-base font-black text-slate-800 font-mono">{packagingMaterials.length} Item</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'products'
              ? 'bg-purple-700 border-purple-700 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Produk Jadi & Varian (PJ0001)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('materials')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'materials'
              ? 'bg-purple-700 border-purple-700 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Bahan Baku (B0001)</span>
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
          <span>Bahan Kemas (K0001)</span>
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
          <span>Dynamic BOM Calculator</span>
        </button>
      </div>

      {/* Sub-Tab Panels */}
      {activeSubTab === 'products' && (
        <RndProductsTab
          products={products}
          formulations={formulations}
          packagingMaterials={packagingMaterials}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onSaveVariant={handleSaveVariant}
          onDeleteVariant={handleDeleteVariant}
        />
      )}

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

