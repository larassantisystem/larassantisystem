import { supabase, isSupabaseConfigured } from '../../../core/auth/supabaseClient';
import { Product, ProductVariant } from '../../../types';

const PRODUCTS_STORAGE_KEY = 'lsm_products_variants';

export const productService = {
  getProducts: async (): Promise<Product[]> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, variants:product_variants(*)');

        if (!error && data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            category: p.category,
            brand: p.brand || 'Larassanti',
            description: p.description || '',
            createdAt: p.created_at,
            variants: (p.variants || []).map((v: any) => ({
              id: v.id,
              productId: v.product_id || p.id,
              variantCode: v.variant_code,
              variantName: v.variant_name,
              netVolumeGrams: v.net_volume_grams,
              bulkFormulaCode: v.bulk_formula_code,
              packagingBom: v.packaging_bom || [],
              bpomNumber: v.bpom_number,
              barcode: v.barcode,
              description: v.description,
            })),
          }));
        }
      } catch (err) {
        console.warn('Supabase products fetch failed, using local store', err);
      }
    }

    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing local products', e);
      }
    }

    // Default factory seed products (PJ0001, PJ0002)
    const defaultProducts: Product[] = [
      {
        id: 'prod-pj0001',
        code: 'PJ0001',
        name: 'Brightening Glow Facial Serum',
        category: 'Skincare - Facial Treatment',
        brand: 'Larassanti Medika Skin',
        description: 'Serum pencerah konsentrat tinggi dengan Niacinamide & Zinc PCA untuk menyamarkan noda hitam dan meratakan warna kulit.',
        createdAt: new Date().toISOString(),
        variants: [
          {
            id: 'var-pj0001-v1',
            productId: 'prod-pj0001',
            variantCode: 'PJ0001-V1',
            variantName: 'Botol Pipet Dropper 20ml (Travel Size)',
            netVolumeGrams: 20,
            bulkFormulaCode: 'FORM-02',
            bpomNumber: 'NA18260100412',
            barcode: '8991234567011',
            description: 'Varian botol kaca frosted 20ml dengan pipet gold luxury.',
            packagingBom: [
              { packagingCode: 'K0001', quantityPerUnit: 1, type: 'primary' },
              { packagingCode: 'K0004', quantityPerUnit: 1, type: 'secondary' },
              { packagingCode: 'K0005', quantityPerUnit: 0.0416, type: 'tertiary' }, // 1 master carton per 24 pcs
            ],
          },
          {
            id: 'var-pj0001-v2',
            productId: 'prod-pj0001',
            variantCode: 'PJ0001-V2',
            variantName: 'Botol Pump Airless 50ml (Regular Size)',
            netVolumeGrams: 50,
            bulkFormulaCode: 'FORM-02',
            bpomNumber: 'NA18260100413',
            barcode: '8991234567028',
            description: 'Varian botol pump airless 50ml untuk pemakaian harian lebih higienis.',
            packagingBom: [
              { packagingCode: 'K0002', quantityPerUnit: 1, type: 'primary' },
              { packagingCode: 'K0004', quantityPerUnit: 1, type: 'secondary' },
              { packagingCode: 'K0005', quantityPerUnit: 0.0416, type: 'tertiary' },
            ],
          },
          {
            id: 'var-pj0001-v3',
            productId: 'prod-pj0001',
            variantCode: 'PJ0001-V3',
            variantName: 'Eco Spout Refill Pouch 100ml',
            netVolumeGrams: 100,
            bulkFormulaCode: 'FORM-02',
            bpomNumber: 'NA18260100414',
            barcode: '8991234567035',
            description: 'Varian pouch isi ulang ramah lingkungan 100ml.',
            packagingBom: [
              { packagingCode: 'K0003', quantityPerUnit: 1, type: 'primary' },
              { packagingCode: 'K0005', quantityPerUnit: 0.02, type: 'tertiary' }, // 1 master per 50 pcs
            ],
          },
        ],
      },
      {
        id: 'prod-pj0002',
        code: 'PJ0002',
        name: 'Luxury Radiant Day Moisturizer SPF 30',
        category: 'Skincare - Moisturizer & Protection',
        brand: 'Larassanti Gold Series',
        description: 'Krim pelembab harian dengan formula pelembab intensif dan proteksi UV.',
        createdAt: new Date().toISOString(),
        variants: [
          {
            id: 'var-pj0002-v1',
            productId: 'prod-pj0002',
            variantCode: 'PJ0002-V1',
            variantName: 'Luxury Acrylic Pot Gold 20g',
            netVolumeGrams: 20,
            bulkFormulaCode: 'FORM-01',
            bpomNumber: 'NA18260100520',
            barcode: '8991234568018',
            description: 'Kemasan jar mewah akrilik double wall 20g.',
            packagingBom: [
              { packagingCode: 'K0001', quantityPerUnit: 1, type: 'primary' },
              { packagingCode: 'K0004', quantityPerUnit: 1, type: 'secondary' },
              { packagingCode: 'K0005', quantityPerUnit: 0.0416, type: 'tertiary' },
            ],
          },
          {
            id: 'var-pj0002-v2',
            productId: 'prod-pj0002',
            variantCode: 'PJ0002-V2',
            variantName: 'Convenient Travel Tube 50g',
            netVolumeGrams: 50,
            bulkFormulaCode: 'FORM-01',
            bpomNumber: 'NA18260100521',
            barcode: '8991234568025',
            description: 'Kemasan tube fleksibel 50g praktis untuk bepergian.',
            packagingBom: [
              { packagingCode: 'K0003', quantityPerUnit: 1, type: 'primary' },
              { packagingCode: 'K0004', quantityPerUnit: 1, type: 'secondary' },
              { packagingCode: 'K0005', quantityPerUnit: 0.0416, type: 'tertiary' },
            ],
          },
        ],
      },
    ];

    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(defaultProducts));
    return defaultProducts;
  },

  saveProducts: async (products: Product[]): Promise<void> => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    
    if (isSupabaseConfigured && supabase) {
      try {
        // Background sync to Supabase if schema exists
        for (const prod of products) {
          await supabase.from('products').upsert({
            id: prod.id,
            code: prod.code,
            name: prod.name,
            category: prod.category,
            brand: prod.brand,
            description: prod.description,
          });
          
          for (const v of prod.variants) {
            await supabase.from('product_variants').upsert({
              id: v.id,
              product_id: prod.id,
              variant_code: v.variantCode,
              variant_name: v.variantName,
              net_volume_grams: v.netVolumeGrams,
              bulk_formula_code: v.bulkFormulaCode,
              packaging_bom: v.packagingBom,
              bpom_number: v.bpomNumber,
              barcode: v.barcode,
              description: v.description,
            });
          }
        }
      } catch (err) {
        console.warn('Supabase product sync warning:', err);
      }
    }
  },
};
