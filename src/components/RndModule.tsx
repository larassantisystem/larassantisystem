import React, { useState, useEffect } from 'react';
import { RawMaterial, PackagingMaterial, BulkFormulation, Product, ProductVariant } from '../types';
import { RndMaterialsTab } from './rnd/RndMaterialsTab';
import { RndPackagingTab } from './rnd/RndPackagingTab';
import { RndProductsTab } from './rnd/RndProductsTab';
import { RndFormulaTab } from './rnd/RndFormulaTab';
import { RndBomCalculatorTab } from './rnd/RndBomCalculatorTab';
import { productService } from '../features/rnd/products/productService';
import { materialService } from '../features/rnd/materials/materialService';
import { packagingService } from '../features/rnd/materials/packagingService';
import {
  FlaskConical,
  Layers,
  Sliders,
  FileSpreadsheet,
  PackageCheck,
  CheckCircle2,
  Database,
  Boxes,
  Trash2
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

  // Data Loading
  useEffect(() => {
    const savedRM = localStorage.getItem('lsm_raw_materials_b');
    const savedPM = localStorage.getItem('lsm_packaging_materials_k');

    if (savedRM) {
      try {
        setRawMaterials(JSON.parse(savedRM));
      } catch (e) {
        setRawMaterials([]);
      }
    }
    if (savedPM) {
      try {
        setPackagingMaterials(JSON.parse(savedPM));
      } catch (e) {
        setPackagingMaterials([]);
      }
    }

    // 3. Sync Materials & Packaging with Supabase
    materialService.getMaterials().then((res) => {
      if (res) {
        setRawMaterials(res);
      }
    });

    packagingService.getPackagingMaterials().then((res) => {
      if (res) {
        setPackagingMaterials(res);
      }
    });

    // 4. Products & Multi-Variants (PJ0001, PJ0002)
    productService.getProducts().then((res) => {
      setProducts(res);
    });

    // 4. Formulations (using B0001-B0007)
    const savedFormulas = localStorage.getItem('lsm_formulations_v2');
    if (savedFormulas) {
      const parsed = JSON.parse(savedFormulas);
      setFormulations(parsed);
      if (parsed.length > 0) setSelectedFormulation(parsed[0]);
    }
  }, []);

  const handleSaveRM = async (newRM: RawMaterial) => {
    const res = await materialService.saveSingleMaterial(newRM);
    const resolvedRM: RawMaterial = res.updatedId ? { ...newRM, id: res.updatedId } : newRM;

    const exists = rawMaterials.some((r) => r.id === resolvedRM.id || r.code === resolvedRM.code);
    let updated: RawMaterial[];
    if (exists) {
      updated = rawMaterials.map((r) => (r.id === resolvedRM.id || r.code === resolvedRM.code ? resolvedRM : r));
    } else {
      updated = [resolvedRM, ...rawMaterials];
    }
    setRawMaterials(updated);
    localStorage.setItem('lsm_raw_materials_b', JSON.stringify(updated));
  };

  const handleDeleteRM = (id: string) => {
    const rm = rawMaterials.find((r) => r.id === id);
    const updated = rawMaterials.filter((r) => r.id !== id && (!rm?.code || r.code !== rm.code));
    setRawMaterials(updated);
    localStorage.setItem('lsm_raw_materials_b', JSON.stringify(updated));
    materialService.deleteMaterial(id, rm?.code);
  };

  const handleSavePM = async (newPM: PackagingMaterial) => {
    const res = await packagingService.saveSinglePackagingMaterial(newPM);
    const resolvedPM: PackagingMaterial = res.updatedId ? { ...newPM, id: res.updatedId } : newPM;

    const exists = packagingMaterials.some((p) => p.id === resolvedPM.id || p.code === resolvedPM.code);
    let updated: PackagingMaterial[];
    if (exists) {
      updated = packagingMaterials.map((p) => (p.id === resolvedPM.id || p.code === resolvedPM.code ? resolvedPM : p));
    } else {
      updated = [resolvedPM, ...packagingMaterials];
    }
    setPackagingMaterials(updated);
    localStorage.setItem('lsm_packaging_materials_k', JSON.stringify(updated));
  };

  const handleDeletePM = (id: string) => {
    const pm = packagingMaterials.find((p) => p.id === id);
    const updated = packagingMaterials.filter((p) => p.id !== id && (!pm?.code || p.code !== pm.code));
    setPackagingMaterials(updated);
    localStorage.setItem('lsm_packaging_materials_k', JSON.stringify(updated));
    packagingService.deletePackagingMaterial(id, pm?.code);
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

  const handleClearAllMaterials = async () => {
    if (window.confirm('Hapus semua data sementara / demo Bahan Baku & Bahan Kemas? Anda dapat menginputkan data baru secara manual melalui form aplikasi.')) {
      const rmToDelete = [...rawMaterials];
      const pmToDelete = [...packagingMaterials];

      setRawMaterials([]);
      setPackagingMaterials([]);
      localStorage.setItem('lsm_raw_materials_b', JSON.stringify([]));
      localStorage.setItem('lsm_packaging_materials_k', JSON.stringify([]));
      
      // Delete from Supabase in background
      for (const rm of rmToDelete) {
        await materialService.deleteMaterial(rm.id, rm.code);
      }
      for (const pm of pmToDelete) {
        await packagingService.deletePackagingMaterial(pm.id, pm.code);
      }
      alert('Semua data Bahan Baku & Bahan Kemas sementara telah dibersihkan!');
    }
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

          {(rawMaterials.length > 0 || packagingMaterials.length > 0) && (
            <button
              onClick={handleClearAllMaterials}
              className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Hapus data sementara / demo agar bisa diinput dari awal melalui aplikasi"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Data BB & BK</span>
            </button>
          )}
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

