import { supabase, isSupabaseConfigured } from '../../../core/auth/supabaseClient';
import { RawMaterial } from '../../../types';
import { ensureUUID } from '../../../utils/uuid';

// In-memory cache untuk performa UI (BUKAN local storage)
let inMemoryRawMaterials: RawMaterial[] = [];

// Bersihkan data lama jika ada di browser
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    localStorage.removeItem('lsm_raw_materials_b');
  } catch {
    // ignore
  }
}

export const materialService = {
  checkConnection: async (): Promise<{ configured: boolean; connected: boolean; message: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        configured: false,
        connected: false,
        message: 'Supabase URL atau Anon Key belum dikonfigurasi pada environment variable.',
      };
    }
    try {
      const { error } = await supabase.from('raw_materials').select('id').limit(1);
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
        message: 'Koneksi ke tabel raw_materials Supabase aktif dan terverifikasi.',
      };
    } catch (err: any) {
      return {
        configured: true,
        connected: false,
        message: `Terjadi exception saat koneksi: ${err.message || String(err)}`,
      };
    }
  },

  getLocalMaterials: (): RawMaterial[] => {
    return inMemoryRawMaterials;
  },

  getMaterials: async (): Promise<RawMaterial[]> => {
    if (isSupabaseConfigured && supabase) {
      try {
        let allData: any[] = [];
        let from = 0;
        const step = 1000;
        let hasMore = true;
        let fetchError = false;

        // Fetch in batches of 1000 to bypass Supabase PostgREST default max-rows limit (1000 items)
        while (hasMore) {
          let batchSuccess = false;
          let batchError: any = null;

          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const { data, error } = await supabase
                .from('raw_materials')
                .select('*')
                .order('code', { ascending: true })
                .range(from, from + step - 1);

              if (error) {
                batchError = error;
                await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
                continue;
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
              batchSuccess = true;
              break;
            } catch (netErr) {
              batchError = netErr;
              await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
            }
          }

          if (!batchSuccess) {
            console.warn('[Supabase Audit] Warning fetching raw_materials batch:', batchError?.message || batchError);
            fetchError = true;
            break;
          }
        }

        if (!fetchError && (allData.length > 0 || from === 0)) {
          const mapped: RawMaterial[] = allData.map((m: any) => ({
            id: m.id,
            code: m.code,
            specNumber: m.spec_number || m.specNumber || `SP-BB-${m.code}`,
            name: m.name,
            chemicalName: m.chemical_name || m.chemicalName || '',
            category: m.category || 'active',
            categories: m.categories || (m.category ? [m.category] : ['active']),
            otherCategorySpecification: m.other_category_specification || m.otherCategorySpecification,
            storageConditions: m.storage_conditions || m.storageConditions || '',
            sdsDocNumber: m.sds_doc_number || m.sdsDocNumber || '',
            sdsFileUrl: m.sds_file_url || m.sdsFileUrl,
            sdsFileName: m.sds_file_name || m.sdsFileName,
            approvedSubstitutes: m.approved_substitutes || m.approvedSubstitutes || [],
            manufacturer: m.manufacturer || '',
            qcParameters: m.qc_parameters || m.qcParameters || [],
            supplierLeadTimeDays: m.supplier_lead_time_days ?? m.supplierLeadTimeDays ?? 14,
            reorderPoint: m.reorder_point ?? m.reorderPoint ?? 50,
            lastModifiedBy: m.last_modified_by || m.lastModifiedBy,
            lastModifiedAt: m.last_modified_at || m.lastModifiedAt,
          }));
          inMemoryRawMaterials = mapped;
          return mapped;
        }
      } catch (err) {
        console.error('[Supabase Audit] Supabase raw materials fetch exception:', err);
      }
    }

    return inMemoryRawMaterials;
  },

  saveSingleMaterial: async (item: RawMaterial): Promise<{ success: boolean; error?: string; updatedId?: string }> => {
    // Ensure ID is a valid UUID for PostgreSQL
    const validId = ensureUUID(item.id);
    const normalizedItem: RawMaterial = { ...item, id: validId };

    // Update in-memory state
    const idx = inMemoryRawMaterials.findIndex((r) => r.id === validId || r.code === normalizedItem.code || r.id === item.id);
    if (idx >= 0) {
      inMemoryRawMaterials[idx] = normalizedItem;
    } else {
      inMemoryRawMaterials.unshift(normalizedItem);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const itemCode = normalizedItem.code.trim().toUpperCase();

        // 1. Check if a row already exists in Supabase by `code` or `id`
        let existingId: string | null = null;
        
        if (itemCode) {
          const { data: byCode, error: errCode } = await supabase
            .from('raw_materials')
            .select('id')
            .eq('code', itemCode)
            .maybeSingle();
          if (!errCode && byCode?.id) {
            existingId = byCode.id;
          }
        }

        if (!existingId && validId) {
          const { data: byId, error: errId } = await supabase
            .from('raw_materials')
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
          spec_number: normalizedItem.specNumber || `SP-BB-${itemCode}`,
          name: normalizedItem.name,
          chemical_name: normalizedItem.chemicalName || '',
          category: normalizedItem.category || 'active',
          categories: normalizedItem.categories || [normalizedItem.category || 'active'],
          storage_conditions: normalizedItem.storageConditions || '',
          sds_doc_number: normalizedItem.sdsDocNumber || '',
          approved_substitutes: normalizedItem.approvedSubstitutes || [],
          manufacturer: normalizedItem.manufacturer || '',
          qc_parameters: normalizedItem.qcParameters || [],
          supplier_lead_time_days: normalizedItem.supplierLeadTimeDays || 14,
          reorder_point: normalizedItem.reorderPoint ?? 50,
          last_modified_by: normalizedItem.lastModifiedBy || 'Staff RnD',
          last_modified_at: normalizedItem.lastModifiedAt || new Date().toISOString(),
        };

        if (existingId) {
          // UPDATE existing record
          const { error: updateError } = await supabase
            .from('raw_materials')
            .update(payload)
            .eq('id', existingId);

          if (updateError) {
            console.error('[Supabase Audit] Error updating raw_material by ID:', updateError);
            // Fallback: try update by code
            const { error: fallbackError } = await supabase
              .from('raw_materials')
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
            .from('raw_materials')
            .insert(payload);

          if (insertError) {
            // If code conflict happens unexpectedly, try updating by code
            if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
              const { error: retryUpdateError } = await supabase
                .from('raw_materials')
                .update(payload)
                .eq('code', itemCode);

              if (retryUpdateError) {
                return { success: false, error: `${retryUpdateError.message} (${retryUpdateError.code})` };
              }
              return { success: true, updatedId: resolvedId };
            }
            console.error('[Supabase Audit] Error inserting raw_material:', insertError);
            return { success: false, error: `${insertError.message} (${insertError.code})` };
          }
          return { success: true, updatedId: resolvedId };
        }
      } catch (err: any) {
        console.error('[Supabase Audit] Exception during raw_material save:', err);
        return { success: false, error: err.message || String(err) };
      }
    }
    return { success: true };
  },

  saveMaterials: async (materials: RawMaterial[]): Promise<void> => {
    if (!materials || materials.length === 0) return;
    const normalizedList = materials.map((m) => ({ ...m, id: ensureUUID(m.id) }));

    // Update in-memory state
    const map = new Map<string, RawMaterial>();
    inMemoryRawMaterials.forEach((r) => map.set(r.code.trim().toUpperCase(), r));
    normalizedList.forEach((r) => map.set(r.code.trim().toUpperCase(), r));
    inMemoryRawMaterials = Array.from(map.values());

    // Persist directly to Supabase in batches of 50
    if (isSupabaseConfigured && supabase) {
      const CHUNK_SIZE = 50;
      for (let i = 0; i < normalizedList.length; i += CHUNK_SIZE) {
        const chunk = normalizedList.slice(i, i + CHUNK_SIZE);
        const payloads = chunk.map((item) => {
          const itemCode = item.code.trim().toUpperCase();
          return {
            id: ensureUUID(item.id),
            code: itemCode,
            spec_number: item.specNumber || `SP-BB-${itemCode}`,
            name: item.name,
            chemical_name: item.chemicalName || '',
            category: item.category || 'active',
            categories: item.categories || [item.category || 'active'],
            storage_conditions: item.storageConditions || '',
            sds_doc_number: item.sdsDocNumber || '',
            approved_substitutes: item.approvedSubstitutes || [],
            manufacturer: item.manufacturer || '',
            qc_parameters: item.qcParameters || [],
            supplier_lead_time_days: item.supplierLeadTimeDays || 14,
            last_modified_by: item.lastModifiedBy || 'Staff RnD',
            last_modified_at: item.lastModifiedAt || new Date().toISOString(),
          };
        });

        try {
          const { error } = await supabase
            .from('raw_materials')
            .upsert(payloads, { onConflict: 'code' });

          if (error) {
            console.error(`[Supabase Audit] Batch raw materials upsert chunk [${i}..${i + chunk.length}] error:`, error.message);
          }
        } catch (err: any) {
          console.error(`[Supabase Audit] Batch raw materials upsert error at chunk [${i}]:`, err?.message || err);
        }
      }
    }
  },

  deleteMaterial: async (id: string, code?: string): Promise<void> => {
    const validId = ensureUUID(id);
    inMemoryRawMaterials = inMemoryRawMaterials.filter((r) => r.id !== id && r.id !== validId && (!code || r.code !== code));

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: err1 } = await supabase.from('raw_materials').delete().eq('id', validId);
        if (err1) console.error('[Supabase Audit] Delete by id error:', err1);
        if (code) {
          const { error: err2 } = await supabase.from('raw_materials').delete().eq('code', code);
          if (err2) console.error('[Supabase Audit] Delete by code error:', err2);
        }
      } catch (err) {
        console.error('[Supabase Audit] Supabase delete raw material error:', err);
      }
    }
  },

  // Backward compatibility wrapper
  getAllMaterials: async (): Promise<{ data: RawMaterial[] | null; error: string | null }> => {
    const list = await materialService.getMaterials();
    return { data: list, error: null };
  },
};
