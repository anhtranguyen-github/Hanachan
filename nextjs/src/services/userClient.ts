import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import ApiClient from './apiClient';

/**
 * Client for user-related operations (Supabase & BFF)
 */
class UserClient extends ApiClient {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
  }

  /**
   * Browser-side: Fetches AI distilled memories via BFF
   */
  async getMemories(userId: string): Promise<any> {
    return this.get<any>(`/api/memory/profile?userId=${userId}`);
  }
}

export const userClient = new UserClient();
export default userClient;
