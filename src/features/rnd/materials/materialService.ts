import { supabase } from '../../../core/auth/supabaseClient';
import { RawMaterial } from '../../../types';

export const materialService = {
  getAllMaterials: async (): Promise<{ data: RawMaterial[] | null; error: string | null }> => {
    const { data, error } = await supabase
      .from('materials')
      .select('*');
    
    if (error) return { data: null, error: error.message };
    return { data: data as RawMaterial[], error: null };
  },

  addMaterial: async (material: Omit<RawMaterial, 'id'>): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('materials')
      .insert([material]);
      
    if (error) return { error: error.message };
    return { error: null };
  },

  updateMaterial: async (id: string, material: Partial<RawMaterial>): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('materials')
      .update(material)
      .eq('id', id);
      
    if (error) return { error: error.message };
    return { error: null };
  },

  deleteMaterial: async (id: string): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);
      
    if (error) return { error: error.message };
    return { error: null };
  }
};
