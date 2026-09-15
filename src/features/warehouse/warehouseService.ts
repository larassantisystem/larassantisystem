import { GrnRecord, GrnStats } from './types/grnTypes';
import { supabase, isSupabaseConfigured } from '../../core/auth/supabaseClient';
import { calculateSamplingPlan } from '../quality/utils/milStd105e';

const WAREHOUSE_GRN_STORAGE_KEY = 'lsm_warehouse_grn_v1';

const defaultGrnRecords: GrnRecord[] = [];

/**
 * Builds standard Supabase payload conforming to the primary warehouse_grn schema
 * with snake_case column names (supplier_batch_number, purchase_order_number, expiration_date).
 */
function buildPrimarySupabasePayload(record: GrnRecord): Record<string, any> {
  const lotCode =
    record.materialType === 'raw'
      ? `LBB-${record.grnNumber.replace(/[^0-9]/g, '').slice(-6) || '260901'}`
      : `LBK-${record.grnNumber.replace(/[^0-9]/g, '').slice(-6) || '260901'}`;

  // Default expiration date if not set (packaging or materials with long shelf life)
  let expDate = record.expiryDate;
  if (!expDate) {
    const rDate = record.receivedDate ? new Date(record.receivedDate) : new Date();
    rDate.setFullYear(rDate.getFullYear() + 2);
    expDate = rDate.toISOString().slice(0, 10);
  }

  const payload: Record<string, any> = {
    grn_number: record.grnNumber,
    material_type: record.materialType === 'packaging' ? 'packaging' : 'raw',
    material_id: record.materialId || null,
    material_code: record.materialCode,
    material_name: record.materialName,
    delivery_note_number: record.deliveryNoteNumber || '-',
    purchase_order_number: record.poNumber || (record as any).purchaseOrderNumber || '-',
    supplier_batch_number: record.batchNumber || (record as any).supplierBatchNumber || '-',
    internal_lot_number: (record as any).internalLotNumber || lotCode,
    received_date: record.receivedDate || new Date().toISOString().slice(0, 10),
    expiration_date: expDate,
    quantity_received: Number(record.quantityReceived) || 0,
    unit: record.unit || 'kg',
    container_count: Number(record.containerCount) || 1,
    container_type: record.containerType || 'Drum / Zak',
    distributor: record.distributor || '-',
    manufacturer: record.manufacturer || '-',
    storage_location: record.storageLocation || 'Gudang Karantina',
    storage_conditions: record.storageConditions || null,
    qc_status: record.qcStatus || 'QUARANTINE',
    qc_parameters_count: Number(record.qcParametersCount) || 0,
    seal_condition: ['intact', 'broken', 'tampered'].includes(record.sealCondition as string)
      ? record.sealCondition
      : 'intact',
    packaging_condition: ['clean', 'damaged', 'wet', 'contaminated'].includes(record.packagingCondition as string)
      ? record.packagingCondition
      : 'clean',
    coa_attachment: record.coaAttachment || null,
    coa_drive_file_id: record.coaDriveFileId || null,
    coa_drive_view_link: record.coaDriveViewLink || null,
    received_by: record.receivedBy || 'Staf Gudang',
    received_by_nik: (record as any).receivedByNik || 'NIK-WH-001',
    notes: record.notes || null,
    revert_reason: record.revertReason || null,
    reverted_by: record.revertedBy || null,
    reverted_at: record.revertedAt || null,
    actual_sample_size: record.actualSampleSize !== undefined && record.actualSampleSize !== null ? Number(record.actualSampleSize) : null,
    actual_sample_unit: record.actualSampleUnit || null,
  };

  return payload;
}

/**
 * Adaptive execution helper that catches PostgREST schema cache errors (PGRST204)
 * or Postgres column mismatch errors (42703), strips the non-existent column,
 * swaps column aliases when needed, and retries automatically up to 8 times.
 */
