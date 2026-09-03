export type GrnMaterialType = 'raw' | 'packaging';

export type GrnQcStatus = 'QUARANTINE' | 'PASSED' | 'REJECTED';

export interface GrnRecord {
  id: string;
  grnNumber: string; // Format: GRN-YYYYMM-XXXX
  materialType: GrnMaterialType;
  materialId: string;
  materialCode: string; // B0001, K0001 dst
  materialName: string;
  manufacturer: string;
  distributor: string;
  poNumber: string;
  deliveryNoteNumber: string;
  batchNumber?: string;
  receivedDate: string;
  expiryDate?: string;
  quantityReceived: number;
  unit: string;
  containerCount: number;
  containerType: string;
  storageLocation: string;
  storageConditions: string;
  qcStatus: GrnQcStatus;
  qcParametersCount?: number;
  receivedBy: string;
  createdAt: string;
  notes?: string;
}

export interface GrnStats {
  totalIncoming: number;
  inQuarantine: number;
  passedQC: number;
  rejectedQC: number;
  rawMaterialsCount: number;
  packagingCount: number;
}
