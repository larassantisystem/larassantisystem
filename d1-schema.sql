-- ========================================================================
-- CLOUDFLARE D1 DATABASE SCHEMA
-- Sistem Operasional CPKB & ERP Mutu (PT. Larassanti Makmur Sejahtera)
-- Zero Egress Bandwidth Fees - Optimized for Cloudflare D1 (SQLite Edge)
-- ========================================================================

-- 1. TABEL PENERIMAAN GUDANG (WAREHOUSE GRN)
CREATE TABLE IF NOT EXISTS warehouse_grn (
  id TEXT PRIMARY KEY,
  grn_number TEXT UNIQUE NOT NULL,
  material_type TEXT NOT NULL, -- 'raw' | 'packaging'
  material_id TEXT,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  manufacturer TEXT DEFAULT '-',
  distributor TEXT DEFAULT '-',
  delivery_note_number TEXT DEFAULT '-',
  purchase_order_number TEXT DEFAULT '-',
  po_number TEXT DEFAULT '-',
  supplier_batch_number TEXT DEFAULT '-',
  batch_number TEXT DEFAULT '-',
  internal_lot_number TEXT,
  received_date TEXT NOT NULL,
  expiration_date TEXT,
  expiry_date TEXT,
  retest_date TEXT,
  quantity_received REAL NOT NULL DEFAULT 0,
  current_quantity REAL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  container_count INTEGER DEFAULT 1,
  container_type TEXT DEFAULT 'Drum / Zak',
  storage_location TEXT DEFAULT 'Gudang Karantina',
  storage_conditions TEXT,
  qc_status TEXT NOT NULL DEFAULT 'QUARANTINE', -- 'QUARANTINE' | 'QUALITY_CONTROL_PROCESS' | 'AWAITING_QM_AUTHORIZATION' | 'PASSED' | 'PASSED_WITH_DEVIATION' | 'RELEASED' | 'REJECTED' | 'REVERTED_TO_WAREHOUSE'
  qc_parameters_count INTEGER DEFAULT 0,
  seal_condition TEXT,
  packaging_condition TEXT,
  coa_attachment TEXT,
  received_by TEXT DEFAULT 'Staf Gudang',
  notes TEXT,
  revert_reason TEXT,
  reverted_by TEXT,
  reverted_at TEXT,
  actual_sample_size REAL,
  actual_sample_unit TEXT,
  sampled_containers TEXT,
  sampled_by TEXT,
  sampling_date_time TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_grn_number ON warehouse_grn(grn_number);
CREATE INDEX IF NOT EXISTS idx_grn_material_code ON warehouse_grn(material_code);
CREATE INDEX IF NOT EXISTS idx_grn_material_type ON warehouse_grn(material_type);
CREATE INDEX IF NOT EXISTS idx_grn_qc_status ON warehouse_grn(qc_status);
CREATE INDEX IF NOT EXISTS idx_grn_internal_lot ON warehouse_grn(internal_lot_number);
CREATE INDEX IF NOT EXISTS idx_grn_created_at ON warehouse_grn(created_at);

-- 2. TABEL LAPORAN PENGAWASAN MUTU (QC INSPECTION REPORTS)
CREATE TABLE IF NOT EXISTS qc_inspection_reports (
  id TEXT PRIMARY KEY,
  grn_id TEXT,
  grn_number TEXT NOT NULL,
  report_number TEXT,
  lot_internal_number TEXT NOT NULL,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL,
  batch_number TEXT,
  quantity_received REAL DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  container_count INTEGER DEFAULT 1,
  container_type TEXT DEFAULT 'Drum / Zak',
  manufacturer TEXT,
  distributor TEXT,
  received_date TEXT,
  expiry_date TEXT,
  retest_date TEXT,
  storage_conditions TEXT,
  status TEXT NOT NULL DEFAULT 'QUARANTINE',
  decision TEXT,
  parameters_json TEXT, -- JSON Array of QC Parameters & test results
  sampling_plan_json TEXT, -- JSON MIL-STD-105E / √N
  sampled_containers TEXT,
  sampled_by TEXT,
  sampling_date_time TEXT,
  actual_sample_size REAL,
  actual_sample_unit TEXT,
  staff_decision TEXT,
  staff_notes TEXT,
  staff_signature_json TEXT,
  qm_decision TEXT,
  qm_notes TEXT,
  qm_deviation_number TEXT,
  qm_signature_json TEXT,
  ai_assessment TEXT,
  revert_reason TEXT,
  reverted_by TEXT,
  reverted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qc_lot_internal ON qc_inspection_reports(lot_internal_number);
CREATE INDEX IF NOT EXISTS idx_qc_grn_number ON qc_inspection_reports(grn_number);
CREATE INDEX IF NOT EXISTS idx_qc_status ON qc_inspection_reports(status);
CREATE INDEX IF NOT EXISTS idx_qc_material_code ON qc_inspection_reports(material_code);

-- 3. MASTER DATA BAHAN BAKU (RAW MATERIALS)
CREATE TABLE IF NOT EXISTS raw_materials (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  inci_name TEXT,
  cas_number TEXT,
  category TEXT DEFAULT 'Active',
  function TEXT,
  storage_conditions TEXT,
  standard_specs_json TEXT,
  qc_parameters_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_raw_code ON raw_materials(code);

-- 4. MASTER DATA BAHAN KEMAS (PACKAGING MATERIALS)
CREATE TABLE IF NOT EXISTS packaging_materials (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Primer', -- 'Primer' | 'Sekunder' | 'Tersier'
  container_type TEXT,
  dimensions TEXT,
  supplier TEXT,
  standard_specs_json TEXT,
  qc_parameters_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_packaging_code ON packaging_materials(code);

-- 5. MASTER DATA PRODUK (PRODUCTS & VARIANTS)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bpom_na TEXT,
  category TEXT,
  volume REAL,
  unit TEXT DEFAULT 'ml',
  variants_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

-- 6. FORMULA RUAHAN (BULK FORMULATIONS)
CREATE TABLE IF NOT EXISTS bulk_formulations (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'ACTIVE',
  ingredients_json TEXT,
  manufacturing_procedure TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_formulation_code ON bulk_formulations(code);

-- 7. LAPORAN PENYIMPANGAN MUTU (DEVIATIONS)
CREATE TABLE IF NOT EXISTS deviations (
  id TEXT PRIMARY KEY,
  deviation_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  department TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MINOR', -- 'MINOR' | 'MAJOR' | 'CRITICAL'
  category TEXT NOT NULL,
  description TEXT,
  root_cause TEXT,
  immediate_action TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN' | 'INVESTIGATING' | 'CAPA_PENDING' | 'CLOSED'
  reported_by TEXT,
  assigned_to TEXT,
  approved_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_deviation_number ON deviations(deviation_number);
CREATE INDEX IF NOT EXISTS idx_deviation_status ON deviations(status);

-- 8. KARTU STOK GUDANG (STOCK MOVEMENTS)
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  material_id TEXT,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL,
  movement_type TEXT NOT NULL, -- 'IN' | 'OUT' | 'ADJUSTMENT' | 'REVERT'
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stock_code ON stock_movements(material_code);
CREATE INDEX IF NOT EXISTS idx_stock_created_at ON stock_movements(created_at);

-- 9. USER PROFILES & CPKB ROLES
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  nik TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'super_admin' | 'manager' | 'supervisor' | 'staff'
  department TEXT NOT NULL, -- 'quality' | 'warehouse' | 'rnd' | 'production' | 'management'
  permissions_json TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_nik ON profiles(nik);
