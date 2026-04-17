import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // API Route server-side
);

const ALLOWED_CATALOGS = ['cie10_cac', 'atc_medicamentos', 'cups_procedimientos', 'divipola_municipios', 'eapb'];

/**
 * GET /api/catalogos/[tipo]?q=...&limit=50
 * Busca en los catálogos del sistema
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tipo: string }> } // In Next.js 15, params is a Promise in App Router
) {
  try {
    const { tipo } = await params;
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!ALLOWED_CATALOGS.includes(tipo)) {
      return NextResponse.json({ success: false, error: 'Catálogo no permitido o inexistente' }, { status: 400 });
    }

    let supaQuery = supabase.from(tipo).select('*').limit(Math.min(limit, 100));

    if (query) {
      if (tipo === 'divipola_municipios') {
        supaQuery = supaQuery.or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`);
      } else if (tipo === 'eapb') {
        supaQuery = supaQuery.or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`);
      } else {
        supaQuery = supaQuery.or(`descripcion.ilike.%${query}%,codigo.ilike.%${query}%`).eq('activo', true);
      }
    } else {
       if (tipo !== 'divipola_municipios' && tipo !== 'eapb') {
           supaQuery = supaQuery.eq('activo', true);
       }
    }

    const { data, error } = await supaQuery;

    if (error) throw error;

    return NextResponse.json({ success: true, data }, {
        headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
        }
    });
  } catch (error) {
    console.error('Catalogo fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
