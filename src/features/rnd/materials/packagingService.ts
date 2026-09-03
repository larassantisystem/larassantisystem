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
        const { data, error } = await supabase
          .from('packaging_materials')
          .select('*')
          .order('code', { ascending: true });

        if (error) {
          console.error('[Supabase Audit] Error fetching packaging_materials:', error);
        } else if (data && data.length > 0) {
          const mapped: PackagingMaterial[] = data.map((p: any) => ({
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
          qc_parameters: normalizedItem.qcParameters || [],
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
            console.error('[Supabase Audit] Error inserting packaging_material:', insertError);
            return { success: false, error: `${insertError.message} (${insertError.code})` };
          }
          return { success: true, updatedId: resolvedId };
        }
      } catch (err: any) {
        console.error('[Supabase Audit] Exception during packaging_material save:', err);
        return { success: false, error: err.message || String(err) };
      }
    }
    return { success: true, error: 'Tersimpan lokal (Supabase belum terkonfigurasi).' };
  },

  savePackagingMaterials: async (materials: PackagingMaterial[]): Promise<void> => {
    const normalizedList = materials.map((p) => ({ ...p, id: ensureUUID(p.id) }));
    localStorage.setItem(PACKAGING_STORAGE_KEY, JSON.stringify(normalizedList));

    if (isSupabaseConfigured && supabase) {
      try {
        for (const item of normalizedList) {
          await packagingService.saveSinglePackagingMaterial(item);
        }
      } catch (err) {
        console.warn('[Supabase Audit] Batch packaging upsert error', err);
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
