import { supabase } from '../../lib/supabase';
import { ExtendedStockData } from '../EnhancedPortfolioTable';

// Save portfolio data to Supabase for the current user
export async function saveUserPortfolioData(portfolioData: EnhancedPortfolioData): Promise<{ success: boolean; error?: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('portfolios')
      .upsert({
        user_id: user.id,
        data: portfolioData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
    console.log('Portfolio data saved successfully to Supabase');
    return { success: true };
  } catch (error) {
    console.error('Error saving portfolio data:', error);
    return { success: false, error };
  }
}

// Load portfolio data from Supabase for the current user
export async function loadUserPortfolioData(): Promise<EnhancedPortfolioData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('portfolios')
      .select('data')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found for this user
        return null;
      }
      throw error;
    }

    console.log('Portfolio data loaded successfully from Supabase');
    return data?.data as EnhancedPortfolioData || null;
  } catch (error) {
    console.error('Error loading portfolio data:', error);
    return null;
  }
}

// Set up real-time subscription for portfolio data changes
export function subscribeToPortfolioChanges(userId: string, onUpdate: (data: EnhancedPortfolioData) => void): { unsubscribe: () => void } {
  const subscription = supabase
    .channel('portfolio-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'portfolios',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Real-time update received:', payload);
        if (payload.new && payload.new.data) {
          onUpdate(payload.new.data as EnhancedPortfolioData);
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    }
  };
}
