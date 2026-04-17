import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware Supabase: refresca sesiones y protege rutas.
 * FASE 3: Mejorado para agregar contexto de usuario a headers para API routes
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Skipping Supabase middleware.",
      { hasUrl: Boolean(supabaseUrl), hasAnon: Boolean(supabaseAnonKey) }
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh session — handle errors gracefully
  let user: any = null;
  try {
    const {
      data: { user: _user },
    } = await supabase.auth.getUser();
    user = _user;
  } catch (err) {
    console.error("Supabase auth.getUser() failed:", err);
  }

  // FASE 3: Agregar contexto de usuario a headers para API routes
  if (user) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email || '');
    
    // Obtener rol del usuario desde user_profiles
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, eapb_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        requestHeaders.set('x-user-role', profile.role);
        if (profile.eapb_id) {
          requestHeaders.set('x-eapb-id', profile.eapb_id);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }

    supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
    
    // Re-aplicar cookies
    const cookiesToSet = request.cookies.getAll();
    cookiesToSet.forEach(({ name, value }) => {
      supabaseResponse.cookies.set(name, value);
    });
  }

  // Protect dashboard routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
