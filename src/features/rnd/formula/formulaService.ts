import { supabase, isSupabaseConfigured } from '../../../core/auth/supabaseClient';
import { BulkFormulation } from '../../../types';

// Penyimpanan sesi in-memory (BUKAN local storage)
let inMemoryFormulations: BulkFormulation[] = [];

// Bersihkan data demo lama dari local storage jika masih tersisa di browser
export const purgeLegacyDemoFormulas = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const legacyKeys = [
      'cosmo_ddmp_bulk_formulations',
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
   * Mengambil semua master formulasi bulk langsung dari database Supabase
   */
  getFormulations: async (): Promise<BulkFormulation[]> => {
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
            dynamicProcessSteps: row.dynamic_process_steps || undefined,
            technicalNotes: row.technical_notes || '',
            createdBy: row.created_by || '',
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
          }));

          inMemoryFormulations = mapped;
          return mapped;
        } else if (error) {
          console.error('[formulaService] Error loading bulk_formulations from Supabase:', error.message);
        }
      } catch (err) {
        console.error('[formulaService] Exception loading from Supabase:', err);
      }
    }

    return inMemoryFormulations;
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
      dynamic_process_steps: formula.dynamicProcessSteps || null,
      technical_notes: formula.technicalNotes || '',
      created_by: formula.createdBy || '',
      updated_at: new Date().toISOString(),
    };

    // 1. Simpan langsung ke Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('bulk_formulations')
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          // Bila gagal karena kolom tidak ada, coba upsert tanpa kolom baru
          if (error.code === 'PGRST204' || error.message?.includes('column')) {
            console.warn('Supabase schema cache miss for new columns, falling back to core columns.');
            const fallbackPayload = { ...payload };
            delete (fallbackPayload as any).dynamic_process_steps;
            delete (fallbackPayload as any).technical_notes;
            const { error: fallbackError } = await supabase.from('bulk_formulations').upsert(fallbackPayload, { onConflict: 'id' });
            if (fallbackError) {
               console.error('Supabase fallback upsert error (bulk_formulations):', fallbackError);
               return { success: false, error: fallbackError.message };
            }
          } else {
            console.error('Supabase upsert error (bulk_formulations):', error);
            return { success: false, error: error.message };
          }
        }
      } catch (dbErr: any) {
        console.error('Supabase saveSingleFormulation exception:', dbErr);
        return { success: false, error: dbErr.message || String(dbErr) };
      }
    }

    // 2. Perbarui state in-memory
    const idx = inMemoryFormulations.findIndex((f) => f.id === formula.id || f.code.toUpperCase() === formula.code.toUpperCase());
    if (idx !== -1) {
      inMemoryFormulations[idx] = { ...formula, updatedAt: new Date().toISOString() };
    } else {
      inMemoryFormulations.unshift({ ...formula, createdAt: formula.createdAt || new Date().toISOString() });
    }

    return { success: true };
  },

  /**
   * Menghapus formulasi dari database Supabase
   */
  deleteFormulation: async (id: string, code?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('bulk_formulations').delete().eq('id', id);
        if (code) {
          await supabase.from('bulk_formulations').delete().eq('code', code);
        }
      } catch (err: any) {
        console.error('[formulaService] Supabase delete error:', err);
      }
    }

    inMemoryFormulations = inMemoryFormulations.filter((f) => f.id !== id && (!code || f.code !== code));
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
