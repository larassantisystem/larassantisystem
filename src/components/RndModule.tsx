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

  // Initial Data Seeding
  useEffect(() => {
    // 1. Raw Materials (10 items inputted by staff RnD)
    const newOfficialRM: RawMaterial[] = [
      {
        id: 'rm-101',
        code: 'B0101',
        specNumber: 'SP-BB-B0101',
        name: 'Niacinamide USP Grade (Vitamin B3)',
        chemicalName: 'Pyridine-3-carboxamide',
        category: 'active',
        categories: ['active'],
        storageConditions: 'Suhu ruang (15-25°C), tempat kering & tertutup rapat',
        sdsDocNumber: 'SDS-RND-BB-0101',
        approvedSubstitutes: ['B0104'],
        manufacturer: 'DSM Nutritional Products',
        qcParameters: [
          { name: 'Bentuk', specification: 'Bubuk Kristal Halus' },
          { name: 'Warna', specification: 'Putih Murni' },
          { name: 'Bau', specification: 'Tidak Berbau' },
          { name: 'pH', specification: '5.5 - 6.5 (Larutan 5%)' },
          { name: 'Kelarutan', specification: 'Mudah Larut Dalam Air' },
          { name: 'Kadar Kemurnian', specification: '≥ 99.0%' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 08:30 WIB'
      },
      {
        id: 'rm-102',
        code: 'B0102',
        specNumber: 'SP-BB-B0102',
        name: 'Centella Asiatica Leaf Extract 95%',
        chemicalName: 'Centella Asiatica Extract',
        category: 'active',
        categories: ['active'],
        storageConditions: 'Suhu dingin (2-8°C), terlindung dari sinar matahari',
        sdsDocNumber: 'SDS-RND-BB-0102',
        approvedSubstitutes: [],
        manufacturer: 'Indena S.p.A.',
        qcParameters: [
          { name: 'Bentuk', specification: 'Serbuk Ekstrak Halus' },
          { name: 'Warna', specification: 'Cokelat Kehijauan Halus' },
          { name: 'Bau', specification: 'Khas Herbal Soft' },
          { name: 'pH', specification: '5.0 - 7.0' },
          { name: 'Kelarutan', specification: 'Larut Dalam Air & Etanol' },
          { name: 'Kadar Madecassoside', specification: '≥ 40.0%' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 08:45 WIB'
      },
      {
        id: 'rm-103',
        specNumber: 'SP-BB-B0103',
        code: 'B0103',
        name: 'Sodium Hyaluronate High Molecular Weight',
        chemicalName: 'Sodium Hyaluronate',
        category: 'active',
        categories: ['active'],
        storageConditions: 'Suhu ruang (15-25°C), kedap udara & kering',
        sdsDocNumber: 'SDS-RND-BB-0103',
        approvedSubstitutes: [],
        manufacturer: 'Contipro a.s.',
        qcParameters: [
          { name: 'Bentuk', specification: 'Serbuk Granul Halus' },
          { name: 'Warna', specification: 'Putih Murni' },
          { name: 'Bau', specification: 'Tidak Berbau' },
          { name: 'pH', specification: '6.0 - 7.5 (Larutan 0.1%)' },
          { name: 'Kelarutan', specification: 'Larut Membentuk Gel Jernih' },
          { name: 'Berat Molekul', specification: '1.5 - 1.8 MDa' }
        ],
        lastModifiedBy: 'Staff RnD - Budi, S.Si',
        lastModifiedAt: '2026-09-03 09:00 WIB'
      },
      {
        id: 'rm-104',
        code: 'B0104',
        specNumber: 'SP-BB-B0104',
        name: 'Alpha Arbutin Pure Cosmetic Grade',
        chemicalName: '4-Hydroxyphenyl-alpha-D-glucopyranoside',
        category: 'active',
        categories: ['active'],
        storageConditions: 'Suhu ruang (15-25°C), terlindung dari cahaya',
        sdsDocNumber: 'SDS-RND-BB-0104',
        approvedSubstitutes: ['B0101'],
        manufacturer: 'Pentapharm / DSM',
        qcParameters: [
          { name: 'Bentuk', specification: 'Serbuk Kristal' },
          { name: 'Warna', specification: 'Putih Hingga Hampir Putih' },
          { name: 'Bau', specification: 'Tidak Berbau' },
          { name: 'pH', specification: '5.0 - 7.0 (Larutan 1%)' },
          { name: 'Titik Leleh', specification: '203 - 207°C' },
          { name: 'Kadar Kemurnian', specification: '≥ 99.5%' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 09:15 WIB'
      },
      {
        id: 'rm-105',
        code: 'B0105',
        specNumber: 'SP-BB-B0105',
        name: 'Salicylic Acid Ph. Eur. / USP Grade',
        chemicalName: '2-Hydroxybenzoic acid',
        category: 'active',
        categories: ['active'],
        storageConditions: 'Suhu ruang (15-25°C), wadah tertutup rapat',
        sdsDocNumber: 'SDS-RND-BB-0105',
        approvedSubstitutes: [],
        manufacturer: 'Novacyl SA',
        qcParameters: [
          { name: 'Bentuk', specification: 'Serbuk/Kristal Jarum' },
          { name: 'Warna', specification: 'Putih Murni' },
          { name: 'Bau', specification: 'Khas Lemah' },
          { name: 'pH', specification: '2.4 (Larutan Jenuh)' },
          { name: 'Kelarutan', specification: 'Larut Dalam Alkohol/Propanediol' },
          { name: 'Kadar Kemurnian', specification: '99.5 - 101.0%' }
        ],
        lastModifiedBy: 'Staff RnD - Budi, S.Si',
        lastModifiedAt: '2026-09-03 09:30 WIB'
      },
      {
        id: 'rm-106',
        code: 'B0106',
        specNumber: 'SP-BB-B0106',
        name: 'Glycerin Vegetable Grade 99.7% Pure',
        chemicalName: 'Propane-1,2,3-triol',
        category: 'excipient',
        categories: ['excipient'],
        storageConditions: 'Suhu ruang (15-30°C), bebas lembap',
        sdsDocNumber: 'SDS-RND-BB-0106',
        approvedSubstitutes: ['B0107'],
        manufacturer: 'Wilmar International',
        qcParameters: [
          { name: 'Bentuk', specification: 'Cairan Kental Jernih' },
          { name: 'Warna', specification: 'Jernih Tidak Berwarna' },
          { name: 'Bau', specification: 'Tidak Berbau' },
          { name: 'pH', specification: '5.5 - 7.0' },
          { name: 'Densitas (20°C)', specification: '1.261 g/cm³' },
          { name: 'Kadar Kemurnian', specification: '≥ 99.7%' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 09:45 WIB'
      },
      {
        id: 'rm-107',
        code: 'B0107',
        specNumber: 'SP-BB-B0107',
        name: 'Propanediol Natural (Zemea)',
        chemicalName: '1,3-Propanediol',
        category: 'solvent',
        categories: ['solvent', 'excipient'],
        storageConditions: 'Suhu ruang (15-25°C), tempat kering',
        sdsDocNumber: 'SDS-RND-BB-0107',
        approvedSubstitutes: ['B0106'],
        manufacturer: 'DuPont Tate & Lyle BioProducts',
        qcParameters: [
          { name: 'Bentuk', specification: 'Cairan Jernih Encuk' },
          { name: 'Warna', specification: 'Jernih Tidak Berwarna' },
          { name: 'Bau', specification: 'Tidak Berbau' },
          { name: 'pH', specification: '5.0 - 7.5' },
          { name: 'Densitas (20°C)', specification: '1.053 g/cm³' },
          { name: 'Kadar Air', specification: '≤ 0.2%' }
        ],
        lastModifiedBy: 'Staff RnD - Budi, S.Si',
        lastModifiedAt: '2026-09-03 10:00 WIB'
      },
      {
        id: 'rm-108',
        code: 'B0108',
        specNumber: 'SP-BB-B0108',
        name: 'Tocopheryl Acetate (Vitamin E Acetate)',
        chemicalName: 'DL-alpha-Tocopheryl Acetate',
        category: 'active',
        categories: ['active'],
        storageConditions: 'Suhu dingin (2-8°C), tempat gelap kedap udara',
        sdsDocNumber: 'SDS-RND-BB-0108',
        approvedSubstitutes: [],
        manufacturer: 'BASF SE',
        qcParameters: [
          { name: 'Bentuk', specification: 'Cairan Berminyak Kental' },
          { name: 'Warna', specification: 'Kuning Jernih Keemasan' },
          { name: 'Bau', specification: 'Khas Lemah' },
          { name: 'Kelarutan', specification: 'Larut Dalam Minyak & Alkohol' },
          { name: 'Indeks Bias', specification: '1.503 - 1.507' },
          { name: 'Kadar Kemurnian', specification: '≥ 98.0%' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 10:15 WIB'
      },
      {
        id: 'rm-109',
        code: 'B0109',
        specNumber: 'SP-BB-B0109',
        name: 'Xanthan Gum Cosmetic Grade 200 Mesh',
        chemicalName: 'Xanthan Gum',
        category: 'thickener',
        categories: ['thickener'],
        storageConditions: 'Suhu ruang (15-25°C), hindari kelembapan tinggi',
        sdsDocNumber: 'SDS-RND-BB-0109',
        approvedSubstitutes: [],
        manufacturer: 'CP Kelco',
        qcParameters: [
          { name: 'Bentuk', specification: 'Serbuk Halus (200 Mesh)' },
          { name: 'Warna', specification: 'Krem Muda / Off-White' },
          { name: 'Bau', specification: 'Tidak Berbau' },
          { name: 'pH', specification: '6.0 - 8.0 (Larutan 1%)' },
          { name: 'Viskositas (1% KCl)', specification: '1,200 - 1,600 cPs' },
          { name: 'Susut Pengeringan', specification: '≤ 12.0%' }
        ],
        lastModifiedBy: 'Staff RnD - Budi, S.Si',
        lastModifiedAt: '2026-09-03 10:30 WIB'
      },
      {
        id: 'rm-110',
        code: 'B0110',
        specNumber: 'SP-BB-B0110',
        name: 'Euxyl PE 9010 (Phenoxyethanol & Ethylhexylglycerin)',
        chemicalName: '2-Phenoxyethanol & 3-(2-ethylhexyloxy)propane-1,2-diol',
        category: 'preservative',
        categories: ['preservative'],
        storageConditions: 'Suhu ruang (15-25°C), tertutup rapat',
        sdsDocNumber: 'SDS-RND-BB-0110',
        approvedSubstitutes: [],
        manufacturer: 'Schülke & Mayr GmbH',
        qcParameters: [
          { name: 'Bentuk', specification: 'Cairan Jernih' },
          { name: 'Warna', specification: 'Jernih Tidak Berwarna / Keemasan Lemah' },
          { name: 'Bau', specification: 'Khas Lemah' },
          { name: 'pH', specification: '5.0 - 8.0' },
          { name: 'Densitas (20°C)', specification: '1.088 - 1.098 g/cm³' },
          { name: 'Kadar Phenoxyethanol', specification: '89.0 - 91.0%' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 10:45 WIB'
      }
    ];

    setRawMaterials(newOfficialRM);
    localStorage.setItem('lsm_raw_materials_b', JSON.stringify(newOfficialRM));
    materialService.saveMaterials(newOfficialRM);

    // 2. Packaging Materials (10 items inputted by staff RnD)
    const newOfficialPM: PackagingMaterial[] = [
      {
        id: 'pm-101',
        code: 'K0101',
        specNumber: 'SP-BK-K0101',
        name: 'Dropper Amber Glass Bottle 30ml with Pipette',
        type: 'primary',
        unit: 'Botol',
        unitCapacityGrams: 30,
        supplier: 'PT. Prima Kemas Lestari',
        storageLocation: 'Rak A-01-A',
        storageConditions: 'Suhu ruang (15-25°C), Kering, Bebas debu',
        qcParameters: [
          { name: 'Bahan Botol', specification: 'Kaca Amber Kelas I' },
          { name: 'Bahan Pipette', specification: 'Kaca Borosilikat + Nitrile Rubber' },
          { name: 'Kapasitas Penuh', specification: '33.0 ± 1.0 ml' },
          { name: 'Uji Kebocoran', specification: 'Tidak Bocor (Tekanan -0.04 MPa / 10 menit)' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 08:30 WIB'
      },
      {
        id: 'pm-102',
        code: 'K0102',
        specNumber: 'SP-BK-K0102',
        name: 'Airless Pump Bottle Matte Black 50ml',
        type: 'primary',
        unit: 'Botol',
        unitCapacityGrams: 50,
        supplier: 'PT. Kemas Unggul Abadi',
        storageLocation: 'Rak A-02-B',
        storageConditions: 'Suhu ruang (15-25°C), Kering',
        qcParameters: [
          { name: 'Bahan Body', specification: 'AS (Acrylonitrile Styrene)' },
          { name: 'Bahan Head Pump', specification: 'PP + Aluminium Cap Matte Black' },
          { name: 'Dosis Pump Per-Pencet', specification: '0.20 ± 0.02 ml' },
          { name: 'Uji Fungsi Pump', specification: '100% Mengalir Lancar Tanpa Tersumbat' }
        ],
        lastModifiedBy: 'Staff RnD - Budi, S.Si',
        lastModifiedAt: '2026-09-03 08:45 WIB'
      },
      {
        id: 'pm-103',
        code: 'K0103',
        specNumber: 'SP-BK-K0103',
        name: 'Acrylic Cream Jar Frosted White 30g + Inner Lid',
        type: 'primary',
        unit: 'Pot / Jar',
        unitCapacityGrams: 30,
        supplier: 'PT. Prima Kemas Lestari',
        storageLocation: 'Rak A-03-A',
        storageConditions: 'Suhu ruang (15-25°C), Bersih & Bebas Kontaminasi',
        qcParameters: [
          { name: 'Bahan Outer Jar', specification: 'PMMA Acrylic Frosted' },
          { name: 'Bahan Inner Pot & Lid', specification: 'PP White Food Grade' },
          { name: 'Kapasitas Isian', specification: '30.0 ± 1.0 gram' },
          { name: 'Uji Presisi Ulir Cap', specification: 'Dapat Ditutup Rapat 360 Derajat' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 09:00 WIB'
      },
      {
        id: 'pm-104',
        code: 'K0104',
        specNumber: 'SP-BK-K0104',
        name: 'Soft Cosmetic Squeeze Tube White 100ml Flip Cap',
        type: 'primary',
        unit: 'Tube',
        unitCapacityGrams: 100,
        supplier: 'PT. Kemas Unggul Abadi',
        storageLocation: 'Rak A-04-C',
        storageConditions: 'Suhu ruang (15-25°C), Bebas Sinar UV',
        qcParameters: [
          { name: 'Bahan Body Tube', specification: 'PE 5-Layer Co-Extruded' },
          { name: 'Bahan Flip Cap', specification: 'PP White Glossy' },
          { name: 'Diameter Tube', specification: '35 mm' },
          { name: 'Uji Tekanan Tube', specification: 'Tahan Tekanan Beban 15 kg/1 menit' }
        ],
        lastModifiedBy: 'Staff RnD - Budi, S.Si',
        lastModifiedAt: '2026-09-03 09:15 WIB'
      },
      {
        id: 'pm-105',
        code: 'K0105',
        specNumber: 'SP-BK-K0105',
        name: 'Foaming Pump Bottle Translucent 150ml',
        type: 'primary',
        unit: 'Botol',
        unitCapacityGrams: 150,
        supplier: 'PT. Plastik Indah Utama',
        storageLocation: 'Rak A-05-A',
        storageConditions: 'Suhu ruang (15-25°C)',
        qcParameters: [
          { name: 'Bahan Botol', specification: 'PET Translucent Clear' },
          { name: 'Bahan Foamer Head', specification: 'PP + Mesh Net Stainless Steel' },
          { name: 'Kualitas Busa (Foam)', specification: 'Busa Halus, Padat & Stabil' },
          { name: 'Uji Kebocoran Botol', specification: 'Tidak Bocor Saat Diubah Posisi 180°' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 09:30 WIB'
      },
      {
        id: 'pm-106',
        code: 'K0106',
        specNumber: 'SP-BK-K0106',
        name: 'Unit Folding Inner Box Doff Metallic 30ml',
        type: 'secondary',
        unit: 'Box / Dus',
        unitCapacityGrams: 0,
        supplier: 'PT. Cetak Box Mulia',
        storageLocation: 'Rak B-01-A',
        storageConditions: 'Tempat Kering, RH ≤ 60%, Bebas Lembap',
        qcParameters: [
          { name: 'Bahan Karton', specification: 'Ivory Paper 350 gsm' },
          { name: 'Finishing', specification: 'Doff Lamination + Gold Foil Stamping' },
          { name: 'Dimensi Box (LxWxH)', specification: '38 x 38 x 115 mm' },
          { name: 'Uji Keterbacaan Cetak', specification: 'Teks Tajam, Barcode Terbaca Scanner 100%' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 09:45 WIB'
      },
      {
        id: 'pm-107',
        code: 'K0107',
        specNumber: 'SP-BK-K0107',
        name: 'Unit Folding Inner Box Glossy Emboss 50ml',
        type: 'secondary',
        unit: 'Box / Dus',
        unitCapacityGrams: 0,
        supplier: 'PT. Cetak Box Mulia',
        storageLocation: 'Rak B-02-B',
        storageConditions: 'Tempat Kering & Bebas Kelembapan',
        qcParameters: [
          { name: 'Bahan Karton', specification: 'Art Paper 350 gsm Premium' },
          { name: 'Finishing', specification: 'Glossy Lamination + Deboss Logo' },
          { name: 'Dimensi Box (LxWxH)', specification: '45 x 45 x 135 mm' },
          { name: 'Daya Rekat Lem', specification: 'Lem Samping Kuat (Tidak Mudah Terlepas)' }
        ],
        lastModifiedBy: 'Staff RnD - Budi, S.Si',
        lastModifiedAt: '2026-09-03 10:00 WIB'
      },
      {
        id: 'pm-108',
        code: 'K0108',
        specNumber: 'SP-BK-K0108',
        name: 'Biodegradable Paper Wrap Sleeve Label',
        type: 'secondary',
        unit: 'Pcs',
        unitCapacityGrams: 0,
        supplier: 'PT. Eco Packaging Solutions',
        storageLocation: 'Rak B-03-A',
        storageConditions: 'Suhu ruang, Bebas lembap & Panas',
        qcParameters: [
          { name: 'Bahan Kertas', specification: 'Kraft Recycled Paper 120 gsm' },
          { name: 'Tinta Cetak', specification: 'Soy-Based Eco-Friendly Ink' },
          { name: 'Uji Luncuran / Lipatan', specification: 'Mudah Dilipat Tanpa Sobek' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 10:15 WIB'
      },
      {
        id: 'pm-109',
        code: 'K0109',
        specNumber: 'SP-BK-K0109',
        name: 'Master Outer Carton Box Corrugated 5-Ply (Kapasitas 36 units)',
        type: 'tertiary',
        unit: 'Karton',
        unitCapacityGrams: 0,
        supplier: 'PT. Karton Indonesia',
        storageLocation: 'Area Palet T-01',
        storageConditions: 'Suhu Ruang, Ditumpuk Maksimal 6 Karton',
        qcParameters: [
          { name: 'Bahan Corrugated', specification: 'Double Wall (Flute B/C) K200/M125/K200' },
          { name: 'Bursting Strength', specification: '≥ 12.5 kgf/cm²' },
          { name: 'Dimensi Luar (LxWxH)', specification: '390 x 270 x 250 mm' },
          { name: 'Uji Beban Tumpukan', specification: 'Tahan Beban Tumpuk Minimal 120 kg' }
        ],
        lastModifiedBy: 'Staff RnD - Budi, S.Si',
        lastModifiedAt: '2026-09-03 10:30 WIB'
      },
      {
        id: 'pm-110',
        code: 'K0110',
        specNumber: 'SP-BK-K0110',
        name: 'Heavy Duty Shipper Box Corrugated (Kapasitas 72 units)',
        type: 'tertiary',
        unit: 'Karton',
        unitCapacityGrams: 0,
        supplier: 'PT. Karton Indonesia',
        storageLocation: 'Area Palet T-02',
        storageConditions: 'Suhu Ruang, Ditumpuk Maksimal 5 Karton',
        qcParameters: [
          { name: 'Bahan Corrugated', specification: 'Double Wall Heavy Duty Flute B/C K275/M150/K275' },
          { name: 'Bursting Strength', specification: '≥ 16.0 kgf/cm²' },
          { name: 'Dimensi Luar (LxWxH)', specification: '520 x 390 x 280 mm' },
          { name: 'Uji Jatuh (Drop Test)', specification: 'Lolos Drop Test dari Ketinggian 1.2 Meter' }
        ],
        lastModifiedBy: 'Staff RnD - Sarah, S.Farm',
        lastModifiedAt: '2026-09-03 10:45 WIB'
      }
    ];

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

