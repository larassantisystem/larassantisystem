import { supabase, isSupabaseConfigured } from '../../../core/auth/supabaseClient';
import { PackagingMaterial } from '../../../types';
import { ensureUUID } from '../../../utils/uuid';

const PACKAGING_STORAGE_KEY = 'lsm_packaging_materials_k';

export const packagingService = {
  checkConnection: async (): Promise<{ configured: boolean; connected: boolean; message: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        configured: false,
        connected: false,
        message: 'Supabase URL atau Anon Key belum dikonfigurasi pada environment variable.',
      };
    }
    try {
      const { data, error } = await supabase.from('packaging_materials').select('id').limit(1);
      if (error) {
        return {
          configured: true,
          connected: false,
          message: `Koneksi Supabase gagal: ${error.message} (Code: ${error.code})`,
        };
      }
      return {
        configured: true,
        connected: true,
        message: 'Koneksi ke tabel packaging_materials Supabase aktif dan terverifikasi.',
      };
    } catch (err: any) {
      return {
        configured: true,
        connected: false,
        message: `Terjadi exception saat koneksi: ${err.message || String(err)}`,
      };
    }
  },

  getPackagingMaterials: async (): Promise<PackagingMaterial[]> => {
    if (isSupabaseConfigured && supabase) {
      try {
        let allData: any[] = [];
        let from = 0;
        const step = 1000;
        let hasMore = true;
        let fetchError = false;

        // Fetch in batches of 1000 to bypass Supabase PostgREST default max-rows limit (1000 items)
        while (hasMore) {
          const { data, error } = await supabase
            .from('packaging_materials')
            .select('*')
            .order('code', { ascending: true })
            .range(from, from + step - 1);

          if (error) {
            console.warn('[Supabase Audit] Notice fetching packaging_materials batch (falling back to local storage):', error.message || error);
            fetchError = true;
            break;
          }

          if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < step) {
              hasMore = false;
            } else {
              from += step;
            }
          } else {
            hasMore = false;
          }
        }

        if (!fetchError && (allData.length > 0 || from === 0)) {
          const mapped: PackagingMaterial[] = allData.map((p: any) => ({
            id: p.id,
            code: p.code,
            specNumber: p.spec_number || p.specNumber || `SP-BK-${p.code}`,
            name: p.name,
            type: p.type || 'primary',
            unit: p.unit || 'Pcs',
            unitCapacityGrams: p.unit_capacity_grams ?? p.unitCapacityGrams,
            supplier: p.supplier || p.manufacturer || '',
            manufacturer: p.manufacturer || p.supplier || '',
            storageLocation: p.storage_location || p.storageLocation || '',
            storageConditions: p.storage_conditions || p.storageConditions || '',
            qcParameters: p.qc_parameters || p.qcParameters || [],
            reorderPoint: p.reorder_point ?? p.reorderPoint ?? 100,
            lastModifiedBy: p.last_modified_by || p.lastModifiedBy,
            lastModifiedAt: p.last_modified_at || p.lastModifiedAt,
          }));
          localStorage.setItem(PACKAGING_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('[Supabase Audit] Supabase packaging materials fetch exception, falling back to local storage', err);
      }
    }

    const saved = localStorage.getItem(PACKAGING_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing local packaging materials', e);
      }
    }
    return [];
  },

  saveSinglePackagingMaterial: async (item: PackagingMaterial): Promise<{ success: boolean; error?: string; updatedId?: string }> => {
    // Ensure ID is a valid UUID for PostgreSQL
    const validId = ensureUUID(item.id);
    const normalizedItem: PackagingMaterial = { ...item, id: validId };

    // Update local cache first
    const saved = localStorage.getItem(PACKAGING_STORAGE_KEY);
    let currentList: PackagingMaterial[] = saved ? JSON.parse(saved) : [];
    const idx = currentList.findIndex((p) => p.id === validId || p.code === normalizedItem.code || p.id === item.id);
    if (idx >= 0) {
      currentList[idx] = normalizedItem;
    } else {
      currentList.unshift(normalizedItem);
    }
    localStorage.setItem(PACKAGING_STORAGE_KEY, JSON.stringify(currentList));

    if (isSupabaseConfigured && supabase) {
      try {
        const itemCode = normalizedItem.code.trim().toUpperCase();

        // 1. Check if a row already exists in Supabase by `code` or `id`
        let existingId: string | null = null;

        if (itemCode) {
          const { data: byCode, error: errCode } = await supabase
            .from('packaging_materials')
            .select('id')
            .eq('code', itemCode)
            .maybeSingle();
          if (!errCode && byCode?.id) {
            existingId = byCode.id;
          }
        }

        if (!existingId && validId) {
          const { data: byId, error: errId } = await supabase
            .from('packaging_materials')
            .select('id')
            .eq('id', validId)
            .maybeSingle();
          if (!errId && byId?.id) {
            existingId = byId.id;
          }
        }

        const resolvedId = existingId || validId;

        const payload = {
          id: resolvedId,
          code: itemCode,
          spec_number: normalizedItem.specNumber || `SP-BK-${itemCode}`,
          name: normalizedItem.name,
          type: normalizedItem.type || 'primary',
          unit: normalizedItem.unit || 'Pcs',
          unit_capacity_grams: normalizedItem.unitCapacityGrams ?? null,
          supplier: normalizedItem.supplier || normalizedItem.manufacturer || '',
          manufacturer: normalizedItem.manufacturer || normalizedItem.supplier || '',
          storage_location: normalizedItem.storageLocation || '',
          storage_conditions: normalizedItem.storageConditions || '',
          qc_parameters: normalizedItem.qcParameters || [], // QC parameters are an array of objects
          reorder_point: normalizedItem.reorderPoint ?? 100,
          last_modified_by: normalizedItem.lastModifiedBy || 'Staff RnD',
          last_modified_at: normalizedItem.lastModifiedAt || new Date().toISOString(),
        };

        if (existingId) {
          // UPDATE existing record
          const { error: updateError } = await supabase
            .from('packaging_materials')
            .update(payload)
            .eq('id', existingId);

          if (updateError) {
            console.error('[Supabase Audit] Error updating packaging_material by ID:', updateError);
            // Fallback: try update by code
            const { error: fallbackError } = await supabase
              .from('packaging_materials')
              .update(payload)
              .eq('code', itemCode);

            if (fallbackError) {
              return { success: false, error: `${fallbackError.message} (${fallbackError.code})` };
            }
          }
          return { success: true, updatedId: resolvedId };
        } else {
          // INSERT new record
          const { error: insertError } = await supabase
            .from('packaging_materials')
            .insert(payload);

          if (insertError) {
            // If code conflict happens unexpectedly, try updating by code
            if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
              const { error: retryUpdateError } = await supabase
                .from('packaging_materials')
                .update(payload)
                .eq('code', itemCode);

              if (retryUpdateError) {
                return { success: false, error: `${retryUpdateError.message} (${retryUpdateError.code})` };
              }
              return { success: true, updatedId: resolvedId };
            }
            if (insertError.message?.includes('fetch') || insertError.message?.includes('network')) {
              console.warn('[Supabase Audit] Network notice: packaging_material cached locally, cloud sync will retry:', insertError.message);
              return { success: true, updatedId: resolvedId, error: 'Tersimpan lokal (sinkronisasi cloud tertunda).' };
            }
            console.error('[Supabase Audit] Error inserting packaging_material:', insertError);
            return { success: false, error: `${insertError.message} (${insertError.code})` };
          }
          return { success: true, updatedId: resolvedId };
        }
      } catch (err: any) {
        if (err.message?.includes('fetch') || err.message?.includes('network')) {
          console.warn('[Supabase Audit] Network exception: packaging_material cached locally:', err.message);
          return { success: true, updatedId: validId, error: 'Tersimpan lokal (jaringan offline).' };
        }
        console.error('[Supabase Audit] Exception during packaging_material save:', err);
        return { success: false, error: err.message || String(err) };
      }
    }
    return { success: true, error: 'Tersimpan lokal (Supabase belum terkonfigurasi).' };
  },

  savePackagingMaterials: async (materials: PackagingMaterial[]): Promise<void> => {
    if (!materials || materials.length === 0) return;
    const normalizedList = materials.map((p) => ({ ...p, id: ensureUUID(p.id) }));

    // 1. Update localStorage cache with deduplication by code
    const saved = localStorage.getItem(PACKAGING_STORAGE_KEY);
    const existingList: PackagingMaterial[] = saved ? JSON.parse(saved) : [];
    const map = new Map<string, PackagingMaterial>();
    existingList.forEach((p) => map.set(p.code.trim().toUpperCase(), p));
    normalizedList.forEach((p) => map.set(p.code.trim().toUpperCase(), p));
    const merged = Array.from(map.values());
    localStorage.setItem(PACKAGING_STORAGE_KEY, JSON.stringify(merged));

    // 2. Persist to Supabase in batches of 50 to prevent connection pool exhaustion / Failed to fetch
    if (isSupabaseConfigured && supabase) {
      const CHUNK_SIZE = 50;
      for (let i = 0; i < normalizedList.length; i += CHUNK_SIZE) {
        const chunk = normalizedList.slice(i, i + CHUNK_SIZE);
        const payloads = chunk.map((item) => {
          const itemCode = item.code.trim().toUpperCase();
          return {
            id: ensureUUID(item.id),
            code: itemCode,
            spec_number: item.specNumber || `SP-BK-${itemCode}`,
            name: item.name,
            type: item.type || 'primary',
            unit: item.unit || 'Pcs',
            unit_capacity_grams: item.unitCapacityGrams ?? null,
            supplier: item.supplier || item.manufacturer || '',
            manufacturer: item.manufacturer || item.supplier || '',
            storage_location: item.storageLocation || '',
            storage_conditions: item.storageConditions || '',
            qc_parameters: item.qcParameters || [],
            last_modified_by: item.lastModifiedBy || 'Staff RnD',
            last_modified_at: item.lastModifiedAt || new Date().toISOString(),
          };
        });

        try {
          const { error } = await supabase
            .from('packaging_materials')
            .upsert(payloads, { onConflict: 'code' });

          if (error) {
            console.warn(`[Supabase Audit] Batch packaging upsert chunk [${i}..${i + chunk.length}] warning:`, error.message);
          }
        } catch (err: any) {
          console.warn(`[Supabase Audit] Batch packaging upsert network notice at chunk [${i}]:`, err?.message || err);
        }
      }
    }
  },

  deletePackagingMaterial: async (id: string, code?: string): Promise<void> => {
    const validId = ensureUUID(id);
    const saved = localStorage.getItem(PACKAGING_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: PackagingMaterial[] = JSON.parse(saved);
        const filtered = parsed.filter((p) => p.id !== id && p.id !== validId && (!code || p.code !== code));
        localStorage.setItem(PACKAGING_STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.error(e);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: err1 } = await supabase.from('packaging_materials').delete().eq('id', validId);
        if (err1) console.error('[Supabase Audit] Delete packaging by id error:', err1);
        if (code) {
          const { error: err2 } = await supabase.from('packaging_materials').delete().eq('code', code);
          if (err2) console.error('[Supabase Audit] Delete packaging by code error:', err2);
        }
      } catch (err) {
        console.warn('[Supabase Audit] Supabase delete packaging material error', err);
      }
    }
  },
};
