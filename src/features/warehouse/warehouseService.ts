import { GrnRecord, GrnStats } from './types/grnTypes';
import { supabase, isSupabaseConfigured } from '../../core/auth/supabaseClient';

const WAREHOUSE_GRN_STORAGE_KEY = 'lsm_warehouse_grn_v1';

const defaultGrnRecords: GrnRecord[] = [
  {
    id: 'grn-001',
    grnNumber: 'GRN-202609-001',
    materialType: 'raw',
    materialId: 'mat-001',
    materialCode: 'B0002',
    materialName: 'Calsium Carbonate',
    manufacturer: 'PT. Petrona Pacific Chemical',
    distributor: 'PT Kimia Farma Trading & Distribution',
    poNumber: 'PO-2026-0881',
    deliveryNoteNumber: 'SJ-88912',
    batchNumber: 'BN-2026-X81',
    receivedDate: '2026-09-03',
    expiryDate: '2028-09-03',
    quantityReceived: 500,
    unit: 'kg',
    containerCount: 20,
    containerType: 'Drum Fiber (Sealed)',
    storageLocation: 'Warehouse Karantina Bahan Baku (Rak K-01)',
    storageConditions: 'Suhu Ruang Terkendali (15 - 25°C)',
    qcStatus: 'QUARANTINE',
    qcParametersCount: 3,
    receivedBy: 'Staf Gudang Logistik',
    createdAt: new Date('2026-09-03T08:30:00Z').toISOString(),
  },
  {
    id: 'grn-002',
    grnNumber: 'GRN-202609-002',
    materialType: 'packaging',
    materialId: 'pack-001',
    materialCode: 'K0004',
    materialName: 'Pot Lem Putih 250 g',
    manufacturer: 'PD Surya Abadi',
    distributor: 'PD Surya Abadi',
    poNumber: 'PO-2026-0885',
    deliveryNoteNumber: 'SJ-99201',
    batchNumber: 'LOT-SA-2026-09',
    receivedDate: '2026-09-03',
    quantityReceived: 2500,
    unit: 'pcs',
    containerCount: 10,
    containerType: 'Karton Box (Double Plastic Wrap)',
    storageLocation: 'Warehouse Karantina Bahan Kemas (Area BK-01)',
    storageConditions: 'Suhu Ruang Terkendali (15 - 25°C)',
    qcStatus: 'QUARANTINE',
    qcParametersCount: 9,
    receivedBy: 'Staf Gudang Logistik',
    createdAt: new Date('2026-09-03T09:15:00Z').toISOString(),
  },
];

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
    const nextSeq = String(existing.length + 1).padStart(3, '0');
    const todayStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const grnNumber = `GRN-${todayStr}-${nextSeq}`;

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
