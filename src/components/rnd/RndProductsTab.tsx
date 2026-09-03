import React, { useState } from 'react';
import { Product, ProductVariant, BulkFormulation, PackagingMaterial } from '../../types';
import { useAuth } from '../../core/auth/AuthContext';
import { canWriteModule } from '../../core/auth/permissionGuard';
import { authService } from '../../core/auth/authService';
import {
  PackageCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  Layers,
  Sparkles,
  Barcode,
  ShieldCheck,
  FlaskConical,
  Boxes,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface RndProductsTabProps {
  products: Product[];
  formulations: BulkFormulation[];
  packagingMaterials: PackagingMaterial[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onSaveVariant: (productId: string, variant: ProductVariant) => void;
  onDeleteVariant: (productId: string, variantId: string) => void;
}

export const RndProductsTab: React.FC<RndProductsTabProps> = ({
  products,
  formulations,
  packagingMaterials,
  onSaveProduct,
  onDeleteProduct,
  onSaveVariant,
  onDeleteVariant,
}) => {
  const { user } = useAuth();
  const canWrite = canWriteModule(user, 'rnd');

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>(
    products.map((p) => p.id) // Default expand all to see variants easily
  );

  // Modal State for Product (PJ0001)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodCode, setProdCode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Skincare - Facial Treatment');
  const [prodBrand, setProdBrand] = useState('Larassanti');
  const [prodDesc, setProdDesc] = useState('');

  // Modal State for Variant (PJ0001-V1)
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [varCode, setVarCode] = useState('');
  const [varName, setVarName] = useState('');
  const [varNetVolume, setVarNetVolume] = useState(20);
  const [varFormulaCode, setVarFormulaCode] = useState('');
  const [varBpom, setVarBpom] = useState('');
  const [varBarcode, setVarBarcode] = useState('');
  const [varDesc, setVarDesc] = useState('');
  const [varPrimaryPack, setVarPrimaryPack] = useState('');
  const [varSecondaryPack, setVarSecondaryPack] = useState('');
  const [varTertiaryPack, setVarTertiaryPack] = useState('');

  // Delete Confirmation State with Active User Password
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'product';
    id: string;
    name: string;
    code: string;
  } | {
    type: 'variant';
    prodId: string;
    id: string;
    name: string;
    code: string;
  } | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [isVerifyingDeletePassword, setIsVerifyingDeletePassword] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (!deletePassword.trim()) {
      setDeletePasswordError('Kata sandi otorisasi pengguna aktif wajib diisi.');
      return;
    }

    setIsVerifyingDeletePassword(true);
    setDeletePasswordError(null);

    try {
      const actorNik = user?.nik || 'admin';
      const check = await authService.verifyPassword(actorNik, deletePassword);
      if (!check.valid) {
        setDeletePasswordError(check.error || 'Kata sandi tidak valid. Silakan periksa kembali.');
        setIsVerifyingDeletePassword(false);
        return;
      }

      if (itemToDelete.type === 'product') {
        onDeleteProduct(itemToDelete.id);
        setSuccessToast(`Produk Jadi "${itemToDelete.code} - ${itemToDelete.name}" berhasil dihapus.`);
      } else {
        onDeleteVariant(itemToDelete.prodId, itemToDelete.id);
        setSuccessToast(`Varian "${itemToDelete.code} - ${itemToDelete.name}" berhasil dihapus.`);
      }

      // Record Audit Trail Log
      try {
        const rawAudit = localStorage.getItem('cosmo_ddmp_audit_logs');
        const auditList = rawAudit ? JSON.parse(rawAudit) : [];
        const newAuditLog = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorNik: actorNik,
          actorName: user?.name || user?.username || 'ADMIN',
          module: 'rnd',
          action: itemToDelete.type === 'product' ? 'PRODUCT_DELETE' : 'VARIANT_DELETE',
          targetNik: itemToDelete.code,
          details: `Penghapusan ${itemToDelete.type === 'product' ? 'Master Produk Jadi' : 'Varian Produk'} ${itemToDelete.code} (${itemToDelete.name}) dengan otorisasi kata sandi pengguna aktif.`,
        };
        localStorage.setItem('cosmo_ddmp_audit_logs', JSON.stringify([newAuditLog, ...auditList]));
      } catch (auditErr) {
        console.warn('Audit trail write failed:', auditErr);
      }

      setIsVerifyingDeletePassword(false);
      setItemToDelete(null);
      setDeletePassword('');
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setDeletePasswordError(err.message || 'Terjadi kesalahan saat memverifikasi sandi.');
      setIsVerifyingDeletePassword(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedProductIds.includes(id)) {
      setExpandedProductIds(expandedProductIds.filter((pId) => pId !== id));
    } else {
      setExpandedProductIds([...expandedProductIds, id]);
    }
  };

  const getNextProductCode = () => {
    return `PJ${String(products.length + 1).padStart(4, '0')}`;
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdCode(getNextProductCode());
    setProdName('');
    setProdCategory('Skincare - Facial Treatment');
    setProdBrand('Larassanti Medika Skin');
    setProdDesc('');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdCode(prod.code);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdBrand(prod.brand);
    setProdDesc(prod.description);
    setShowProductModal(true);
  };

  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrUpdated: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      code: prodCode.trim().toUpperCase(),
      name: prodName.trim(),
      category: prodCategory.trim(),
      brand: prodBrand.trim(),
      description: prodDesc.trim(),
      variants: editingProduct ? editingProduct.variants : [],
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    onSaveProduct(newOrUpdated);
    setShowProductModal(false);
  };

  const handleOpenAddVariant = (prod: Product) => {
    setTargetProductId(prod.id);
    setEditingVariant(null);
    const nextIndex = prod.variants.length + 1;
    setVarCode(`${prod.code}-V${nextIndex}`);
    setVarName('');
    setVarNetVolume(20);
    setVarFormulaCode(formulations.length > 0 ? formulations[0].code : '');
    setVarBpom(`NA1826010${String(Math.floor(Math.random() * 9000 + 1000))}`);
    setVarBarcode(`899${String(Math.floor(Math.random() * 900000000 + 100000000))}`);
    setVarDesc('');
    
    // Default packaging
    const primaryP = packagingMaterials.find(p => p.type === 'primary');
    const secondaryP = packagingMaterials.find(p => p.type === 'secondary');
    const tertiaryP = packagingMaterials.find(p => p.type === 'tertiary');
    setVarPrimaryPack(primaryP ? primaryP.code : '');
    setVarSecondaryPack(secondaryP ? secondaryP.code : '');
    setVarTertiaryPack(tertiaryP ? tertiaryP.code : '');
    
    setShowVariantModal(true);
  };

  const handleOpenEditVariant = (prodId: string, variant: ProductVariant) => {
    setTargetProductId(prodId);
    setEditingVariant(variant);
    setVarCode(variant.variantCode);
    setVarName(variant.variantName);
    setVarNetVolume(variant.netVolumeGrams);
    setVarFormulaCode(variant.bulkFormulaCode);
    setVarBpom(variant.bpomNumber || '');
    setVarBarcode(variant.barcode || '');
    setVarDesc(variant.description || '');

    const primary = variant.packagingBom.find(b => b.type === 'primary');
    const secondary = variant.packagingBom.find(b => b.type === 'secondary');
    const tertiary = variant.packagingBom.find(b => b.type === 'tertiary');

    setVarPrimaryPack(primary ? primary.packagingCode : '');
    setVarSecondaryPack(secondary ? secondary.packagingCode : '');
    setVarTertiaryPack(tertiary ? tertiary.packagingCode : '');

    setShowVariantModal(true);
  };

  const handleSaveVariantForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductId) return;

    const packagingBom: ProductVariant['packagingBom'] = [];
    if (varPrimaryPack) {
      packagingBom.push({ packagingCode: varPrimaryPack, quantityPerUnit: 1, type: 'primary' });
    }
    if (varSecondaryPack) {
      packagingBom.push({ packagingCode: varSecondaryPack, quantityPerUnit: 1, type: 'secondary' });
    }
    if (varTertiaryPack) {
      packagingBom.push({ packagingCode: varTertiaryPack, quantityPerUnit: 0.0416, type: 'tertiary' });
    }

    const variantData: ProductVariant = {
      id: editingVariant ? editingVariant.id : `var-${Date.now()}`,
      productId: targetProductId,
      variantCode: varCode.trim().toUpperCase(),
      variantName: varName.trim(),
      netVolumeGrams: Number(varNetVolume),
      bulkFormulaCode: varFormulaCode,
      packagingBom,
      bpomNumber: varBpom.trim(),
      barcode: varBarcode.trim(),
      description: varDesc.trim(),
      createdAt: editingVariant?.createdAt || new Date().toISOString(),
    };

    onSaveVariant(targetProductId, variantData);
    setShowVariantModal(false);
  };

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchParent =
      p.code.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query);

    const matchVariant = p.variants.some(
      (v) =>
        v.variantCode.toLowerCase().includes(query) ||
        v.variantName.toLowerCase().includes(query) ||
        (v.bpomNumber && v.bpomNumber.toLowerCase().includes(query)) ||
        (v.barcode && v.barcode.toLowerCase().includes(query))
    );

    return matchParent || matchVariant;
  });

  const totalVariantsCount = products.reduce((sum, p) => sum + p.variants.length, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notifikasi Sukses */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* READ-ONLY BANNER IF USER IS RESTRICTED */}
      {!canWrite && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-800">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Mode Akses Terbatas (Read-Only):</span> Anda memiliki hak akses baca khusus R&D. Tindakan penambahan, pengubahan, dan penghapusan produk jadi & varian dinonaktifkan demi integritas CPKB.
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900 uppercase">
            Hanya Lihat
          </span>
        </div>
      )}

      {/* Top Action & Metrics Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode PJ0001, nama produk, varian, BPOM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-xs"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-mono font-bold border border-purple-100">
              {products.length} Produk (PJ)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
              {totalVariantsCount} Total Varian
            </span>
          </div>
        </div>

        {canWrite && (
          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Jadi (PJ)</span>
          </button>
        )}
      </div>

      {/* Info Callout for 1 Product Code -> Multi Variants */}
      <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 flex items-start gap-3 text-slate-700">
        <Boxes className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold text-purple-900 block mb-0.5">
            Struktur Hirarki Produk & Multi-Variant Pabrik:
          </span>
          Satu Kode Produk Jadi (<span className="font-mono font-bold text-purple-800">PJ0001, PJ0002</span>) memayungi beberapa varian ukuran/kemasan (<span className="font-mono font-bold text-purple-800">PJ0001-V1, PJ0001-V2</span>). Setiap varian terikat pada Formula Bulk dan Bill of Materials (BOM) Kemasannya masing-masing.
        </div>
      </div>

      {/* Products List & Variants */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <PackageCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada produk jadi ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Tambah Produk Jadi" untuk membuat master produk baru.</p>
          </div>
        ) : (
          filteredProducts.map((prod, pIdx) => {
            const isExpanded = expandedProductIds.includes(prod.id);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Product Parent Header */}
                <div className="p-4 sm:p-5 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Nomor Urut */}
                    <div className="w-7 h-10 flex items-center justify-center font-mono font-bold text-xs text-slate-400">
                      #{pIdx + 1}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-100/70 border border-purple-200 flex items-center justify-center text-purple-700 font-mono font-bold text-xs shrink-0">
                      {prod.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900">{prod.name}</h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {prod.brand}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {prod.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
                        {prod.description || 'Tidak ada deskripsi produk.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {canWrite && (
                      <>
                        <button
                          onClick={() => handleOpenAddVariant(prod)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Varian</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete({
                              type: 'product',
                              id: prod.id,
                              name: prod.name,
                              code: prod.code,
                            });
                            setDeletePassword('');
                            setDeletePasswordError(null);
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 transition-colors cursor-pointer"
                          title="Hapus Produk (Konfirmasi Sandi)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => toggleExpand(prod.id)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title={isExpanded ? 'Sembunyikan Varian' : 'Tampilkan Varian'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Variants List Section */}
                {isExpanded && (
                  <div className="p-4 sm:p-5">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        Daftar Varian Produk ({prod.variants.length} Varian Terdaftar)
                      </span>
                    </div>

                    {prod.variants.length === 0 ? (
                      <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                        Belum ada varian untuk produk {prod.code}. Klik "Tambah Varian" untuk menambahkan varian botol/kemasan.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {prod.variants.map((variant, vIdx) => {
                          const linkedFormula = formulations.find((f) => f.code === variant.bulkFormulaCode);

                          return (
                            <div
                              key={variant.id}
                              className="border border-slate-200 rounded-xl p-3.5 bg-white hover:border-purple-300 hover:shadow-xs transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold text-slate-400">
                                      #{vIdx + 1}
                                    </span>
                                    <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                      {variant.variantCode}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-mono shrink-0">
                                    {variant.netVolumeGrams}g / ml
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 mt-1 mb-2">
                                  {variant.variantName}
                                </h4>

                                <div className="space-y-1.5 my-3 text-[11px] text-slate-600 border-t border-b border-slate-100 py-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <FlaskConical className="w-3 h-3 text-purple-500" /> Master Bulk:
                                    </span>
                                    <span className="font-mono font-semibold text-purple-700">
                                      {variant.bulkFormulaCode} ({linkedFormula ? linkedFormula.name.slice(0, 16) + '...' : 'Bulk'})
                                    </span>
                                  </div>

                                  {variant.bpomNumber && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> BPOM:
                                      </span>
                                      <span className="font-mono font-semibold text-emerald-700">
                                        {variant.bpomNumber}
                                      </span>
                                    </div>
                                  )}

                                  {variant.barcode && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400 flex items-center gap-1">
                                        <Barcode className="w-3 h-3 text-slate-500" /> Barcode:
                                      </span>
                                      <span className="font-mono text-[10px] text-slate-700">
                                        {variant.barcode}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Packaging BOM Chips */}
                                <div className="mb-3">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    BOM Kemasan:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {variant.packagingBom.length > 0 ? (
                                      variant.packagingBom.map((item, idx) => (
                                        <span
                                          key={idx}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                                            item.type === 'primary'
                                              ? 'bg-purple-50 border-purple-200 text-purple-700'
                                              : item.type === 'secondary'
                                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                          }`}
                                        >
                                          {item.packagingCode} ({item.quantityPerUnit < 1 ? `${Math.round(1/item.quantityPerUnit)}/box` : `${item.quantityPerUnit}x`})
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 text-[10px] italic">BOM kemas belum diatur</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {canWrite && (
                                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                                  <button
                                    onClick={() => handleOpenEditVariant(prod.id, variant)}
                                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setItemToDelete({
                                        type: 'variant',
                                        prodId: prod.id,
                                        id: variant.id,
                                        name: variant.variantName,
                                        code: variant.variantCode,
                                      });
                                      setDeletePassword('');
                                      setDeletePasswordError(null);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                    title="Hapus Varian (Konfirmasi Sandi)"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Tambah/Edit Produk Jadi (PJ0001) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-slate-800 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-purple-600" />
                <span>{editingProduct ? 'Edit Master Produk Jadi' : 'Tambah Master Produk Jadi (PJ)'}</span>
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductForm} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Kode Produk (PJ)
                  </label>
                  <input
                    type="text"
                    required
                    value={prodCode}
                    onChange={(e) => setProdCode(e.target.value)}
                    placeholder="PJ0001"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-purple-700 focus:bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Brand / Seri Produk
                  </label>
                  <input
                    type="text"
                    required
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    placeholder="Contoh: Larassanti Gold Series"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Nama Master Produk
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Contoh: Brightening Glow Serum"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Kategori Kosmetik
                </label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600"
                >
                  <option value="Skincare - Facial Treatment">Skincare - Facial Treatment (Serum, Toner, Essence)</option>
                  <option value="Skincare - Moisturizer & Cream">Skincare - Moisturizer & Cream</option>
                  <option value="Skincare - Cleanser & Wash">Skincare - Cleanser & Facial Wash</option>
                  <option value="Bodycare - Lotion & Scrub">Bodycare - Body Lotion & Scrub</option>
                  <option value="Haircare - Shampoo & Conditioner">Haircare - Shampoo & Tonic</option>
                  <option value="Decorative / Makeup">Decorative / Makeup</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Deskripsi & Klaim Produk
                </label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Deskripsi formula, kegunaan, dan klaim dermatologis..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-sm transition-colors cursor-pointer"
                >
                  Simpan Produk Jadi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah/Edit Varian Produk */}
      {showVariantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>{editingVariant ? 'Edit Varian Produk' : 'Tambah Varian Produk Baru'}</span>
              </h3>
              <button
                onClick={() => setShowVariantModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVariantForm} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Kode Varian
                  </label>
                  <input
                    type="text"
                    required
                    value={varCode}
                    onChange={(e) => setVarCode(e.target.value)}
                    placeholder="PJ0001-V1"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-purple-700 focus:bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Net Volume / Berat Bersih
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      value={varNetVolume}
                      onChange={(e) => setVarNetVolume(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600 pr-12 font-mono"
                    />
                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">g / ml</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Nama Varian / Deskripsi Kemasan
                </label>
                <input
                  type="text"
                  required
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="Contoh: Botol Pipet Dropper 20ml"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Master Formulasi Bulk Terkait
                </label>
                <select
                  value={varFormulaCode}
                  onChange={(e) => setVarFormulaCode(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600 font-mono"
                >
                  {formulations.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.code} - {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Nomor Izin Edar BPOM
                  </label>
                  <input
                    type="text"
                    value={varBpom}
                    onChange={(e) => setVarBpom(e.target.value)}
                    placeholder="Contoh: NA18260100412"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Barcode EAN-13
                  </label>
                  <input
                    type="text"
                    value={varBarcode}
                    onChange={(e) => setVarBarcode(e.target.value)}
                    placeholder="Contoh: 8991234567011"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Packaging BOM Selection */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                  Alokasi Bill of Materials (BOM) Bahan Kemas:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                      Kemas Primer (Wadah)
                    </label>
                    <select
                      value={varPrimaryPack}
                      onChange={(e) => setVarPrimaryPack(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 p-1.5 text-xs text-slate-800 font-mono"
                    >
                      <option value="">-- Pilih K000x --</option>
                      {packagingMaterials.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} ({p.name.slice(0, 16)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                      Kemas Sekunder (Box)
                    </label>
                    <select
                      value={varSecondaryPack}
                      onChange={(e) => setVarSecondaryPack(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 p-1.5 text-xs text-slate-800 font-mono"
                    >
                      <option value="">-- Pilih K000x --</option>
                      {packagingMaterials.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} ({p.name.slice(0, 16)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                      Kemas Tersier (Master Box)
                    </label>
                    <select
                      value={varTertiaryPack}
                      onChange={(e) => setVarTertiaryPack(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 p-1.5 text-xs text-slate-800 font-mono"
                    >
                      <option value="">-- Pilih K000x --</option>
                      {packagingMaterials.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} ({p.name.slice(0, 16)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVariantModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-sm transition-colors cursor-pointer"
                >
                  Simpan Varian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: KONFIRMASI DELETE DENGAN PASSWORD USER AKTIF      */}
      {/* ======================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isVerifyingDeletePassword && setItemToDelete(null)}
          ></div>

          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            {/* Close */}
            <button
              type="button"
              disabled={isVerifyingDeletePassword}
              onClick={() => setItemToDelete(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Konfirmasi Hapus {itemToDelete.type === 'product' ? 'Produk Jadi' : 'Varian Produk'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Otorisasi Keamanan CPKB & Jejak Audit
                </p>
              </div>
            </div>

            {/* Detail Item Info */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl mb-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Kode:</span>
                <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-xs">
                  {itemToDelete.code}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Nama:</span>
                <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">
                  {itemToDelete.name}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">
              Tindakan ini permanen. Masukkan kata sandi akun pengguna aktif Anda (<span className="font-bold text-purple-800">{user?.name || user?.username || 'ADMIN'} - {user?.nik}</span>) untuk mengonfirmasi penghapusan.
            </p>

            {/* Password input */}
            <div className="space-y-2 mb-4">
              <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide">
                Kata Sandi Pengguna Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showDeletePassword ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmDelete();
                    }
                  }}
                  autoFocus
                  placeholder="Masukkan kata sandi akun Anda..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-rose-600 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {deletePasswordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deletePasswordError}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isVerifyingDeletePassword}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isVerifyingDeletePassword || !deletePassword.trim()}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                {isVerifyingDeletePassword ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Konfirmasi Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