async function executeWithSchemaAdaptiveRetry(
  tableName: string,
  initialPayload: Record<string, any>,
  record: GrnRecord,
  mode: 'insert' | 'upsert'
): Promise<{ data: any; error: any }> {
  const payload = { ...initialPayload };
  let attempts = 0;
  const maxAttempts = 8;

  while (attempts < maxAttempts) {
    attempts++;
    let result: { data: any; error: any };

    if (mode === 'insert') {
      result = await supabase!.from(tableName).insert(payload).select().single();
    } else {
      result = await supabase!.from(tableName).upsert(payload, { onConflict: 'grn_number' }).select().single();
    }

    if (!result.error) {
      return result;
    }

    const error = result.error;
    const errMsg = error.message || '';
    const isMissingColumn =
      error.code === 'PGRST204' ||
      error.code === '42703' ||
      errMsg.toLowerCase().includes('column') ||
      errMsg.includes('schema cache');

    if (!isMissingColumn) {
      return result;
    }

    // Extract column name from error:
    // e.g. "Could not find the 'batch_number' column of 'warehouse_grn' in the schema cache"
    const match =
      errMsg.match(/Could not find the ['"]([^'"]+)['"] column/i) ||
      errMsg.match(/column ['"]([^'"]+)['"]/i) ||
      errMsg.match(/['"]([^'"]+)['"] column/i);

    if (match && match[1]) {
      const missingCol = match[1];
      console.warn(`[warehouseService] Column '${missingCol}' not in Supabase schema. Adjusting payload (Attempt ${attempts})...`);
      delete payload[missingCol];

      // Handle common column alias swaps
      if (missingCol === 'supplier_batch_number' && !payload.batch_number) {
        payload.batch_number = record.batchNumber || '-';
      } else if (missingCol === 'purchase_order_number' && !payload.po_number) {
        payload.po_number = record.poNumber || '-';
      } else if (missingCol === 'expiration_date' && !payload.expiry_date) {
        payload.expiry_date = record.expiryDate || record.receivedDate;
      } else if (missingCol === 'batch_number' && !payload.supplier_batch_number) {
        payload.supplier_batch_number = record.batchNumber || '-';
      } else if (missingCol === 'po_number' && !payload.purchase_order_number) {
        payload.purchase_order_number = record.poNumber || '-';
      } else if (missingCol === 'expiry_date' && !payload.expiration_date) {
        payload.expiration_date = record.expiryDate || record.receivedDate;
      }
    } else {
      return result;
    }
  }

  // Final attempt
  if (mode === 'insert') {
    return await supabase!.from(tableName).insert(payload).select().single();
  } else {
    return await supabase!.from(tableName).upsert(payload, { onConflict: 'grn_number' }).select().single();
  }
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number = 2500): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Database query timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export const warehouseService = {
  /**
   * Audit Supabase connection and table status
   */
  auditDatabaseStatus: async (): Promise<{
    isConfigured: boolean;
    tableExists: boolean;
    supabaseCount: number;
    localCount: number;
    error: string | null;
  }> => {
    const local = warehouseService.getLocalRecords();
    if (!isSupabaseConfigured || !supabase) {
      return {
        isConfigured: false,
        tableExists: false,
        supabaseCount: 0,
        localCount: local.length,
        error: 'Supabase URL atau Anon Key belum dikonfigurasi pada environment variable.',
      };
    }

    try {
      const { count, error } = await supabase
        .from('warehouse_grn')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return {
          isConfigured: true,
          tableExists: false,
          supabaseCount: 0,
          localCount: local.length,
          error: `[${error.code}] ${error.message}`,
        };
      }

      return {
        isConfigured: true,
        tableExists: true,
        supabaseCount: count ?? 0,
        localCount: local.length,
        error: null,
      };
    } catch (err: any) {
      return {
        isConfigured: true,
        tableExists: false,
        supabaseCount: 0,
        localCount: local.length,
        error: err.message || String(err),
      };
    }
  },

  /**
   * Sync all local records to Supabase table
   */
  syncLocalToSupabase: async (): Promise<{
    syncedCount: number;
    failedCount: number;
    error?: string;
  }> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase belum terkonfigurasi.');
    }

    const localRecords = warehouseService.getLocalRecords();
    if (localRecords.length === 0) {
      return { syncedCount: 0, failedCount: 0 };
    }

    let syncedCount = 0;
    let failedCount = 0;
    let lastErr = '';

    for (const record of localRecords) {
      const initialPayload = buildPrimarySupabasePayload(record);
      const { error } = await executeWithSchemaAdaptiveRetry(
        'warehouse_grn',
        initialPayload,
        record,
        'upsert'
      );

      if (error) {
        failedCount++;
        lastErr = `[${error.code}] ${error.message}`;
      } else {
        syncedCount++;
      }
    }

    return { syncedCount, failedCount, error: lastErr || undefined };
  },

  /**
   * Helper to retrieve localStorage records safely
   */
  getLocalRecords: (): GrnRecord[] => {
    try {
      const saved = localStorage.getItem(WAREHOUSE_GRN_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing local GRN records:', e);
    }
    return defaultGrnRecords;
  },

  getGrnRecords: async (): Promise<GrnRecord[]> => {
    // Try supabase first if available
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('warehouse_grn')
            .select('*')
            .order('created_at', { ascending: false }),
          3000
        );

        if (!error && data && data.length > 0) {
          const mapped: GrnRecord[] = data.map((d: any) => ({
            id: d.id,
            grnNumber: d.grn_number || d.grnNumber,
            materialType: d.material_type || d.materialType || 'raw',
            materialId: d.material_id || d.materialId || '',
            materialCode: d.material_code || d.materialCode,
            materialName: d.material_name || d.materialName,
            manufacturer: d.manufacturer || '-',
            distributor: d.distributor || '-',
            poNumber: d.purchase_order_number || d.po_number || d.poNumber || '-',
            deliveryNoteNumber: d.delivery_note_number || d.deliveryNoteNumber || '-',
            batchNumber: d.supplier_batch_number || d.batch_number || d.batchNumber || '-',
            receivedDate: d.received_date || d.receivedDate,
            expiryDate: d.expiration_date || d.expiry_date || d.expiryDate,
            quantityReceived: Number(d.quantity_received || d.quantityReceived || 0),
            unit: d.unit || 'kg',
            containerCount: Number(d.container_count || d.containerCount || 1),
            containerType: d.container_type || d.containerType || 'Drum / Zak',
            storageLocation: d.storage_location || d.storageLocation || 'Gudang Karantina',
            storageConditions: d.storage_conditions || d.storageConditions,
            qcStatus: (d.qc_status || d.qcStatus || 'QUARANTINE') as any,
            qcParametersCount: Number(d.qc_parameters_count || d.qcParametersCount || 0),
            receivedBy: d.received_by || d.receivedBy || 'Staf Gudang',
            createdAt: d.created_at || d.createdAt || new Date().toISOString(),
            notes: d.notes,
            revertReason: d.revert_reason || d.revertReason,
            revertedBy: d.reverted_by || d.revertedBy,
            revertedAt: d.reverted_at || d.revertedAt,
            actualSampleSize: d.actual_sample_size !== undefined && d.actual_sample_size !== null ? Number(d.actual_sample_size) : d.actualSampleSize,
            actualSampleUnit: d.actual_sample_unit || d.actualSampleUnit,
            sealCondition: d.seal_condition,
            packagingCondition: d.packaging_condition,
            coaAttachment: d.coa_attachment || d.coaAttachment,
            coaDriveFileId: d.coa_drive_file_id || d.coaDriveFileId,
            coaDriveViewLink: d.coa_drive_view_link || d.coaDriveViewLink,
          }));

          // Merge with any local-only records that haven't synced yet
          const local = warehouseService.getLocalRecords();
          const supabaseGrnNumbers = new Set(mapped.map((m) => m.grnNumber));
          const unsyncedLocal = local.filter((l) => !supabaseGrnNumbers.has(l.grnNumber));

          let merged = [...unsyncedLocal, ...mapped];

          // Cross-reference with live QC reports to ensure real-time QC status in GRN table
          try {
            const qcReportsRaw = localStorage.getItem('lsm_qc_reports_v2');
            if (qcReportsRaw) {
              const qcReports = JSON.parse(qcReportsRaw);
              if (Array.isArray(qcReports) && qcReports.length > 0) {
                const qcMap = new Map<string, any>();
                qcReports.forEach((rep: any) => {
                  if (rep.grnId) qcMap.set(rep.grnId, rep);
                  if (rep.grnNumber) qcMap.set(rep.grnNumber, rep);
                });

                merged = merged.map((rec) => {
                  const qcRep = qcMap.get(rec.id) || qcMap.get(rec.grnNumber);
                  if (!qcRep) return rec;

                  const liveQcStatus = qcRep.status;
                  let resolvedStatus = rec.qcStatus;
                  if (liveQcStatus) {
                    resolvedStatus = liveQcStatus as any;
                  }

                  return {
                    ...rec,
                    qcStatus: resolvedStatus,
                    revertReason: rec.revertReason || qcRep.revertReason,
                    revertedBy: rec.revertedBy || qcRep.revertedBy,
                    revertedAt: rec.revertedAt || qcRep.revertedAt,
                    actualSampleSize: rec.actualSampleSize !== undefined ? rec.actualSampleSize : qcRep.actualSampleSize,
                    actualSampleUnit: rec.actualSampleUnit || qcRep.actualSampleUnit,
                  };
                });
              }
            }
          } catch (e) {
            console.warn('[warehouseService] Error cross-referencing QC status:', e);
          }

          localStorage.setItem(WAREHOUSE_GRN_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        } else if (error) {
          console.warn('[warehouseService] Supabase GRN query warning:', error.message);
        }
      } catch (err) {
        console.warn('[warehouseService] Supabase GRN fetch error, using local fallback:', err);
      }
    }

    // LocalStorage fallback
    let local = warehouseService.getLocalRecords();
    try {
      const qcReportsRaw = localStorage.getItem('lsm_qc_reports_v2');
      if (qcReportsRaw) {
        const qcReports = JSON.parse(qcReportsRaw);
        if (Array.isArray(qcReports) && qcReports.length > 0) {
          const qcMap = new Map<string, any>();
          qcReports.forEach((rep: any) => {
            if (rep.grnId) qcMap.set(rep.grnId, rep);
            if (rep.grnNumber) qcMap.set(rep.grnNumber, rep);
          });

          local = local.map((rec) => {
            const qcRep = qcMap.get(rec.id) || qcMap.get(rec.grnNumber);
            if (!qcRep) return rec;

            const liveQcStatus = qcRep.status;
            let resolvedStatus = rec.qcStatus;
            if (liveQcStatus) {
              resolvedStatus = liveQcStatus as any;
            }

            return {
              ...rec,
              qcStatus: resolvedStatus,
              revertReason: rec.revertReason || qcRep.revertReason,
              revertedBy: rec.revertedBy || qcRep.revertedBy,
              revertedAt: rec.revertedAt || qcRep.revertedAt,
              actualSampleSize: rec.actualSampleSize !== undefined ? rec.actualSampleSize : qcRep.actualSampleSize,
              actualSampleUnit: rec.actualSampleUnit || qcRep.actualSampleUnit,
            };
          });
        }
      }
    } catch (e) {
      console.warn('[warehouseService] Error cross-referencing QC status:', e);
    }
    return local;
  },

  saveGrnRecord: async (
    record: Omit<GrnRecord, 'id' | 'createdAt' | 'grnNumber'>
  ): Promise<GrnRecord> => {
    const existing = await warehouseService.getGrnRecords();

    // Format: GRN-BB-YYMMDD-XX atau GRN-BK-YYMMDD-XX
    const dateParts = (record.receivedDate || new Date().toISOString().slice(0, 10)).split('-');
    const yy = dateParts[0].length === 4 ? dateParts[0].slice(2) : dateParts[0];
    const mm = (dateParts[1] || '01').padStart(2, '0');
    const dd = (dateParts[2] || '01').padStart(2, '0');
    const dateCode = `${yy}${mm}${dd}`;

    const typePrefix = record.materialType === 'raw' ? 'GRN-BB' : 'GRN-BK';
    const targetPrefix = `${typePrefix}-${dateCode}-`;

    let maxSeq = 0;
    existing.forEach((r) => {
      if (r.grnNumber && r.grnNumber.startsWith(targetPrefix)) {
        const parts = r.grnNumber.split('-');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    const nextSeq = String(maxSeq + 1).padStart(2, '0');
    const grnNumber = `${targetPrefix}${nextSeq}`;

    const newRecord: GrnRecord = {
      ...record,
      id: `grn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      grnNumber,
      createdAt: new Date().toISOString(),
    };

    // Save to Supabase if configured with schema adaptive retry
    if (isSupabaseConfigured && supabase) {
      try {
        const initialPayload = buildPrimarySupabasePayload(newRecord);
        const { data, error } = await executeWithSchemaAdaptiveRetry(
          'warehouse_grn',
          initialPayload,
          newRecord,
          'insert'
        );

        if (error) {
          console.error('[warehouseService] Supabase insert error:', error);
        } else if (data && data.id) {
          newRecord.id = data.id;
          console.log('[warehouseService] Sukses menyimpan GRN ke Supabase ID:', data.id);
        }
      } catch (err) {
        console.error('[warehouseService] Supabase GRN insert exception:', err);
      }
    }

    const updated = [newRecord, ...existing.filter((e) => e.id !== newRecord.id)];
    localStorage.setItem(WAREHOUSE_GRN_STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  updateGrnRecord: async (
    id: string,
    updatedData: Partial<GrnRecord>
  ): Promise<GrnRecord> => {
    const existing = await warehouseService.getGrnRecords();
    const index = existing.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Catatan GRN tidak ditemukan');
    }

    const updatedRecord: GrnRecord = {
      ...existing[index],
      ...updatedData,
    };

    existing[index] = updatedRecord;
    localStorage.setItem(WAREHOUSE_GRN_STORAGE_KEY, JSON.stringify(existing));

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = buildPrimarySupabasePayload(updatedRecord);
        const { error } = await executeWithSchemaAdaptiveRetry(
          'warehouse_grn',
          payload,
          updatedRecord,
          'upsert'
        );
        if (error) {
          console.warn('[warehouseService] Adaptive update to Supabase failed:', error);
        } else {
          console.log('[warehouseService] GRN successfully synced to Supabase:', updatedRecord.grnNumber);
        }
      } catch (e) {
        console.warn('[warehouseService] Failed to update Supabase record:', e);
      }
    }

    // Synchronize directly with QC Inspection Report & recalculate sampling plan
    try {
      const qcRaw = localStorage.getItem('lsm_qc_reports_v2');
      if (qcRaw) {
        const qcList = JSON.parse(qcRaw);
        if (Array.isArray(qcList)) {
          let qcChanged = false;
          const targetQc = qcList.find((r: any) => r.grnId === id || r.grnNumber === updatedRecord.grnNumber);
          if (targetQc) {
            if (updatedData.batchNumber !== undefined) targetQc.batchNumberVendor = updatedData.batchNumber;
            if (updatedData.manufacturer !== undefined) targetQc.manufacturer = updatedData.manufacturer;
            if (updatedData.distributor !== undefined) targetQc.distributor = updatedData.distributor;
            if (updatedData.deliveryNoteNumber !== undefined) targetQc.deliveryNoteNumber = updatedData.deliveryNoteNumber;
            if (updatedData.poNumber !== undefined) targetQc.poNumber = updatedData.poNumber;
            if (updatedData.expiryDate !== undefined) targetQc.expiryDate = updatedData.expiryDate;
            if (updatedData.storageLocation !== undefined) targetQc.storageLocation = updatedData.storageLocation;
            if (updatedData.storageConditions !== undefined) targetQc.storageConditions = updatedData.storageConditions;

            const qtyChanged = updatedData.quantityReceived !== undefined && updatedData.quantityReceived !== targetQc.quantityReceived;
            const containersChanged = updatedData.containerCount !== undefined && updatedData.containerCount !== targetQc.containerCount;
            const unitChanged = updatedData.unit !== undefined && updatedData.unit !== targetQc.unit;
            const containerTypeChanged = updatedData.containerType !== undefined && updatedData.containerType !== targetQc.containerType;

            if (updatedData.quantityReceived !== undefined) targetQc.quantityReceived = updatedData.quantityReceived;
            if (updatedData.unit !== undefined) targetQc.unit = updatedData.unit;
            if (updatedData.containerCount !== undefined) targetQc.containerCount = updatedData.containerCount;
            if (updatedData.containerType !== undefined) targetQc.containerType = updatedData.containerType;

            if (qtyChanged || containersChanged || unitChanged || containerTypeChanged || targetQc.status === 'REVERTED_TO_WAREHOUSE') {
              targetQc.samplingInfo = calculateSamplingPlan(
                targetQc.materialType,
                targetQc.quantityReceived,
                targetQc.containerCount,
                targetQc.unit,
                targetQc.containerType
              );
              qcChanged = true;
            }

            if (updatedData.qcStatus === 'QUARANTINE' && targetQc.status === 'REVERTED_TO_WAREHOUSE') {
              targetQc.status = 'QUARANTINE';
              targetQc.updatedAt = new Date().toISOString();
              qcChanged = true;
            }

            if (updatedData.actualSampleSize !== undefined) {
              targetQc.actualSampleSize = updatedData.actualSampleSize;
              qcChanged = true;
            }
            if (updatedData.actualSampleUnit !== undefined) {
              targetQc.actualSampleUnit = updatedData.actualSampleUnit;
              qcChanged = true;
            }

            if (qcChanged) {
              localStorage.setItem('lsm_qc_reports_v2', JSON.stringify(qcList));
            }
          }
        }
      }
    } catch (qcSyncErr) {
      console.warn('[warehouseService] Error synchronizing QC report on update:', qcSyncErr);
    }

    return updatedRecord;
  },

  deleteGrnRecord: async (id: string): Promise<boolean> => {
    const existing = await warehouseService.getGrnRecords();
    const target = existing.find((item) => item.id === id || item.grnNumber === id);
    if (!target) return true;

    // Kepatuhan Integritas Data CPKB: Tolak hapus jika sudah masuk Sedang Uji, Menunggu Otorisasi, Rilis, atau Ditolak
    if (target.qcStatus !== 'QUARANTINE' && target.qcStatus !== 'REVERTED_TO_WAREHOUSE') {
      const statusLabel =
        target.qcStatus === 'QUALITY_CONTROL_PROCESS'
          ? 'Sedang Uji'
          : target.qcStatus === 'AWAITING_QM_AUTHORIZATION'
          ? 'Menunggu Otorisasi QM'
          : target.qcStatus === 'PASSED' || target.qcStatus === 'RELEASED'
          ? 'Rilis'
          : target.qcStatus === 'PASSED_WITH_DEVIATION'
          ? 'Rilis dengan Deviasi'
          : 'Ditolak';
      throw new Error(
        `Penghapusan ditolak: Penerimaan (${target.grnNumber}) sudah berada dalam tahap "${statusLabel}". Gudang tidak dapat menghapus data yang sedang/sudah diuji. Silakan koordinasi dengan tim QC untuk melakukan pembatalan/revert inspeksi terlebih dahulu.`
      );
    }

    const filtered = existing.filter((item) => item.id !== id && item.grnNumber !== id);
    localStorage.setItem(WAREHOUSE_GRN_STORAGE_KEY, JSON.stringify(filtered));

    if (isSupabaseConfigured && supabase) {
      try {
        if (target?.grnNumber) {
          await supabase.from('warehouse_grn').delete().eq('grn_number', target.grnNumber);
        } else {
          await supabase.from('warehouse_grn').delete().eq('id', id);
        }
      } catch (e) {
        console.warn('[warehouseService] Failed to delete from Supabase:', e);
      }
    }
    return true;
  },

  calculateStats: (records: GrnRecord[]): GrnStats => {
    return {
      totalIncoming: records.length,
      inQuarantine: records.filter((r) => r.qcStatus === 'QUARANTINE').length,
      underTesting: records.filter((r) => r.qcStatus === 'QUALITY_CONTROL_PROCESS').length,
      awaitingAuth: records.filter((r) => r.qcStatus === 'AWAITING_QM_AUTHORIZATION').length,
      passedQC: records.filter((r) => r.qcStatus === 'PASSED' || r.qcStatus === 'RELEASED' || r.qcStatus === 'PASSED_WITH_DEVIATION').length,
      rejectedQC: records.filter((r) => r.qcStatus === 'REJECTED').length,
      rawMaterialsCount: records.filter((r) => r.materialType === 'raw').length,
      packagingCount: records.filter((r) => r.materialType === 'packaging').length,
    };
  },
};
