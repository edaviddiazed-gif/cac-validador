/**
 * GET /api/catalogos/[tipo]
 * Sirve catálogos de referencia (CIE-10, ATC, CUPS, DIVIPOLA, IPS)
 * usados por el motor de validación del cliente.
 *
 * @param tipo  cie10 | atc | cups | divipola | ips
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** Map tipo → nombre de tabla en Supabase */
const CATALOGO_TABLA: Record<string, string> = {
  cie10:    "catalogo_cie10",
  atc:      "catalogo_atc",
  cups:     "catalogo_cups",
  divipola: "catalogo_divipola",
  ips:      "catalogo_ips",
};

/** Columna que contiene el código (primaria) en cada tabla */
const CATALOGO_COLUMNA: Record<string, string> = {
  cie10:    "codigo",
  atc:      "codigo_atc",
  cups:     "codigo_cups",
  divipola: "codigo_divipola",
  ips:      "codigo_habilitacion",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { tipo: string } },
) {
  const tipo = params.tipo?.toLowerCase();

  if (!CATALOGO_TABLA[tipo]) {
    return NextResponse.json(
      { success: false, error: `Catálogo "${tipo}" no reconocido. Use: cie10, atc, cups, divipola, ips` },
      { status: 400 },
    );
  }

  const tabla   = CATALOGO_TABLA[tipo];
  const columna = CATALOGO_COLUMNA[tipo];

  try {
    // Paginación: máx 1 000 filas por defecto en Supabase → range completo
    const { data, error } = await supabase
      .from(tabla)
      .select(columna)
      .order(columna)
      .limit(50_000);   // suficiente para todos los catálogos CAC

    if (error) throw error;

    const codigos: string[] = ((data as any[]) ?? []).map(
      (row: any) => String(row[columna] ?? "").toUpperCase().trim(),
    ).filter(Boolean);

    return NextResponse.json(
      { success: true, tipo, total: codigos.length, codigos },
      {
        headers: {
          // Cache 1 hora en CDN — los catálogos cambian rara vez
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error(`[/api/catalogos/${tipo}]`, msg);
    return NextResponse.json(
      { success: false, error: `Error al leer catálogo ${tipo}: ${msg}` },
      { status: 500 },
    );
  }
}
