import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadAdminState = async (nextUser: User | null) => {
      if (!isActive) return;

      setUser(nextUser);

      if (!nextUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: nextUser.id,
        _role: 'admin',
      });

      if (!isActive) return;

      setIsAdmin(!error && !!data);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void loadAdminState(session?.user ?? null);
      }, 0);
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => loadAdminState(session?.user ?? null))
      .catch(() => {
        if (!isActive) return;
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAdmin, loading, signIn, signOut };
}

