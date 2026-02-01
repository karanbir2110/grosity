// src/services/siteService.ts
import { supabase } from '../lib/supabase'; // Adjust path to your supabase config

// Define the type for site status
interface SiteStatus {
  live: boolean;
  message?: string;
  last_toggled?: string;
}

// Define the type for the database row
interface SiteSettingsRow {
  id: string;
  setting_key: string;
  setting_value: SiteStatus;
  updated_at: string;
}

export const siteService = {
  // Get current site status from Supabase
  async getSiteStatus(): Promise<SiteStatus> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'site_status')
        .single();
      
      if (error) {
        console.error('Error fetching site status:', error);
        return { live: true }; // Default to live if error
      }
      
      // Cast the data to our type
      const row = data as unknown as SiteSettingsRow;
      return row?.setting_value || { live: true };
    } catch (error) {
      console.error('Error in getSiteStatus:', error);
      return { live: true }; // Default to live if error
    }
  },

  // Check if site is live (simple version)
  async isSiteLive(): Promise<boolean> {
    try {
      const status = await this.getSiteStatus();
      return status.live;
    } catch (error) {
      console.error('Error checking site status:', error);
      return true; // Default to live if error
    }
  },

  // Quick check without full fetch (for UI blocking)
  async quickLiveCheck(): Promise<boolean> {
    // This can be optimized later with caching
    return await this.isSiteLive();
  }
};

export default siteService;