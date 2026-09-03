import { GrnMaterialType } from '../../warehouse/types/grnTypes';
import { QcInspectionReport } from '../types/qcTypes';

/**
 * Generate Internal Lot / Inspection Report Number
 * Format: L + {BB/BK} + {YY} + {MM} + {XXX}
 * Example: LBB2609001, LBK2609001
 * Resets sequence to 001 every new month.
 */
export const generateLotInternalNumber = (
  materialType: GrnMaterialType,
  existingReports: QcInspectionReport[],
  customDate?: string
): string => {
  const targetDate = customDate ? new Date(customDate) : new Date();
  const yearFull = targetDate.getFullYear().toString();
  const yy = yearFull.slice(2);
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  
  const typeCode = materialType === 'raw' ? 'BB' : 'BK';
  const prefix = `L${typeCode}${yy}${mm}`;

  // Find all existing reports that match this prefix
  let maxSeq = 0;
  existingReports.forEach((report) => {
    const lotNo = report.lotInternalNumber || report.reportNumber;
    if (lotNo && lotNo.startsWith(prefix)) {
      const seqStr = lotNo.slice(prefix.length);
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
};

/**
 * Generate SHA-256 like simulation digital signature hash
 */
export const generateDigitalSignatureHash = (
  nik: string,
  name: string,
  action: string,
  docNumber: string
): string => {
  const payload = `${nik}-${name}-${action}-${docNumber}-${Date.now()}-${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const randHex = Math.random().toString(16).substring(2, 10);
  return `SIG-${hex.toUpperCase()}-${randHex.toUpperCase()}`;
};
