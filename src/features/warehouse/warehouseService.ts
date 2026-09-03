import { GrnRecord, GrnStats } from './types/grnTypes';
import { supabase, isSupabaseConfigured } from '../../core/auth/supabaseClient';

const WAREHOUSE_GRN_STORAGE_KEY = 'lsm_warehouse_grn_v1';

const defaultGrnRecords: GrnRecord[] = [];

export const warehouseService = {
  getGrnRecords: async (): Promise<GrnRecord[]> => {
    // Try supabase first if available
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('warehouse_grn')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: GrnRecord[] = data.map((d: any) => ({
            id: d.id,
            grnNumber: d.grn_number || d.grnNumber,
            materialType: d.material_type || d.materialType,
            materialId: d.material_id || d.materialId,
            materialCode: d.material_code || d.materialCode,
            materialName: d.material_name || d.materialName,
            manufacturer: d.manufacturer,
            distributor: d.distributor,
            poNumber: d.po_number || d.poNumber,
            deliveryNoteNumber: d.delivery_note_number || d.deliveryNoteNumber,
            batchNumber: d.batch_number || d.batchNumber,
            receivedDate: d.received_date || d.receivedDate,
            expiryDate: d.expiry_date || d.expiryDate,
            quantityReceived: Number(d.quantity_received || d.quantityReceived || 0),
            unit: d.unit,
            containerCount: Number(d.container_count || d.containerCount || 1),
            containerType: d.container_type || d.containerType,
            storageLocation: d.storage_location || d.storageLocation,
            storageConditions: d.storage_conditions || d.storageConditions,
            qcStatus: (d.qc_status || d.qcStatus || 'QUARANTINE') as any,
            qcParametersCount: d.qc_parameters_count || d.qcParametersCount || 0,
            receivedBy: d.received_by || d.receivedBy || 'Staf Gudang',
            createdAt: d.created_at || d.createdAt || new Date().toISOString(),
            notes: d.notes,
          }));
          localStorage.setItem(WAREHOUSE_GRN_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase GRN fetch error or table not created yet, using local storage fallback:', err);
      }
    }

    // LocalStorage fallback
    const saved = localStorage.getItem(WAREHOUSE_GRN_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored GRN records:', e);
      }
    }

    // Save defaults
    localStorage.setItem(WAREHOUSE_GRN_STORAGE_KEY, JSON.stringify(defaultGrnRecords));
    return defaultGrnRecords;
  },

  saveGrnRecord: async (
    record: Omit<GrnRecord, 'id' | 'createdAt' | 'grnNumber'>
  ): Promise<GrnRecord> => {
    const existing = await warehouseService.getGrnRecords();

    // Format: GRN-BB-YYMMDD-XX atau GRN-BK-YYMMDD-XX
    // YYMMDD derived from receivedDate (e.g. 2026-09-03 -> 260903)
    const dateParts = (record.receivedDate || new Date().toISOString().slice(0, 10)).split('-');
    const yy = dateParts[0].length === 4 ? dateParts[0].slice(2) : dateParts[0];
    const mm = (dateParts[1] || '01').padStart(2, '0');
    const dd = (dateParts[2] || '01').padStart(2, '0');
    const dateCode = `${yy}${mm}${dd}`;

    const typePrefix = record.materialType === 'raw' ? 'GRN-BB' : 'GRN-BK';
    const targetPrefix = `${typePrefix}-${dateCode}-`;

    // Cari urutan tertinggi penerimaan barang pada tanggal & jenis tersebut (reset per hari)
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

    // Attempt to save to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          grn_number: newRecord.grnNumber,
          material_type: newRecord.materialType,
          material_id: newRecord.materialId,
          material_code: newRecord.materialCode,
          material_name: newRecord.materialName,
          manufacturer: newRecord.manufacturer,
          distributor: newRecord.distributor,
          po_number: newRecord.poNumber,
          delivery_note_number: newRecord.deliveryNoteNumber,
          batch_number: newRecord.batchNumber || '',
          received_date: newRecord.receivedDate,
          expiry_date: newRecord.expiryDate || null,
          quantity_received: newRecord.quantityReceived,
          unit: newRecord.unit,
          container_count: newRecord.containerCount,
          container_type: newRecord.containerType,
          storage_location: newRecord.storageLocation,
          storage_conditions: newRecord.storageConditions,
          qc_status: newRecord.qcStatus,
          qc_parameters_count: newRecord.qcParametersCount || 0,
          received_by: newRecord.receivedBy,
        };

        const { data, error } = await supabase.from('warehouse_grn').insert(payload).select().single();
        if (!error && data) {
          newRecord.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase GRN insert error, saved to local cache:', err);
      }
    }

    const updated = [newRecord, ...existing];
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
        const payload: any = {};
        if (updatedData.batchNumber !== undefined) payload.batch_number = updatedData.batchNumber;
        if (updatedData.distributor !== undefined) payload.distributor = updatedData.distributor;
        if (updatedData.manufacturer !== undefined) payload.manufacturer = updatedData.manufacturer;
        if (updatedData.quantityReceived !== undefined) payload.quantity_received = updatedData.quantityReceived;
        if (updatedData.unit !== undefined) payload.unit = updatedData.unit;
        if (updatedData.containerCount !== undefined) payload.container_count = updatedData.containerCount;
        if (updatedData.containerType !== undefined) payload.container_type = updatedData.containerType;
        if (updatedData.expiryDate !== undefined) payload.expiry_date = updatedData.expiryDate;
        if (updatedData.storageLocation !== undefined) payload.storage_location = updatedData.storageLocation;
        if (updatedData.storageConditions !== undefined) payload.storage_conditions = updatedData.storageConditions;
        if (updatedData.deliveryNoteNumber !== undefined) payload.delivery_note_number = updatedData.deliveryNoteNumber;
        if (updatedData.poNumber !== undefined) payload.po_number = updatedData.poNumber;

        await supabase.from('warehouse_grn').update(payload).eq('id', id);
      } catch (e) {
        console.warn('Failed to update Supabase record:', e);
      }
    }

    return updatedRecord;
  },

  deleteGrnRecord: async (id: string): Promise<boolean> => {
    const existing = await warehouseService.getGrnRecords();
    const filtered = existing.filter((item) => item.id !== id);
    localStorage.setItem(WAREHOUSE_GRN_STORAGE_KEY, JSON.stringify(filtered));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('warehouse_grn').delete().eq('id', id);
      } catch (e) {
        console.warn('Failed to delete from Supabase:', e);
      }
    }
    return true;
  },

  calculateStats: (records: GrnRecord[]): GrnStats => {
    return {
      totalIncoming: records.length,
      inQuarantine: records.filter((r) => r.qcStatus === 'QUARANTINE').length,
      passedQC: records.filter((r) => r.qcStatus === 'PASSED').length,
      rejectedQC: records.filter((r) => r.qcStatus === 'REJECTED').length,
      rawMaterialsCount: records.filter((r) => r.materialType === 'raw').length,
      packagingCount: records.filter((r) => r.materialType === 'packaging').length,
    };
  },
};
