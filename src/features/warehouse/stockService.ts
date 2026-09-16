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
import { normalizeLotNumber } from '../quality/utils/qcNumbering';

export const stockService = {
  /**
   * Get all active stock lots and synchronize with latest GRNs and QC inspection states
   */
  getStockLots: async (): Promise<StockLotItem[]> => {
    // Fetch GRNs and QC Reports
    const [grns, qcReports] = await Promise.all([
      warehouseService.getGrnRecords(),
      qualityService.getReports(),
    ]);

    const storedLots: StockLotItem[] = grns.map((grn) => {
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
          lotInternal = normalizeLotNumber(qcReport.lotInternalNumber);
        }
        if (qcReport.qmSignature?.signedAt) {
          releasedDate = qcReport.qmSignature.signedAt;
        }
      }

      if (!lotInternal) {
        const prefix = grn.materialType === 'raw' ? 'LBB' : 'LBK';
        const numPart = grn.grnNumber.replace(/[^0-9]/g, '').slice(-6) || '260901';
        lotInternal = normalizeLotNumber(`${prefix}${numPart}`);
      }

      const initialQty = grn.quantityReceived;
      // Extract current quantity from qcPayload if available, else fallback to initial
      const currentQty = grn.qcPayload?.currentQuantity !== undefined
        ? grn.qcPayload.currentQuantity
        : initialQty;

      // Determine storage location based on state and grn record
      let storageLocation = grn.storageLocation;
      if (!storageLocation) {
        if (currentQcStatus === 'RELEASED') {
          storageLocation = grn.materialType === 'raw' ? 'Gudang Bahan Baku (Rak Rilis A-01)' : 'Gudang Bahan Kemas (Rak Rilis K-01)';
        } else if (currentQcStatus === 'REJECTED') {
          storageLocation = 'Area Reject & Retur Vendor (Ruang B)';
        } else {
          storageLocation = grn.materialType === 'raw' ? 'Rak BB-01 (Karantina)' : 'Area BK-01 (Karantina)';
        }
      }

      return {
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
        initialQuantity: initialQty,
        currentQuantity: currentQty,
        unit: grn.unit,
        containerCount: grn.containerCount,
        containerType: grn.containerType,
        storageLocation: storageLocation,
        qcStatus: currentQcStatus as any,
        qcReportId: qcReport?.id,
        releasedDate: releasedDate,
      };
    });

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
          minimumStock: rm.reorderPoint ?? 50,
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
          minimumStock: pm.reorderPoint ?? 100,
          lots: materialLots,
        };
      });
    }
  },

  /**
   * Get Stock Ledger movement history
   */
  getMovementLedger: async (): Promise<StockMovementLedger[]> => {
    const grns = await warehouseService.getGrnRecords();
    const ledger: StockMovementLedger[] = [];
    grns.forEach((grn) => {
      if (grn.qcPayload?.stockLedger && Array.isArray(grn.qcPayload.stockLedger)) {
        ledger.push(...grn.qcPayload.stockLedger);
      }
    });
    return ledger.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  /**
   * Deduct stock for production work order / SPK
   */
  deductStock: async (payload: StockDeductionPayload): Promise<boolean> => {
    const grns = await warehouseService.getGrnRecords();
    const targetLotNormalized = normalizeLotNumber(payload.lotInternalNumber);
    const targetGrn = grns.find((g) => {
      const qcReport = g.qcPayload;
      const lotInternal = qcReport?.lotInternalNumber || g.internalLotNumber;
      return (
        lotInternal === payload.lotInternalNumber ||
        (lotInternal && normalizeLotNumber(lotInternal) === targetLotNormalized)
      );
    });

    if (!targetGrn) {
      throw new Error(`Nomor Lot ${payload.lotInternalNumber} tidak ditemukan.`);
    }

    const currentQty = targetGrn.qcPayload?.currentQuantity !== undefined
      ? targetGrn.qcPayload.currentQuantity
      : targetGrn.quantityReceived;

    if (currentQty < payload.deductQuantity) {
      throw new Error(
        `Saldo stok tidak mencukupi! Tersedia: ${currentQty} ${targetGrn.unit}, Diminta: ${payload.deductQuantity} ${payload.unit}`
      );
    }

    const qtyBefore = currentQty;
    const qtyChange = -payload.deductQuantity;
    const qtyAfter = qtyBefore + qtyChange;

    const newLog: StockMovementLedger = {
      id: `led-${Date.now()}`,
      timestamp: new Date().toISOString(),
      materialCode: payload.materialCode,
      materialName: targetGrn.materialName,
      materialType: targetGrn.materialType,
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

    const existingQcPayload = targetGrn.qcPayload || { status: targetGrn.qcStatus || 'QUARANTINE' };
    const updatedQcPayload = {
      ...existingQcPayload,
      currentQuantity: qtyAfter,
      stockLedger: [newLog, ...(existingQcPayload.stockLedger || [])],
    };

    await warehouseService.updateGrnRecord(targetGrn.id, {
      qcPayload: updatedQcPayload,
    });

    return true;
  },

  /**
   * Adjust stock via Stock Opname
   */
  adjustStockOpname: async (payload: StockOpnamePayload): Promise<boolean> => {
    const grns = await warehouseService.getGrnRecords();
    const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // e.g. 260903
    const defaultStkLotName = `STK-${todayStr}`;

    let targetLotNumber = payload.lotInternalNumber?.trim();
    if (!targetLotNumber || targetLotNumber === 'AUTO' || targetLotNumber === 'STK') {
      targetLotNumber = defaultStkLotName;
    }

    const targetLotNormalized = normalizeLotNumber(targetLotNumber);
    let targetGrn = grns.find((g) => {
      const qcReport = g.qcPayload;
      const lotInternal = qcReport?.lotInternalNumber || g.internalLotNumber;
      return (
        g.materialCode === payload.materialCode &&
        (lotInternal === targetLotNumber ||
          (lotInternal && normalizeLotNumber(lotInternal) === targetLotNormalized))
      );
    });

    let qtyBefore = 0;
    let materialName = payload.materialCode;
    let materialType: 'raw' | 'packaging' = payload.materialCode.startsWith('B') ? 'raw' : 'packaging';

    if (targetGrn) {
      qtyBefore = targetGrn.qcPayload?.currentQuantity !== undefined
        ? targetGrn.qcPayload.currentQuantity
        : targetGrn.quantityReceived;
      materialName = targetGrn.materialName;
      materialType = targetGrn.materialType;

      const qtyAfter = payload.actualQuantity;
      const qtyChange = qtyAfter - qtyBefore;

      const newLog: StockMovementLedger = {
        id: `led-opn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        materialCode: payload.materialCode,
        materialName,
        materialType,
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

      const existingQcPayload = targetGrn.qcPayload || { status: targetGrn.qcStatus || 'QUARANTINE' };
      const updatedQcPayload = {
        ...existingQcPayload,
        currentQuantity: qtyAfter,
        stockLedger: [newLog, ...(existingQcPayload.stockLedger || [])],
      };

      await warehouseService.updateGrnRecord(targetGrn.id, {
        qcPayload: updatedQcPayload,
      });
    } else {
      // Create new virtual GRN for stock opname
      const qtyAfter = payload.actualQuantity;
      const qtyChange = qtyAfter - qtyBefore;

      const newLog: StockMovementLedger = {
        id: `led-opn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        materialCode: payload.materialCode,
        materialName,
        materialType,
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
        notes: `Penyesuaian Fisik Opname (Lot Baru): ${payload.reason}`,
      };

      const virtualGrn = {
        id: `grn-opname-${Date.now()}`,
        grnNumber: `GRN-OPNAME-${todayStr}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        receivedDate: new Date().toISOString().slice(0, 10),
        materialCode: payload.materialCode,
        materialName: payload.materialCode,
        materialType: materialType,
        quantityReceived: payload.actualQuantity,
        unit: payload.unit || 'kg',
        containerCount: 1,
        containerType: 'Koli',
        storageLocation: materialType === 'raw' ? 'Gudang Utama BB (Penyesuaian Opname)' : 'Gudang Utama BK (Penyesuaian Opname)',
        qcStatus: 'RELEASED',
        internalLotNumber: targetLotNumber,
        batchNumber: 'STK-OPNAME',
        manufacturer: 'Stock Opname Adjustment',
        distributor: 'Internal',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        qcPayload: {
          status: 'RELEASED',
          lotInternalNumber: targetLotNumber,
          currentQuantity: payload.actualQuantity,
          stockLedger: [newLog],
        }
      };

      await warehouseService.saveGrnRecord(virtualGrn as any);
    }

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

    const grns = await warehouseService.getGrnRecords();
    const targetLotNormalized = normalizeLotNumber(payload.lotInternalNumber);
    const grnTarget = grns.find((g) => {
      const qcReport = g.qcPayload;
      const lotInternal = qcReport?.lotInternalNumber || g.internalLotNumber;
      return (
        lotInternal === payload.lotInternalNumber ||
        (lotInternal && normalizeLotNumber(lotInternal) === targetLotNormalized)
      );
    });

    if (!grnTarget) {
      throw new Error(`Nomor Lot ${payload.lotInternalNumber} tidak ditemukan di sistem.`);
    }

    const prevLocation = grnTarget.storageLocation || 'Warehouse Karantina';
    const cleanNewLoc = payload.newLocation.trim();

    if (prevLocation === cleanNewLoc) {
      throw new Error(`Lokasi baru sama dengan lokasi saat ini (${prevLocation}). Silakan pilih lokasi yang berbeda.`);
    }

    const currentQty = grnTarget.qcPayload?.currentQuantity !== undefined
      ? grnTarget.qcPayload.currentQuantity
      : grnTarget.quantityReceived;

    // Record in movement ledger
    const newLog: StockMovementLedger = {
      id: `led-reloc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      materialCode: grnTarget.materialCode,
      materialName: grnTarget.materialName,
      materialType: grnTarget.materialType,
      lotInternalNumber: payload.lotInternalNumber,
      movementType: 'LOCATION_RELOCATION',
      referenceNumber: `RELOC-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`,
      qtyBefore: currentQty,
      qtyChange: 0,
      qtyAfter: currentQty,
      unit: grnTarget.unit,
      performer: {
        name: payload.performerName || 'Staf Logistik Gudang',
        role: 'Petugas Relokasi Rak',
        department: 'Warehouse & Logistik',
      },
      notes: `Pemindahan Lokasi Simpan: [${prevLocation}] ➔ [${cleanNewLoc}]. ${payload.notes ? `Catatan: ${payload.notes}` : ''}`,
    };

    const existingQcPayload = grnTarget.qcPayload || { status: grnTarget.qcStatus || 'QUARANTINE' };
    const updatedQcPayload = {
      ...existingQcPayload,
      stockLedger: [newLog, ...(existingQcPayload.stockLedger || [])],
    };

    await warehouseService.updateGrnRecord(grnTarget.id, {
      storageLocation: cleanNewLoc,
      qcPayload: updatedQcPayload,
    });

    // Construct and return the updated lot
    const updatedLots = await stockService.getStockLots();
    const updatedLot = updatedLots.find((l) => l.lotInternalNumber === payload.lotInternalNumber);
    if (!updatedLot) {
      throw new Error('Gagal memuat ulang data lot setelah relokasi.');
    }
    return updatedLot;
  },

  /**
   * Service layer function that monitors current inventory levels against defined Reorder Points (ROP)
   * for both raw materials and packaging materials.
   */
  checkReorderPoints: async (): Promise<RopAlertItem[]> => {
    const [rawSummaries, pkgSummaries] = await Promise.all([
      stockService.getStockSummaries('raw'),
      stockService.getStockSummaries('packaging'),
    ]);

    const alerts: RopAlertItem[] = [];

    // Evaluate Raw Materials ROP (Default ROP / Safety Threshold = 50 kg or custom)
    for (const raw of rawSummaries) {
      const rop = raw.minimumStock || 50;
      if (raw.stockReleased <= rop) {
        alerts.push({
          id: `rop-raw-${raw.materialCode}`,
          materialCode: raw.materialCode,
          materialName: raw.materialName,
          materialType: 'raw',
          currentStock: raw.stockReleased,
          reorderPoint: rop,
          unit: raw.unit || 'kg',
          urgency: raw.stockReleased === 0 ? 'critical' : 'warning',
          suggestedReorderQty: Math.max(100, rop * 2 - raw.stockReleased),
        });
      }
    }

    // Evaluate Packaging Materials ROP (Default ROP / Safety Threshold = 100 pcs or custom)
    for (const pkg of pkgSummaries) {
      const rop = pkg.minimumStock || 100;
      if (pkg.stockReleased <= rop) {
        alerts.push({
          id: `rop-pkg-${pkg.materialCode}`,
          materialCode: pkg.materialCode,
          materialName: pkg.materialName,
          materialType: 'packaging',
          currentStock: pkg.stockReleased,
          reorderPoint: rop,
          unit: pkg.unit || 'pcs',
          urgency: pkg.stockReleased === 0 ? 'critical' : 'warning',
          suggestedReorderQty: Math.max(500, rop * 2 - pkg.stockReleased),
        });
      }
    }

    return alerts;
  },
};

export interface RopAlertItem {
  id: string;
  materialCode: string;
  materialName: string;
  materialType: 'raw' | 'packaging';
  currentStock: number;
  reorderPoint: number;
  unit: string;
  urgency: 'critical' | 'warning';
  suggestedReorderQty: number;
}

