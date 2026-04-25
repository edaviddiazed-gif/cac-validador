/**
 * GET /api/reportes
 * Devuelve la lista de reportes del usuario autenticado desde Supabase.
 * Integra datos reales para la página /reports (antes tenía mock estático).
 *
 * Query params:
 *   estado   — validado | validando | error | pendiente  (opcional)
 *   periodo  — YYYY-MM  (opcional, filtra por periodo_corte)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Missing authentication" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const estadoFiltro  = searchParams.get("estado");
  const periodoFiltro = searchParams.get("periodo"); // YYYY-MM

  try {
    // 1. Obtener perfil → EAPB del usuario
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("eapb_id, role")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Perfil de usuario no encontrado" },
        { status: 403 },
      );
    }

    // 2. Construir query de reportes
    let query = supabase
      .from("reportes_cancer")
      .select(`
        id,
        nombre_archivo,
        periodo_corte,
        estado,
        total_registros,
        registros_validos,
        total_errores,
        total_advertencias,
        created_at,
        eapb:eapb_id ( codigo )
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    // Solo admins ven todos; los demás solo ven su EAPB
    if (profile.role !== "admin") {
      query = query.eq("eapb_id", profile.eapb_id);
    }

    if (estadoFiltro && estadoFiltro !== "todos") {
      query = query.eq("estado", estadoFiltro);
    }

    if (periodoFiltro) {
      // periodo_corte almacenado como YYYY-MM-DD → filtrar por mes
      query = query.like("periodo_corte", `${periodoFiltro}%`);
    }

    const { data: rows, error: rowsError } = await query;
    if (rowsError) throw rowsError;

    // 3. Mapear al formato que espera la página
    type SupabaseRow = {
      id: string;
      nombre_archivo: string;
      periodo_corte: string;
      estado: string;
      total_registros: number;
      registros_validos: number;
      total_errores: number;
      total_advertencias: number;
      created_at: string;
      eapb?: { codigo?: string } | null;
    };

    const reportes = (rows as SupabaseRow[]).map(row => ({
      id:               row.id,
      archivo:          row.nombre_archivo,
      periodo:          row.periodo_corte?.substring(0, 7) ?? "",
      estado:           row.estado as "validado" | "validando" | "error" | "pendiente",
      totalRegistros:   row.total_registros   ?? 0,
      registrosValidos: row.registros_validos ?? 0,
      errores:          row.total_errores     ?? 0,
      advertencias:     row.total_advertencias ?? 0,
      fechaCarga:       row.created_at,
      eapbCodigo:       row.eapb?.codigo ?? "XXXXX0",
    }));

    return NextResponse.json({ success: true, reportes });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[/api/reportes]", msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 },
    );
  }
}
