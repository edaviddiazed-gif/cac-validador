/**
 * useAuth — Hook de autenticación con Supabase.
 * Provee userId, email, role y eapbId del usuario actual.
 *
 * Usa el browser client de Supabase para escuchar cambios
 * de sesión en tiempo real.
 *
 * @module hooks/useAuth
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  userId: string | null;
  email: string | null;
  role: string | null;
  eapbId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook para obtener el estado de autenticación del usuario.
 * Se suscribe a cambios de auth de Supabase (login/logout).
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId: null,
    email: null,
    role: null,
    eapbId: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const supabase = createClient();

    // Obtener sesión inicial
    async function getInitialSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Obtener perfil con rol y eapb
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("role, eapb_id")
            .eq("id", user.id)
            .single();

          setState({
            userId: user.id,
            email: user.email ?? null,
            role: profile?.role ?? null,
            eapbId: profile?.eapb_id ?? null,
            loading: false,
            isAuthenticated: true,
          });
        } else {
          setState((prev) => ({
            ...prev,
            loading: false,
            isAuthenticated: false,
          }));
        }
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          isAuthenticated: false,
        }));
      }
    }

    getInitialSession();

    // Suscribirse a cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role, eapb_id")
          .eq("id", session.user.id)
          .single();

        setState({
          userId: session.user.id,
          email: session.user.email ?? null,
          role: profile?.role ?? null,
          eapbId: profile?.eapb_id ?? null,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          userId: null,
          email: null,
          role: null,
          eapbId: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
