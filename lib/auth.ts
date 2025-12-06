import { createClient } from './supabase-server';
import { redirect } from 'next/navigation';

export interface User {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  is_admin: boolean;
}

/**
 * Get the current authenticated user from the session
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData) {
      return null;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, nickname')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      first_name: profile?.first_name || undefined,
      last_name: profile?.last_name || undefined,
      nickname: profile?.nickname || undefined,
      is_admin: roleData.is_admin,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Verify that the current user is an admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user || !user.is_admin) {
    redirect('/admin/login');
  }
  
  return user;
}

