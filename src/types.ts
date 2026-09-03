export type Department = 
  | 'rnd' 
  | 'ppic' 
  | 'warehouse' 
  | 'quality' 
  | 'procurement' 
  | 'sales' 
  | 'management' 
  | 'admin'
  | 'production';

export type Role = 
  | 'admin' 
  | 'manager' 
  | 'supervisor' 
  | 'staff' 
  | 'operator';

export type DocumentStatus = 'DRAFT' | 'SUBMITTED' | 'FINALIZED';

export interface ModulePermission {
  moduleId: Department;
  accessLevel: 'read' | 'write';
}

export interface UserProfile {
  id: string;
  nik: string;
  name: string;
  department: Department;
  role: Role;
  email: string;
  avatarUrl?: string;
  lastLogin?: string;
  specificAccess?: ModulePermission[];
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface QCParameter {
  name: string;
  specification: string;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  chemicalName: string;
  category: 'active' | 'excipient' | 'preservative' | 'emulsifier' | 'solvent';
  storageConditions: string;
  sdsDocNumber: string;
  approvedSubstitutes: string[];
  supplierLeadTimeDays?: number;
  manufacturer?: string;
  qcParameters: QCParameter[];
}

export interface PackagingMaterial {
  id: string;
  code: string;
  name: string;
  type: 'primary' | 'secondary' | 'tertiary';
  unitCapacityGrams?: number;
  materialSpec: string;
  artworkVersion: string;
  leadTimeDays?: number;
}

export interface FormulationIngredient {
  rawMaterialCode: string;
  percentage: number;
}

export interface BulkFormulation {
  id: string;
  code: string;
  name: string;
  bulkQuantityKg: number;
  ingredients: FormulationIngredient[];
  targetPh: number;
  phTolerance: number;
  targetViscosity: string;
  gravityTarget: number;
  mixingInstructions: string;
}

export interface VariantPackagingItem {
  packagingCode: string; // e.g. K0001
  quantityPerUnit: number;
  type: 'primary' | 'secondary' | 'tertiary';
}

export interface ProductVariant {
  id: string;
  productId: string; // references Product.id or code
  variantCode: string; // e.g. PJ0001-V1
  variantName: string; // e.g. "Botol Pipet 20ml"
  netVolumeGrams: number;
  bulkFormulaCode: string; // links to BulkFormulation code (e.g. FORM-001)
  packagingBom: VariantPackagingItem[];
  bpomNumber?: string;
  barcode?: string;
  description?: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  code: string; // Format PJ0001, PJ0002 dst
  name: string; // e.g. "Brightening Glow Serum"
  category: string; // e.g. "Skincare - Face Serum"
  brand: string; // e.g. "Larassanti Skin"
  description: string;
  variants: ProductVariant[];
  createdAt?: string;
}
