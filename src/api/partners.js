/**
 * API Partenaires Entreprises — ESGIS Campus §5.6
 */
import { supabase } from '../supabase';

export const getPartners = async (filters = {}) => {
  try {
    let query = supabase
      .from('partners')
      .select('*')
      .order('name');
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.sector) query = query.eq('sector', filters.sector);
    if (filters.search) query = query.ilike('name', `%${filters.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const createPartner = async (partnerData) => {
  try {
    const { data, error } = await supabase.from('partners').insert(partnerData).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updatePartner = async (id, partnerData) => {
  try {
    const { data, error } = await supabase.from('partners').update(partnerData).eq('id', id).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deletePartner = async (id) => {
  try {
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};
