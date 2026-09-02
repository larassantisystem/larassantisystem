export type Department = 
  | 'rnd' 
  | 'ppic' 
  | 'warehouse' 
  | 'quality' 
  | 'procurement' 
  | 'sales' 
  | 'management' 
  | 'admin';

export type Role = 
  | 'admin' 
  | 'manager' 
  | 'supervisor' 
  | 'staff' 
  | 'operator';

export interface UserProfile {
  id: string;
  nik: string;
  name: string;
  department: Department;
  role: Role;
  email: string;
  avatarUrl?: string;
  lastLogin?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  chemicalName: string;
  category: 'active' | 'excipient' | 'preservative' | 'emulsifier' | 'solvent';
  phMin: number;
  phMax: number;
  storageConditions: string;
  sdsDocNumber: string;
  approvedSubstitutes: string[];
  specGrade: string;
  supplierLeadTimeDays?: number;
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
