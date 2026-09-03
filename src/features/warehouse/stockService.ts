import {
  MaterialStockSummary,
  StockLotItem,
  StockMovementLedger,
  StockDeductionPayload,
  StockOpnamePayload,
  MaterialStockType,
} from './types/stockTypes';
import { GrnQcStatus } from './types/grnTypes';
import { warehouseService } from './warehouseService';
import { qualityService } from '../quality/qualityService';
import { materialService } from '../rnd/materials/materialService';
import { packagingService } from '../rnd/materials/packagingService';

const STOCK_LOTS_STORAGE_KEY = 'lsm_warehouse_stock_lots_v1';
const STOCK_LEDGER_STORAGE_KEY = 'lsm_warehouse_stock_ledger_v1';

export const stockService = {
  /**
   * Get all active stock lots and synchronize with latest GRNs and QC inspection states
   */
  getStockLots: async (): Promise<StockLotItem[]> => {
    let storedLots: StockLotItem[] = [];
    const saved = localStorage.getItem(STOCK_LOTS_STORAGE_KEY);
    if (saved) {
      try {
        storedLots = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stock lots from storage:', e);
      }
    }

    // Fetch GRNs and QC Reports
    const [grns, qcReports] = await Promise.all([
      warehouseService.getGrnRecords(),
      qualityService.getReports(),
    ]);

    let modified = false;

    // Synchronize each GRN
    grns.forEach((grn) => {
      const existingLot = storedLots.find((l) => l.grnId === grn.id || l.grnNumber === grn.grnNumber);
      const qcReport = qcReports.find((r) => r.grnId === grn.id || r.grnNumber === grn.grnNumber);

      // Determine QC status and Lot Internal Number
      let currentQcStatus: GrnQcStatus = grn.qcStatus || 'QUARANTINE';
      let lotInternal = '';
      let releasedDate: string | undefined;

      if (qcReport) {
        if (qcReport.status === 'PASSED' || qcReport.status === 'PASSED_WITH_DEVIATION') {
          currentQcStatus = 'RELEASED';
        } else if (qcReport.status === 'REJECTED') {
          currentQcStatus = 'REJECTED';
        } else {
          currentQcStatus = 'QUARANTINE';
        }
        if (qcReport.lotInternalNumber) {
          lotInternal = qcReport.lotInternalNumber;
        }
        if (qcReport.qmSignature?.signedAt) {
          releasedDate = qcReport.qmSignature.signedAt;
        }
      }

      if (!lotInternal) {
        const prefix = grn.materialType === 'raw' ? 'LBB' : 'LBK';
        const numPart = grn.grnNumber.replace(/[^0-9]/g, '').slice(-6) || '260901';
        lotInternal = `${prefix}${numPart}`;
      }

      if (!existingLot) {
        const newLot: StockLotItem = {
          id: `lot-${grn.id}`,
          lotInternalNumber: lotInternal,
          grnNumber: grn.grnNumber,
          grnId: grn.id,
          materialCode: grn.materialCode,
          materialName: grn.materialName,
          materialType: grn.materialType,
          batchNumberVendor: grn.batchNumber || 'N/A',
          manufacturer: grn.manufacturer,
          distributor: grn.distributor,
          receivedDate: grn.receivedDate,
          expiryDate: grn.expiryDate || '2028-09-03',
          initialQuantity: grn.quantityReceived,
          currentQuantity: grn.quantityReceived,
          unit: grn.unit,
          containerCount: grn.containerCount,
          containerType: grn.containerType,
          storageLocation: grn.storageLocation || (grn.materialType === 'raw' ? 'Rak BB-01 (Karantina)' : 'Area BK-01 (Karantina)'),
          qcStatus: currentQcStatus as any,
          qcReportId: qcReport?.id,
          releasedDate: releasedDate,
        };

        storedLots.push(newLot);
        modified = true;
      } else {
        // Update QC status if changed
        if (existingLot.qcStatus !== (currentQcStatus as any) || (lotInternal && existingLot.lotInternalNumber !== lotInternal)) {
          existingLot.qcStatus = currentQcStatus as any;
          if (lotInternal) existingLot.lotInternalNumber = lotInternal;
          if (releasedDate) existingLot.releasedDate = releasedDate;
          if (currentQcStatus === 'PASSED' || currentQcStatus === 'PASSED_WITH_DEVIATION' || currentQcStatus === 'RELEASED') {
            existingLot.qcStatus = 'RELEASED';
            if (existingLot.storageLocation.includes('Karantina')) {
              existingLot.storageLocation = existingLot.materialType === 'raw' ? 'Gudang Bahan Baku (Rak Rilis A-01)' : 'Gudang Bahan Kemas (Rak Rilis K-01)';
            }
          } else if (currentQcStatus === 'REJECTED') {
            existingLot.storageLocation = 'Area Reject & Retur Vendor (Ruang B)';
          }
          modified = true;
        }
      }
    });

    if (modified || !saved) {
      localStorage.setItem(STOCK_LOTS_STORAGE_KEY, JSON.stringify(storedLots));
    }

    return storedLots;
  },

  /**
   * Get Summaries for a specific material type ('raw' | 'packaging')
   */
  getStockSummaries: async (materialType: MaterialStockType): Promise<MaterialStockSummary[]> => {
    const lots = await stockService.getStockLots();

    if (materialType === 'raw') {
      const rawMaterials = await materialService.getMaterials();
      return rawMaterials.map((rm) => {
        const materialLots = lots.filter(
          (l) => l.materialType === 'raw' && (l.materialCode === rm.code || l.materialName.toLowerCase() === rm.name.toLowerCase())
        );

        let stockReleased = 0;
        let stockQuarantine = 0;
        let stockRejected = 0;

        materialLots.forEach((lot) => {
          if (lot.qcStatus === 'RELEASED' || lot.qcStatus === 'RELEASE_DEVIATION' || (lot.qcStatus as any) === 'PASSED') {
            stockReleased += lot.currentQuantity;
          } else if (lot.qcStatus === 'QUARANTINE' || (lot.qcStatus as any) === 'TESTING' || (lot.qcStatus as any) === 'AWAITING_APPROVAL') {
            stockQuarantine += lot.currentQuantity;
          } else if (lot.qcStatus === 'REJECTED') {
            stockRejected += lot.currentQuantity;
          }
        });

        const totalAccumulated = stockReleased + stockQuarantine + stockRejected;

        return {
          id: rm.id,
          materialCode: rm.code,
          materialName: rm.name,
          materialType: 'raw',
          category: rm.category || (rm.categories && rm.categories[0]) || 'Raw Material',
          storageLocation: 'Gudang Bahan Baku (Rak A)',
          storageConditions: rm.storageConditions || 'Suhu Ruang Terkendali (15 - 25°C)',
          unit: 'kg',
          stockReleased,
          stockQuarantine,
          stockRejected,
          totalAccumulated,
          minimumStock: 50,
          lots: materialLots,
        };
      });
    } else {
      const packagingMaterials = await packagingService.getPackagingMaterials();
      return packagingMaterials.map((pm) => {
        const materialLots = lots.filter(
          (l) => l.materialType === 'packaging' && (l.materialCode === pm.code || l.materialName.toLowerCase() === pm.name.toLowerCase())
        );

        let stockReleased = 0;
        let stockQuarantine = 0;
        let stockRejected = 0;

        materialLots.forEach((lot) => {
          if (lot.qcStatus === 'RELEASED' || lot.qcStatus === 'RELEASE_DEVIATION' || (lot.qcStatus as any) === 'PASSED') {
            stockReleased += lot.currentQuantity;
          } else if (lot.qcStatus === 'QUARANTINE' || (lot.qcStatus as any) === 'TESTING' || (lot.qcStatus as any) === 'AWAITING_APPROVAL') {
            stockQuarantine += lot.currentQuantity;
          } else if (lot.qcStatus === 'REJECTED') {
            stockRejected += lot.currentQuantity;
          }
        });

        const totalAccumulated = stockReleased + stockQuarantine + stockRejected;

        return {
          id: pm.id,
          materialCode: pm.code,
          materialName: pm.name,
          materialType: 'packaging',
          category: pm.type ? `${pm.type.toUpperCase()} PACKAGING` : 'Packaging',
          storageLocation: pm.storageLocation || 'Gudang Bahan Kemas (Area BK)',
          storageConditions: pm.storageConditions || 'Suhu Ruang Terkendali (15 - 25°C)',
          unit: pm.unit || 'pcs',
          stockReleased,
          stockQuarantine,
          stockRejected,
          totalAccumulated,
          minimumStock: 100,
          lots: materialLots,
        };
      });
    }
  },

  /**
   * Get Stock Ledger movement history
   */
  getMovementLedger: async (): Promise<StockMovementLedger[]> => {
    const saved = localStorage.getItem(STOCK_LEDGER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse movement ledger:', e);
      }
    }
    return [];
  },

  /**
   * Deduct stock for production work order / SPK
   */
  deductStock: async (payload: StockDeductionPayload): Promise<boolean> => {
    const lots = await stockService.getStockLots();
    const lotIndex = lots.findIndex((l) => l.lotInternalNumber === payload.lotInternalNumber);
    if (lotIndex === -1) {
      throw new Error(`Nomor Lot ${payload.lotInternalNumber} tidak ditemukan.`);
    }

    const lot = lots[lotIndex];
    if (lot.currentQuantity < payload.deductQuantity) {
      throw new Error(
        `Saldo stok tidak mencukupi! Tersedia: ${lot.currentQuantity} ${lot.unit}, Diminta: ${payload.deductQuantity} ${payload.unit}`
      );
    }

    const qtyBefore = lot.currentQuantity;
    const qtyChange = -payload.deductQuantity;
    const qtyAfter = qtyBefore + qtyChange;

    lot.currentQuantity = qtyAfter;
    lots[lotIndex] = lot;

    localStorage.setItem(STOCK_LOTS_STORAGE_KEY, JSON.stringify(lots));

    // Record in ledger
    const ledger = await stockService.getMovementLedger();
    const newLog: StockMovementLedger = {
      id: `led-${Date.now()}`,
      timestamp: new Date().toISOString(),
      materialCode: payload.materialCode,
      materialName: lot.materialName,
      materialType: lot.materialType,
      lotInternalNumber: payload.lotInternalNumber,
      movementType: 'OUT_PRODUCTION_SPK',
      referenceNumber: payload.spkNumber || `SPK-${Date.now().toString().slice(-4)}`,
      qtyBefore,
      qtyChange,
      qtyAfter,
      unit: payload.unit,
      performer: {
        name: payload.performerName || 'Operator Timbang',
        role: 'Operator Penimbangan',
        department: 'Warehouse / Produksi',
      },
      notes: payload.notes || `Pengeluaran bahan untuk batch ${payload.batchTarget}`,
    };

    ledger.unshift(newLog);
    localStorage.setItem(STOCK_LEDGER_STORAGE_KEY, JSON.stringify(ledger));
    return true;
  },

  /**
   * Adjust stock via Stock Opname
   * If lotInternalNumber is not provided or set to auto STK, generate STK-YYMMDD lot
   * set to oldest date (2000-01-01) so FEFO/FIFO prioritizes consuming it first.
   */
  adjustStockOpname: async (payload: StockOpnamePayload): Promise<boolean> => {
    const lots = await stockService.getStockLots();
    const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // e.g. 260903
    const defaultStkLotName = `STK-${todayStr}`;

    let targetLotNumber = payload.lotInternalNumber?.trim();
    if (!targetLotNumber || targetLotNumber === 'AUTO' || targetLotNumber === 'STK') {
      targetLotNumber = defaultStkLotName;
    }

    let lotIndex = lots.findIndex(
      (l) => l.materialCode === payload.materialCode && l.lotInternalNumber === targetLotNumber
    );

    let lot: StockLotItem;
    let qtyBefore = 0;

    if (lotIndex !== -1) {
      lot = lots[lotIndex];
      qtyBefore = lot.currentQuantity;
      lot.currentQuantity = payload.actualQuantity;
      lots[lotIndex] = lot;
    } else {
      // Create new Stock Opname Lot (STK-YYMMDD)
      // Set receivedDate and expiryDate to earliest historical date so it's treated as oldest lot
      const isRaw = payload.materialCode.startsWith('B');
      lot = {
        id: `lot-opname-${payload.materialCode}-${Date.now()}`,
        lotInternalNumber: targetLotNumber,
        grnNumber: `GRN-OPNAME-${todayStr}`,
        grnId: `grn-opname-${Date.now()}`,
        materialCode: payload.materialCode,
        materialName: payload.materialCode, // will be matched
        materialType: isRaw ? 'raw' : 'packaging',
        batchNumberVendor: 'STK-OPNAME',
        manufacturer: 'Stock Opname Adjustment',
        distributor: 'Internal',
        receivedDate: '2000-01-01', // Oldest date
        expiryDate: '2000-01-01',   // Oldest date so FEFO consumes it first!
        initialQuantity: payload.actualQuantity,
        currentQuantity: payload.actualQuantity,
        unit: payload.unit || 'kg',
        containerCount: 1,
        containerType: 'Koli',
        storageLocation: isRaw ? 'Gudang Utama BB (Penyesuaian Opname)' : 'Gudang Utama BK (Penyesuaian Opname)',
        qcStatus: 'RELEASED',
        releasedDate: new Date().toISOString(),
      };
      lots.unshift(lot);
    }

    localStorage.setItem(STOCK_LOTS_STORAGE_KEY, JSON.stringify(lots));

    const qtyAfter = payload.actualQuantity;
    const qtyChange = qtyAfter - qtyBefore;

    // Record in ledger
    const ledger = await stockService.getMovementLedger();
    const newLog: StockMovementLedger = {
      id: `led-opn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      materialCode: payload.materialCode,
      materialName: lot.materialName,
      materialType: lot.materialType,
      lotInternalNumber: targetLotNumber,
      movementType: 'OPNAME_ADJUSTMENT',
      referenceNumber: `OPNAME-${todayStr}`,
      qtyBefore,
      qtyChange,
      qtyAfter,
      unit: payload.unit,
      performer: {
        name: payload.auditorName || 'Auditor Gudang',
        role: 'Auditor Stock Opname',
        department: 'Warehouse / QA',
      },
      notes: `Penyesuaian Fisik Opname: ${payload.reason}`,
    };

    ledger.unshift(newLog);
    localStorage.setItem(STOCK_LEDGER_STORAGE_KEY, JSON.stringify(ledger));
    return true;
  },

  /**
   * Batch adjust stock opname from Excel rows
   */
  batchAdjustStockOpname: async (
    items: Array<{
      materialCode: string;
      actualQuantity: number;
      reason?: string;
      unit?: string;
    }>,
    auditorName: string = 'Auditor Excel Opname'
  ): Promise<{ successCount: number; errors: string[] }> => {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        if (!item.materialCode) continue;
        await stockService.adjustStockOpname({
          materialCode: item.materialCode.trim(),
          actualQuantity: item.actualQuantity,
          reason: item.reason || 'Impor Batch Stock Opname Excel',
          unit: item.unit || 'kg',
          auditorName,
        });
        successCount++;
      } catch (err: any) {
        errors.push(`Material ${item.materialCode}: ${err.message}`);
      }
    }

    return { successCount, errors };
  },

  /**
   * Batch deduct stock from Excel rows
   */
  batchDeductStock: async (
    items: Array<{
      materialCode: string;
      lotInternalNumber?: string;
      deductQuantity: number;
      spkNumber?: string;
      batchTarget?: string;
      notes?: string;
      unit?: string;
    }>,
    performerName: string = 'Operator Excel Deduct'
  ): Promise<{ successCount: number; errors: string[] }> => {
    let successCount = 0;
    const errors: string[] = [];
    const lots = await stockService.getStockLots();

    for (const item of items) {
      try {
        if (!item.materialCode || !item.deductQuantity) continue;

        let lotNum = item.lotInternalNumber?.trim();
        if (!lotNum) {
          // Pick oldest released lot for this material (FEFO/FIFO)
          const available = lots
            .filter(
              (l) =>
                l.materialCode === item.materialCode &&
                (l.qcStatus === 'RELEASED' || (l.qcStatus as any) === 'PASSED') &&
                l.currentQuantity > 0
            )
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

          if (available.length === 0) {
            errors.push(`Material ${item.materialCode}: Tidak ada stok rilis yang tersedia.`);
            continue;
          }
          lotNum = available[0].lotInternalNumber;
        }

        await stockService.deductStock({
          materialCode: item.materialCode.trim(),
          lotInternalNumber: lotNum,
          deductQuantity: item.deductQuantity,
          unit: item.unit || 'kg',
          spkNumber: item.spkNumber || 'SPK-BATCH-EXCEL',
          batchTarget: item.batchTarget || 'BATCH-PROD-EXCEL',
          performerName,
          notes: item.notes || 'Potong stok batch dari Excel',
        });
        successCount++;
      } catch (err: any) {
        errors.push(`Material ${item.materialCode}: ${err.message}`);
      }
    }

    return { successCount, errors };
  },

  /**
   * Defined Warehouse Storage Zones & Boundaries (CPKB Standard)
   */
  getWarehouseStorageZones: () => ({
    raw: [
      'Gudang Utama BB - Rak A1 (Zat Aktif)',
      'Gudang Utama BB - Rak A2 (Emulgator & Pelarut)',
      'Gudang Utama BB - Rak A3 (Surfactant & Base)',
      'Gudang Utama BB - Rak A4 (Fragrance & Oil)',
      'Gudang Ruang Dingin BB (Chiller 2-8°C - Temp Control)',
      'Warehouse Karantina Bahan Baku (Rak K-01)',
    ],
    packaging: [
      'Gudang Utama BK - Rak B1 (Botol & Pot)',
      'Gudang Utama BK - Rak B2 (Tutup & Pump/Sprayer)',
      'Gudang Utama BK - Rak B3 (Label Sticker & Shrink)',
      'Gudang Utama BK - Rak B4 (Karton Box & Inner)',
      'Warehouse Karantina Bahan Kemas (Area BK-01)',
    ],
    special: [
      'Area Reject & Retur Vendor (Ruang B)',
      'Gudang Transit Karantina Sementara',
    ],
  }),

  /**
   * Validate if a new location string is within defined warehouse boundaries
   */
  validateWarehouseBoundary: (locationString: string): { isValid: boolean; errorMessage?: string } => {
    if (!locationString || !locationString.trim()) {
      return { isValid: false, errorMessage: 'Lokasi penyimpanan baru tidak boleh kosong.' };
    }

    const locLower = locationString.toLowerCase().trim();
    const validKeywords = [
      'gudang',
      'rak',
      'chiller',
      'ruang',
      'karantina',
      'pallet',
      'zone',
      'area',
      'posisi',
      'penyimpanan',
    ];

    const hasValidKeyword = validKeywords.some((keyword) => locLower.includes(keyword));

    if (!hasValidKeyword) {
      return {
        isValid: false,
        errorMessage:
          'Lokasi baru berada di luar batas area gudang yang sah. Lokasi harus berada di dalam batas resmi (Gudang Utama BB, Gudang Utama BK, Rak A/B/K, Chiller, Karantina, atau Area Reject).',
      };
    }

    return { isValid: true };
  },

  /**
   * Relocate stock lot to new rack / location with boundary validation & movement tracking
   */
  relocateStockLot: async (payload: {
    lotInternalNumber: string;
    newLocation: string;
    performerName: string;
    notes?: string;
  }): Promise<StockLotItem> => {
    // 1. Boundary Validation
    const boundaryCheck = stockService.validateWarehouseBoundary(payload.newLocation);
    if (!boundaryCheck.isValid) {
      throw new Error(boundaryCheck.errorMessage);
    }

    const lots = await stockService.getStockLots();
    const lotIndex = lots.findIndex((l) => l.lotInternalNumber === payload.lotInternalNumber);

    if (lotIndex === -1) {
      throw new Error(`Nomor Lot ${payload.lotInternalNumber} tidak ditemukan di sistem.`);
    }

    const lot = lots[lotIndex];
    const prevLocation = lot.storageLocation || 'Warehouse Karantina';
    const cleanNewLoc = payload.newLocation.trim();

    if (prevLocation === cleanNewLoc) {
      throw new Error(`Lokasi baru sama dengan lokasi saat ini (${prevLocation}). Silakan pilih lokasi yang berbeda.`);
    }

    // Update Lot
    lot.storageLocation = cleanNewLoc;
    lots[lotIndex] = lot;
    localStorage.setItem(STOCK_LOTS_STORAGE_KEY, JSON.stringify(lots));

    // Sync to Warehouse GRN record if matching
    try {
      const grns = await warehouseService.getGrnRecords();
      const grnTarget = grns.find((g) => g.id === lot.grnId || g.grnNumber === lot.grnNumber);
      if (grnTarget) {
        grnTarget.storageLocation = cleanNewLoc;
        localStorage.setItem('lsm_warehouse_grn_v1', JSON.stringify(grns));
      }
    } catch (e) {
      console.warn('Failed to sync location to GRN record:', e);
    }

    // Record in movement ledger
    const ledger = await stockService.getMovementLedger();
    const newLog: StockMovementLedger = {
      id: `led-reloc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      materialCode: lot.materialCode,
      materialName: lot.materialName,
      materialType: lot.materialType,
      lotInternalNumber: lot.lotInternalNumber,
      movementType: 'LOCATION_RELOCATION',
      referenceNumber: `RELOC-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`,
      qtyBefore: lot.currentQuantity,
      qtyChange: 0,
      qtyAfter: lot.currentQuantity,
      unit: lot.unit,
      performer: {
        name: payload.performerName || 'Staf Logistik Gudang',
        role: 'Petugas Relokasi Rak',
        department: 'Warehouse & Logistik',
      },
      notes: `Pemindahan Lokasi Simpan: [${prevLocation}] ➔ [${cleanNewLoc}]. ${payload.notes ? `Catatan: ${payload.notes}` : ''}`,
    };

    ledger.unshift(newLog);
    localStorage.setItem(STOCK_LEDGER_STORAGE_KEY, JSON.stringify(ledger));

    return lot;
  },
};
