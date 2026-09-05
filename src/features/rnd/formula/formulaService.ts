import { supabase, isSupabaseConfigured } from '../../../core/auth/supabaseClient';
import { BulkFormulation } from '../../../types';

const FORMULA_STORAGE_KEY = 'cosmo_ddmp_bulk_formulations';

// Bersihkan data demo lama dari local storage jika masih tersisa di browser
export const purgeLegacyDemoFormulas = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const legacyKeys = [
      'lsm_formulations_v2',
      'rnd_demo_formulas',
      'demo_formulations_cache',
      'lsm_formulations'
    ];
    legacyKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
  }
};

// Jalankan pembersihan saat inisialisasi module
purgeLegacyDemoFormulas();

export const formulaService = {
  isConfigured: isSupabaseConfigured,

  /**
   * Mengambil semua master formulasi bulk dari database Supabase
   */
  getFormulations: async (): Promise<BulkFormulation[]> => {
    // 1. Coba ambil dari Supabase jika koneksi aktif
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('bulk_formulations')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: BulkFormulation[] = data.map((row: any) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            productId: row.product_id || '',
            productCode: row.product_code || '',
            productName: row.product_name || row.name || '',
            version: row.version || 'v1.0',
            status: row.status || 'ACTIVE',
            bulkQuantityKg: Number(row.bulk_quantity_kg) || 100,
            purposeDescription: row.purpose_description || '',
            ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
            mixingInstructions: row.mixing_instructions || '',
            createdBy: row.created_by || '',
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
          }));

          // Sinkronkan ke cache penyimpanan lokal
          localStorage.setItem(FORMULA_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('Gagal memuat formulasi dari Supabase, beralih ke cache lokal:', err);
      }
    }

    // 2. Fallback: baca dari cache lokal (tanpa data demo palsu)
    try {
      const saved = localStorage.getItem(FORMULA_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    return [];
  },

  /**
   * Menyimpan atau memperbarui satu formulasi bulk ke Supabase
   */
  saveSingleFormulation: async (formula: BulkFormulation): Promise<{ success: boolean; error?: string }> => {
    const payload = {
      id: formula.id,
      code: formula.code.trim().toUpperCase(),
      name: formula.name.trim(),
      product_id: formula.productId || null,
      product_code: formula.productCode.trim().toUpperCase(),
      product_name: formula.productName.trim(),
      version: formula.version || 'v1.0',
      status: formula.status || 'ACTIVE',
      bulk_quantity_kg: formula.bulkQuantityKg || 100,
      purpose_description: formula.purposeDescription || '',
      ingredients: formula.ingredients || [],
      mixing_instructions: formula.mixingInstructions || '',
      created_by: formula.createdBy || '',
      updated_at: new Date().toISOString(),
    };

    // 1. Simpan ke Supabase jika aktif
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('bulk_formulations')
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          console.error('Supabase upsert error (bulk_formulations):', error);
          // Bila gagal simpan ke DB, tetap simpan ke cache agar data formulator tidak hilang
        }
      } catch (dbErr: any) {
        console.warn('Supabase request failed, saving to local cache:', dbErr);
      }
    }

    // 2. Perbarui cache lokal
    try {
      const saved = localStorage.getItem(FORMULA_STORAGE_KEY);
      const list: BulkFormulation[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((f) => f.id === formula.id || f.code.toUpperCase() === formula.code.toUpperCase());
      if (idx !== -1) {
        list[idx] = { ...formula, updatedAt: new Date().toISOString() };
      } else {
        list.unshift({ ...formula, createdAt: formula.createdAt || new Date().toISOString() });
      }
      localStorage.setItem(FORMULA_STORAGE_KEY, JSON.stringify(list));
    } catch (cacheErr) {
      console.error('Failed to update local formula cache:', cacheErr);
    }

    return { success: true };
  },

  /**
   * Menghapus formulasi dari database Supabase dan cache lokal
   */
  deleteFormulation: async (id: string, code?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('bulk_formulations').delete().eq('id', id);
        if (code) {
          await supabase.from('bulk_formulations').delete().eq('code', code);
        }
      } catch (err: any) {
        console.warn('Supabase delete error:', err);
      }
    }

    // Hapus dari cache lokal
    try {
      const saved = localStorage.getItem(FORMULA_STORAGE_KEY);
      if (saved) {
        const list: BulkFormulation[] = JSON.parse(saved);
        const filtered = list.filter((f) => f.id !== id && (!code || f.code !== code));
        localStorage.setItem(FORMULA_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }

    return { success: true };
  },

  /**
   * Menghitung versi berikutnya secara otomatis untuk suatu kode produk
   */
  calculateNextVersion: (existingFormulas: BulkFormulation[], productCode: string): string => {
    const cleanCode = productCode.trim().toUpperCase();
    const productFormulas = existingFormulas.filter(
      (f) => f.productCode?.toUpperCase() === cleanCode
    );

    if (productFormulas.length === 0) {
      return 'v1.0';
    }

    let maxMajor = 1;
    let maxMinor = 0;

    productFormulas.forEach((f) => {
      const verStr = (f.version || 'v1.0').toLowerCase().replace('v', '').trim();
      const parts = verStr.split('.');
      const major = parseInt(parts[0], 10) || 1;
      const minor = parseInt(parts[1], 10) || 0;

      if (major > maxMajor) {
        maxMajor = major;
        maxMinor = minor;
      } else if (major === maxMajor && minor > maxMinor) {
        maxMinor = minor;
      }
    });

    // Otomatis naik versi minor berikutnya
    return `v${maxMajor}.${maxMinor + 1}`;
  },
};
