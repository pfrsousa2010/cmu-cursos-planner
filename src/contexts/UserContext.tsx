import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface UserProfile {
  id: string;
  email: string;
  nome: string | null;
  role: UserRole;
  isActive: boolean;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<'inactive' | 'success'>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  canManageUnidades: boolean;
  canManageCursos: boolean;
  canViewOnly: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = () => {
    setUser(null);
    setProfile(null);
  };

  const loadUserData = async (currentUser: User) => {
    try {
      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError);
        await signOut();
        return;
      }

      // Verificar se o usuário está ativo
      if (profileData?.isActive === false) {
        await signOut();
        return;
      }

      const userProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        nome: profileData.nome,
        role: profileData.role,
        isActive: profileData.isActive
      };

      setProfile(userProfile);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      await signOut();
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        clearAuthState();
        setLoading(false);
        return;
      }

      if (session?.user) {
        // Verificar se o token ainda é válido fazendo uma query simples
        const { error: testError } = await supabase.from('profiles').select('id').limit(1);
        
        if (testError && (testError.code === 'invalid_token' || testError.message?.includes('JWT'))) {
          await signOut();
          return;
        }

        setUser(session.user);
        await loadUserData(session.user);
      } else {
        clearAuthState();
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<'inactive' | 'success'> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      if (error.code === 'email_not_confirmed') {
        throw new Error('Você precisa confirmar seu e-mail antes de acessar. Verifique sua caixa de entrada ou spam.');
      }
      throw new Error('Email ou senha inválidos.');
    }
  
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('isActive')
        .eq('id', data.user.id)
        .single();
  
      if (profileError) {
        console.error('Erro ao verificar perfil:', profileError);
        await supabase.auth.signOut();
        throw new Error('Conta não encontrada ou não confirmada.');
      }
      
      if (!profile?.isActive) {
        await supabase.auth.signOut();
        return 'inactive';
      }
  
      setUser(data.user);
      await loadUserData(data.user);
      return 'success';
    }
    throw new Error('Erro inesperado.');
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      clearAuthState();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setTimeout(() => {
          loadUserData(session.user);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        clearAuthState();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
        setTimeout(() => {
          loadUserData(session.user);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const canManageUnidades = profile?.role === 'admin';
  const canManageCursos = profile?.role === 'admin' || profile?.role === 'editor';
  const canViewOnly = profile?.role === 'visualizador';

  const value: UserContextType = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    updatePassword,
    canManageUnidades,
    canManageCursos,
    canViewOnly
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
};
