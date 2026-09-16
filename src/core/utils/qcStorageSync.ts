import { QcInspectionReport, QcInspectionStatus } from '../../features/quality/types/qcTypes';
import { GrnRecord } from '../../features/warehouse/types/grnTypes';
import { supabase, isSupabaseConfigured } from '../auth/supabaseClient';

const QC_TAG_START = '<!--QC_PAYLOAD_START-->';
const QC_TAG_END = '<!--QC_PAYLOAD_END-->';

export interface SerializedQcPayload {
  lotInternalNumber?: string;
  reportNumber?: string;
  status: QcInspectionStatus;
  parameters?: any[];
  staffDecision?: 'RELEASE' | 'REJECT';
  staffNotes?: string;
  staffSignature?: any;
  qmDecision?: 'RELEASE' | 'RELEASE_BY_DEVIATION' | 'REJECT';
  qmDeviationNumber?: string;
  qmNotes?: string;
  qmSignature?: any;
  aiAssessment?: any;
  actualSampleSize?: number;
  actualSampleUnit?: string;
  sampledContainers?: string;
  sampledBy?: string;
  samplingDateTime?: string;
  retestDate?: string;
  updatedAt?: string;
}

/**
 * Packs user notes together with serializable QC report metadata into a single safe TEXT string.
 */
export function packGrnNotes(userNotes?: string | null, qcReport?: Partial<QcInspectionReport> | null): string {
  const cleanUserText = (userNotes || '')
    .replace(/<!--QC_PAYLOAD_START-->[\s\S]*?<!--QC_PAYLOAD_END-->/g, '')
    .trim();

  if (!qcReport) return cleanUserText;

  const payload: SerializedQcPayload = {
    lotInternalNumber: qcReport.lotInternalNumber,
    reportNumber: qcReport.reportNumber || qcReport.lotInternalNumber,
    status: qcReport.status || 'QUARANTINE',
    parameters: qcReport.parameters,
    staffDecision: qcReport.staffDecision,
    staffNotes: qcReport.staffNotes,
    staffSignature: qcReport.staffSignature,
    qmDecision: qcReport.qmDecision,
    qmDeviationNumber: qcReport.qmDeviationNumber,
    qmNotes: qcReport.qmNotes,
    qmSignature: qcReport.qmSignature,
    aiAssessment: qcReport.aiAssessment,
    actualSampleSize: qcReport.actualSampleSize,
    actualSampleUnit: qcReport.actualSampleUnit,
    sampledContainers: qcReport.sampledContainers,
    sampledBy: qcReport.sampledBy,
    samplingDateTime: qcReport.samplingDateTime,
    retestDate: qcReport.retestDate,
    updatedAt: qcReport.updatedAt || new Date().toISOString(),
  };

  const json = JSON.stringify(payload);
  const tag = `${QC_TAG_START}${json}${QC_TAG_END}`;

  return cleanUserText ? `${cleanUserText}\n${tag}` : tag;
}

/**
 * Unpacks user notes and QC payload from raw string.
 */
export function unpackGrnNotes(rawNotes?: string | null): { userNotes: string; qcPayload: SerializedQcPayload | null } {
  if (!rawNotes) return { userNotes: '', qcPayload: null };

  const match = rawNotes.match(/<!--QC_PAYLOAD_START-->([\s\S]*?)<!--QC_PAYLOAD_END-->/);
  let qcPayload: SerializedQcPayload | null = null;
  if (match && match[1]) {
    try {
      qcPayload = JSON.parse(match[1]);
    } catch (e) {
      console.warn('Failed to parse QC payload from notes string:', e);
    }
  }

  const userNotes = rawNotes.replace(/<!--QC_PAYLOAD_START-->[\s\S]*?<!--QC_PAYLOAD_END-->/g, '').trim();
  return { userNotes, qcPayload };
}

/**
 * Syncs a QC report directly to Supabase warehouse_grn row.
 * Updates qc_status, internal_lot_number, and packs the QC report payload into notes.
 */
export async function syncQcReportToSupabase(
  report: QcInspectionReport,
  existingUserNotes?: string | null
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }

  try {
    // 1. Fetch current remote row to avoid overwriting concurrent edits
    const { data: remoteRow, error: fetchErr } = await supabase
      .from('warehouse_grn')
      .select('id, grn_number, notes, internal_lot_number')
      .or(`id.eq.${report.grnId},grn_number.eq.${report.grnNumber}`)
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.warn('[syncQcReportToSupabase] Fetch remote row error:', fetchErr);
    }

    const currentNotes = remoteRow?.notes || existingUserNotes || '';
    const { userNotes } = unpackGrnNotes(currentNotes);
    const packedNotes = packGrnNotes(userNotes, report);

    const updatePayload: Record<string, any> = {
      qc_status: report.status,
      internal_lot_number: report.lotInternalNumber || remoteRow?.internal_lot_number || null,
      notes: packedNotes,
      updated_at: new Date().toISOString(),
    };

    if (report.retestDate) {
      updatePayload.retest_date = report.retestDate;
    }

    const targetId = remoteRow?.id || report.grnId;
    const { error: updateErr } = await supabase
      .from('warehouse_grn')
      .update(updatePayload)
      .eq('id', targetId);

    if (updateErr) {
      console.warn('[syncQcReportToSupabase] Update Supabase error:', updateErr);
      return false;
    }

    return true;
  } catch (e) {
    console.error('[syncQcReportToSupabase] Exception syncing report:', e);
    return false;
  }
}
