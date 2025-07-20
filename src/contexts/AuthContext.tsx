import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signingOut: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: { full_name: string; company_name?: string; phone?: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  isAdmin: boolean;
  isClient: boolean;
  isApproved: boolean;
  handleSignOutClick: () => Promise<void>;
  retryProfileFetch: () => Promise<void>;
  skipProfileAndContinue: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Simple profile fetching function
  const fetchProfile = async (user: User): Promise<Profile | null> => {
    try {
      console.log('🔍 Fetching profile for user ID:', user.id, 'Email:', user.email);
      
      // Try to fetch by user ID first
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // If not found by ID, try by email
      if (error && error.code === 'PGRST116') {
        console.log('🔄 Profile not found by ID, trying email...');
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email!)
          .single();
        
        profile = result.data;
        error = result.error;
      }

      if (error && error.code === 'PGRST116') {
        console.log('📝 No profile found for user, this should not happen for existing users');
        console.log('📝 User should sign up first to create a profile');
        return null;
      } else if (error) {
        console.error('❌ Database error fetching profile:', error);
        return null;
      }

      if (!profile) {
        console.log('📝 No profile data returned');
        return null;
      }

      console.log('✅ Profile found:', profile.email, 'Role:', profile.role, 'Status:', profile.status);
      return profile;

    } catch (error) {
      console.error('💥 Profile fetch error:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;

        console.log('📱 Session status:', session?.user?.email || 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User found, fetching profile...');
          const profile = await fetchProfile(session.user);
          if (mounted) {
            setProfile(profile);
            console.log('✅ Profile set:', profile?.email);
          }
        }
        
        if (mounted) {
          setLoading(false);
          console.log('🏁 Auth initialization complete');
        }
      } catch (error) {
        console.error('💥 Error in initializeAuth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Sign in attempt for:', email);
    
    // Check if this is the hardcoded admin email
    if (email === 'darwin@komento.asia') {
      if (password === 'admin123') {
        console.log('🔑 Admin hardcoded login successful');
        setLoading(true);
        
        // Create a mock admin user and profile
        const mockAdminUser = {
          id: 'admin-hardcoded-id',
          email: 'darwin@komento.asia',
          user_metadata: {
            full_name: 'Darwin Bustillo',
            company_name: 'Komento'
          }
        } as any;
        
        const mockAdminProfile: Profile = {
          id: 'admin-hardcoded-id',
          email: 'darwin@komento.asia',
          full_name: 'Darwin Bustillo',
          company_name: 'Komento',
          phone: '',
          role: 'admin',
          status: 'approved',
          avatar_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setUser(mockAdminUser);
        setProfile(mockAdminProfile);
        setLoading(false);
        console.log('✅ Admin login successful - bypassing normal auth flow');
        
        return { error: null };
      } else {
        // Admin email with wrong password - don't try Supabase
        console.log('❌ Incorrect password for hardcoded admin account');
        setLoading(false);
        return { 
          error: { 
            message: 'Incorrect password for admin account',
            code: 'invalid_admin_credentials'
          } 
        };
      }
    }

    setLoading(true);
    
    try {
      console.log('🔄 Attempting Supabase authentication for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Supabase sign in error:', error.message);
        
        // Provide helpful error messages
        let userFriendlyMessage = error.message;
        if (error.message === 'Invalid login credentials') {
          userFriendlyMessage = 'No account found with this email and password. Please check your credentials or sign up for a new account.';
        }
        
        setLoading(false);
        return { error: { ...error, message: userFriendlyMessage } };
      }

      if (data.user) {
        console.log('✅ Supabase sign in successful for:', data.user.email);
        setUser(data.user);
        setSession(data.session);
        
        // Fetch profile after successful sign in
        console.log('🔍 Fetching profile for authenticated user...');
        const profile = await fetchProfile(data.user);
        
        if (!profile) {
          console.error('❌ Failed to fetch profile after successful authentication');
          setLoading(false);
          return { error: { message: 'Authentication successful but failed to load profile. Please try again.' } };
        }
        
        setProfile(profile);
        console.log('✅ Profile loaded after sign in:', profile.email, 'Role:', profile.role, 'Status:', profile.status);
        
        // Log the user's approval status
        if (profile.status === 'pending') {
          console.log('⏳ User has pending status - will show pending approval screen');
        } else if (profile.status === 'approved') {
          console.log('✅ User is approved - will show dashboard');
        }
      }
      
      setLoading(false);
      return { error: null };
      
    } catch (error) {
      console.error('💥 Sign in exception:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    userData: { full_name: string; company_name?: string; phone?: string }
  ) => {
    console.log('📝 Sign up attempt for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        setLoading(false);
        return { error };
      }

      if (data.user) {
        console.log('✅ Sign up successful for:', data.user.email);
        setUser(data.user);
        setSession(data.session);
        
        // Fetch or create profile after successful sign up
        const profile = await fetchProfile(data.user);
        setProfile(profile);
        console.log('✅ Profile created after sign up:', profile?.email, 'Status:', profile?.status);
      }
      
      setLoading(false);
      return { error: null };
      
    } catch (error) {
      console.error('💥 Sign up exception:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out user:', user?.email);
      setSigningOut(true);
      
      // Clear local state first
      setProfile(null);
      setUser(null);
      setSession(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out:', error);
      }
      
      console.log('✅ Sign out completed');
    } catch (error) {
      console.error('💥 Unexpected error during sign out:', error);
    } finally {
      setSigningOut(false);
      setLoading(false);
    }
  };

  const handleSignOutClick = async () => {
    console.log('🖱️ Sign out button clicked for user:', user?.email);
    
    // Prevent multiple sign out attempts
    if (signingOut) {
      console.log('⚠️ Sign out already in progress');
      return;
    }
    
    await signOut();
  };

  const retryProfileFetch = async () => {
    if (!user) return;
    
    console.log('🔄 Manual retry profile fetch for:', user.email);
    setLoading(true);
    
    try {
      const profile = await fetchProfile(user);
      setProfile(profile);
    } catch (error) {
      console.error('❌ Retry failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const skipProfileAndContinue = () => {
    console.log('⏭️ Skipping profile fetch for:', user?.email);
    if (user) {
      // Create a minimal profile to continue
      const mockProfile: Profile = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || '',
        company_name: user.user_metadata?.company_name || '',
        phone: user.user_metadata?.phone || '',
        role: 'client',
        status: 'pending',
        avatar_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfile(mockProfile);
    }
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('email', user.email);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  const isAdmin = profile?.role === 'admin' && profile?.status === 'approved';
  const isClient = profile?.role === 'client';
  const isApproved = profile?.status === 'approved' || profile?.status === 'active' || profile?.role === 'admin';

  const value = {
    user,
    profile,
    session,
    loading,
    signingOut,
    signIn,
    signUp,
    signOut,
    handleSignOutClick,
    retryProfileFetch,
    skipProfileAndContinue,
    updateProfile,
    isAdmin,
    isClient,
    isApproved,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}