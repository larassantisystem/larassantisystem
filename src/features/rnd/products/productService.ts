import { supabase, isSupabaseConfigured } from '../../../core/auth/supabaseClient';
import { Product, ProductVariant } from '../../../types';

// Bersihkan data demo lama dari local storage jika masih tersisa di browser pengguna
const purgeLegacyLocalStorageProducts = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const legacyKeys = [
      'lsm_products_variants',
      'lsm_products',
      'cosmo_products',
      'rnd_demo_products',
      'demo_products_cache'
    ];
    legacyKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  }
};

// Jalankan pembersihan saat inisialisasi module
purgeLegacyLocalStorageProducts();

// Penyimpanan sesi in-memory (BUKAN local storage) jika tabel di Supabase belum diinisialisasi
const defaultSeedProducts: Product[] = [
  {
    id: 'prod-pj0001',
    code: 'PJ0001',
    productCode: 'PJ0001',
    name: 'Larassanti Brightening Glow Serum',
    category: 'Skincare - Facial Treatment',
    brand: 'PT. LARASSANTI MAKMUR SEJAHTERA',
    description: 'Serum pencerah wajah dengan Niacinamide 5% dan Alpha Arbutin.',
    unit: 'pcs (Pieces)',
    storageConditions: 'Suhu Ruang (15-25°C), Kering, Bebas Cahaya Langsung',
    bpomNotificationNumber: 'NA18241900123',
    bpomNotificationExt: '2028-10-15',
    expNotificationDate: '2028-10-15',
    qcParameters: [
      { id: '1', parameterName: 'Pemerian / Organoleptis', acceptanceCondition: 'Cairan kental agak opalesen, wangi floral' },
      { id: '2', parameterName: 'pH Sediaan (25°C)', acceptanceCondition: '5.5 - 6.2', unit: 'pH' }
    ],
    variants: [
      {
        id: 'var-pj0001-20g',
        productId: 'prod-pj0001',
        variantCode: 'PJ0001-20G',
        sku: 'PJ0001-20G',
        variantName: '20 g',
        netVolumeGrams: 20,
        bulkFormulaCode: 'FORM-001',
        packagingBom: [
          { packagingCode: 'K0001', quantityPerUnit: 1, type: 'primary' },
          { packagingCode: 'K0002', quantityPerUnit: 1, type: 'primary' },
          { packagingCode: 'K0003', quantityPerUnit: 1, type: 'secondary' },
        ],
        barcode: '8991234567890',
        description: 'Kemasan dropper bottle 20g dengan outer folding box.'
      }
    ]
  },
  {
    id: 'prod-pj0002',
    code: 'PJ0002',
    productCode: 'PJ0002',
    name: 'Hydrating Daily Barrier Sunscreen SPF 50',
    category: 'Sun Care - Lotion',
    brand: 'PT. LARASSANTI MAKMUR SEJAHTERA',
    description: 'Tabir surya bertekstur ringan dengan Ceramide & Hyaluronic Acid.',
    unit: 'pcs (Pieces)',
    storageConditions: 'Suhu Ruang (15-25°C), Kering, Terlindung Cahaya',
    bpomNotificationNumber: 'NA18231700456',
    bpomNotificationExt: '2026-11-20', // Kurang dari 6 bulan (jatuh tempo 20 Nov 2026)
    expNotificationDate: '2026-11-20',
    qcParameters: [
      { id: '1', parameterName: 'Organoleptis', acceptanceCondition: 'Lotion putih, lembut, tidak lengket' },
      { id: '2', parameterName: 'Viskositas', acceptanceCondition: '8000 - 12000', unit: 'cP' }
    ],
    variants: [
      {
        id: 'var-pj0002-30g',
        productId: 'prod-pj0002',
        variantCode: 'PJ0002-30G',
        sku: 'PJ0002-30G',
        variantName: '30 g',
        netVolumeGrams: 30,
        bulkFormulaCode: 'FORM-002',
        packagingBom: [
          { packagingCode: 'K0005', quantityPerUnit: 1, type: 'primary' },
          { packagingCode: 'K0007', quantityPerUnit: 1, type: 'secondary' }
        ],
        barcode: '8999876543210',
        description: 'Kemasan tube 30g flip-top.'
      }
    ]
  },
  {
    id: 'prod-pj0003',
    code: 'PJ0003',
    productCode: 'PJ0003',
    name: 'Gentle Cleansing Facial Wash Gel',
    category: 'Skincare - Facial Wash',
    brand: 'PT. LARASSANTI MAKMUR SEJAHTERA',
    description: 'Pembersih wajah busa lembut pH balanced tanpa SLS.',
    unit: 'pcs (Pieces)',
    storageConditions: 'Suhu Ruang (15-25°C)',
    bpomNotificationNumber: 'NA18211200789',
    bpomNotificationExt: '2026-07-31', // Sudah expired (lewat tanggal)
    expNotificationDate: '2026-07-31',
    qcParameters: [
      { id: '1', parameterName: 'Pemerian', acceptanceCondition: 'Gel jernih kehijauan' },
      { id: '2', parameterName: 'pH', acceptanceCondition: '5.0 - 6.0', unit: 'pH' }
    ],
    variants: [
      {
        id: 'var-pj0003-100ml',
        productId: 'prod-pj0003',
        variantCode: 'PJ0003-100ML',
        sku: 'PJ0003-100ML',
        variantName: '100 ml',
        netVolumeGrams: 100,
        bulkFormulaCode: 'FORM-003',
        packagingBom: [
          { packagingCode: 'K0006', quantityPerUnit: 1, type: 'primary' }
        ],
        barcode: '8994567890123',
        description: 'Botol pompa 100ml.'
      }
    ]
  }
];

let inMemoryProducts: Product[] = [...defaultSeedProducts];
let tablesInitializedInSupabase: boolean | null = null;

const isTableMissingError = (err: any): boolean => {
  if (!err) return false;
  const msg = (err.message || err.details || err.hint || String(err)).toLowerCase();
  const code = err.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist') ||
    msg.includes('not found')
  );
};

export const productService = {
  /**
   * Cek status ketersediaan tabel products & product_variants di Supabase
   */
  checkTableStatus: async (): Promise<{
    configured: boolean;
    ready: boolean;
    message: string;
  }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        configured: false,
        ready: false,
        message: 'Supabase URL atau Anon Key belum dikonfigurasi pada environment variable.',
      };
    }

    try {
      const { error } = await supabase.from('products').select('id').limit(1);
      if (error) {
        if (isTableMissingError(error)) {
          tablesInitializedInSupabase = false;
          return {
            configured: true,
            ready: false,
            message: "Tabel 'products' belum dibuat di Supabase schema cache. Jalankan skrip SQL supabase_schema_products.sql.",
          };
        }
        return {
          configured: true,
          ready: false,
          message: error.message || 'Koneksi Supabase error',
        };
      }
      tablesInitializedInSupabase = true;
      return {
        configured: true,
        ready: true,
        message: "Tabel 'products' & 'product_variants' aktif dan terhubung di Supabase.",
      };
    } catch (err: any) {
      return {
        configured: true,
        ready: false,
        message: err.message || 'Gagal memeriksa status tabel Supabase',
      };
    }
  },

  /**
   * Mengambil semua Master Produk beserta varian dari Supabase
   * Menggunakan relasi tabel 'products' dan 'product_variants'
   */
  getProducts: async (): Promise<Product[]> => {
    purgeLegacyLocalStorageProducts();

    if (!isSupabaseConfigured || !supabase) {
      console.warn('[productService] Supabase belum dikonfigurasi dengan URL & Anon Key. Menggunakan memori sesi.');
      return inMemoryProducts;
    }

    try {
      // Query relasi products ke product_variants
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          product_code,
          name,
          brand,
          exp_notification_date,
          created_at,
          category,
          description,
          unit,
          storage_conditions,
          bpom_notification_number,
          qc_parameters,
          variants:product_variants (
            id,
            product_id,
            variant_name,
            sku,
            status,
            net_volume_grams,
            bulk_formula_code,
            packaging_bom,
            bpom_number,
            barcode,
            description,
            created_at
          )
        `)
        .order('product_code', { ascending: true });

      if (error) {
        if (isTableMissingError(error)) {
          tablesInitializedInSupabase = false;
          console.warn('[productService] Notice: Tabel "products" belum dibuat di Supabase schema cache. Menampilkan data sesi aktif.');
          return inMemoryProducts;
        }
        console.warn('[productService] Peringatan saat memuat data products dari Supabase:', error.message || error);
        return inMemoryProducts;
      }

      tablesInitializedInSupabase = true;
      if (!data) return inMemoryProducts;

      const mapped = data.map((p: any) => ({
        id: p.id,
        code: p.product_code || p.code || '',
        productCode: p.product_code || p.code || '',
        name: p.name || '',
        brand: p.brand || '',
        category: p.category || '',
        description: p.description || '',
        unit: p.unit || 'pcs (Pieces)',
        storageConditions: p.storage_conditions || '',
        bpomNotificationNumber: p.bpom_notification_number || '',
        bpomNotificationExt: p.exp_notification_date || '',
        expNotificationDate: p.exp_notification_date || '',
        qcParameters: p.qc_parameters || [],
        createdAt: p.created_at,
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          productId: v.product_id || p.id,
          variantCode: v.sku || v.variant_code || '',
          sku: v.sku || v.variant_code || '',
          variantName: v.variant_name || '',
          status: v.status || 'active',
          netVolumeGrams: Number(v.net_volume_grams) || 0,
          bulkFormulaCode: v.bulk_formula_code || '',
          packagingBom: v.packaging_bom || [],
          bpomNumber: v.bpom_number || '',
          barcode: v.barcode || '',
          description: v.description || '',
          createdAt: v.created_at,
        })),
      }));

      inMemoryProducts = mapped;
      return mapped;
    } catch (err: any) {
      console.warn('[productService] Exception saat mengambil data products:', err?.message || err);
      return inMemoryProducts;
    }
  },

  /**
   * Menyimpan 1 Master Produk ke tabel 'products' di Supabase
   */
  saveSingleProduct: async (prod: Product): Promise<{ success: boolean; isInMemory?: boolean; error?: string }> => {
    purgeLegacyLocalStorageProducts();

    // Selalu update in-memory session (BUKAN local storage) agar responsif
    const existingIdx = inMemoryProducts.findIndex(p => p.id === prod.id);
    if (existingIdx >= 0) {
      inMemoryProducts[existingIdx] = prod;
    } else {
      inMemoryProducts = [prod, ...inMemoryProducts];
    }

    if (!isSupabaseConfigured || !supabase) {
      const msg = 'Supabase belum dikonfigurasi. Data tersimpan di memori sesi.';
      console.warn('[productService]', msg);
      return { success: true, isInMemory: true };
    }

    try {
      // 1. Simpan Master Produk ke tabel 'products'
      const productPayload = {
        id: prod.id,
        product_code: (prod.productCode || prod.code).trim().toUpperCase(),
        name: prod.name.trim(),
        brand: prod.brand.trim(),
        exp_notification_date: prod.expNotificationDate || prod.bpomNotificationExt || null,
        category: prod.category || '',
        description: prod.description || '',
        unit: prod.unit || 'pcs (Pieces)',
        storage_conditions: prod.storageConditions || '',
        bpom_notification_number: prod.bpomNotificationNumber || '',
        qc_parameters: prod.qcParameters || [],
        created_at: prod.createdAt || new Date().toISOString(),
      };

      const { error: prodError } = await supabase
        .from('products')
        .upsert(productPayload, { onConflict: 'id' });

      if (prodError) {
        if (isTableMissingError(prodError)) {
          tablesInitializedInSupabase = false;
          console.warn('[productService] Tabel public.products belum dibuat di Supabase schema cache. Data disimpan di memori sesi aktif.');
          return { success: true, isInMemory: true };
        }
        console.warn('[productService] Peringatan saat upsert produk ke Supabase:', prodError.message || prodError);
        return { success: false, error: prodError.message };
      }

      tablesInitializedInSupabase = true;

      // 2. Simpan varian-varian terkait ke tabel 'product_variants'
      if (prod.variants && prod.variants.length > 0) {
        for (const v of prod.variants) {
          const variantPayload = {
            id: v.id,
            product_id: prod.id,
            variant_name: v.variantName,
            sku: (v.sku || v.variantCode).trim().toUpperCase(),
            status: v.status || 'active',
            net_volume_grams: v.netVolumeGrams || 0,
            bulk_formula_code: v.bulkFormulaCode || '',
            packaging_bom: v.packagingBom || [],
            bpom_number: v.bpomNumber || '',
            barcode: v.barcode || '',
            description: v.description || '',
            created_at: v.createdAt || new Date().toISOString(),
          };

          const { error: varError } = await supabase
            .from('product_variants')
            .upsert(variantPayload, { onConflict: 'id' });

          if (varError) {
            if (isTableMissingError(varError)) {
              console.warn('[productService] Tabel product_variants belum dibuat di Supabase. Varian disimpan di memori sesi.');
            } else {
              console.warn('[productService] Peringatan saat upsert varian ke Supabase:', varError.message || varError);
            }
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      if (isTableMissingError(err)) {
        return { success: true, isInMemory: true };
      }
      console.warn('[productService] Exception saat menyimpan produk ke Supabase:', err?.message || err);
      return { success: true, isInMemory: true };
    }
  },

  /**
   * Menyimpan varian tunggal ke tabel 'product_variants' di Supabase
   */
  saveSingleVariant: async (productId: string, variant: ProductVariant): Promise<{ success: boolean; isInMemory?: boolean; error?: string }> => {
    purgeLegacyLocalStorageProducts();

    // Update in-memory
    inMemoryProducts = inMemoryProducts.map(p => {
      if (p.id !== productId) return p;
      const vExists = p.variants.some(v => v.id === variant.id);
      const updatedVariants = vExists
        ? p.variants.map(v => (v.id === variant.id ? variant : v))
        : [...p.variants, variant];
      return { ...p, variants: updatedVariants };
    });

    if (!isSupabaseConfigured || !supabase) {
      return { success: true, isInMemory: true };
    }

    try {
      const variantPayload = {
        id: variant.id,
        product_id: productId,
        variant_name: variant.variantName,
        sku: (variant.sku || variant.variantCode).trim().toUpperCase(),
        status: variant.status || 'active',
        net_volume_grams: variant.netVolumeGrams || 0,
        bulk_formula_code: variant.bulkFormulaCode || '',
        packaging_bom: variant.packagingBom || [],
        bpom_number: variant.bpomNumber || '',
        barcode: variant.barcode || '',
        description: variant.description || '',
        created_at: variant.createdAt || new Date().toISOString(),
      };

      const { error } = await supabase
        .from('product_variants')
        .upsert(variantPayload, { onConflict: 'id' });

      if (error) {
        if (isTableMissingError(error)) {
          console.warn('[productService] Tabel product_variants belum ada di Supabase. Disimpan di sesi memori.');
          return { success: true, isInMemory: true };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      if (isTableMissingError(err)) {
        return { success: true, isInMemory: true };
      }
      return { success: true, isInMemory: true };
    }
  },

  /**
   * Menghapus produk dari tabel 'products' di Supabase (CASCADE menghapus varian terkait)
   */
  deleteProduct: async (productId: string): Promise<{ success: boolean; error?: string }> => {
    inMemoryProducts = inMemoryProducts.filter(p => p.id !== productId);

    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        if (isTableMissingError(error)) {
          return { success: true };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: true };
    }
  },

  /**
   * Menghapus varian dari tabel 'product_variants' di Supabase
   */
  deleteVariant: async (variantId: string): Promise<{ success: boolean; error?: string }> => {
    inMemoryProducts = inMemoryProducts.map(p => ({
      ...p,
      variants: p.variants.filter(v => v.id !== variantId)
    }));

    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) {
        if (isTableMissingError(error)) {
          return { success: true };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: true };
    }
  },

  /**
   * Menyimpan sekumpulan produk (batch) ke Supabase
   */
  saveProducts: async (products: Product[]): Promise<void> => {
    for (const prod of products) {
      await productService.saveSingleProduct(prod);
    }
  },
};

