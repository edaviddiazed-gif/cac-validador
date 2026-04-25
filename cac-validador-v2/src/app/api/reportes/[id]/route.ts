/**
 * GET/DELETE /api/reportes/[id]
 *
 * GET  — Detalle completo de un reporte: registros, errores, resumen.
 * DELETE — Eliminar un reporte y sus registros/errores asociados.
 *
 * Ambos verifican que el usuario tenga acceso al reporte
 * (admin_cac ve todo, los demás solo su EAPB).
 *
 * @module app/api/reportes/[id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Helpers ────────────────────────────────────────────────────────────────

async function verificarAcceso(userId: string, reporteEapbId: string) {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, eapb_id")
    .eq("user_id", userId)
    .single();

  if (!profile) return false;
  if (profile.role === "admin_cac" || profile.role === "admin") return true;
  return profile.eapb_id === reporteEapbId;
}

// ─── GET — Detalle del reporte ──────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Missing authentication" },
      { status: 401 },
    );
  }

  const { id: reporteId } = await params;

  try {
    // 1. Obtener reporte
    const { data: reporte, error: reporteError } = await supabase
      .from("reportes_cancer")
      .select(`
        id, nombre_archivo, periodo_corte, estado,
        total_registros, registros_validos, registros_con_error,
        total_errores, total_advertencias,
        created_at, validated_at,
        eapb_id
      `)
      .eq("id", reporteId)
      .single();

    if (reporteError || !reporte) {
      return NextResponse.json(
        { success: false, error: "Reporte no encontrado" },
        { status: 404 },
      );
    }

    // 2. Verificar acceso
    const tieneAcceso = await verificarAcceso(userId, reporte.eapb_id);
    if (!tieneAcceso) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 },
      );
    }

    // 3. Obtener errores agrupados por variable
    const { data: errores } = await supabase
      .from("errores_validacion")
      .select("variable_numero, variable_nombre, tipo_error, mensaje_error, sugerencia, valor_reportado")
      .eq("registro_id", reporteId)
      .order("variable_numero", { ascending: true })
      .limit(500);

    // 4. Agrupar errores por tipo para resumen
    const erroresPorTipo: Record<string, number> = {};
    const erroresPorVariable: Record<number, number> = {};
    for (const e of errores ?? []) {
      erroresPorTipo[e.tipo_error] = (erroresPorTipo[e.tipo_error] || 0) + 1;
      erroresPorVariable[e.variable_numero] =
        (erroresPorVariable[e.variable_numero] || 0) + 1;
    }

    // 5. Top 10 variables con más errores
    const topVariables = Object.entries(erroresPorVariable)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([variable, count]) => ({ variable: Number(variable), count }));

    return NextResponse.json({
      success: true,
      reporte: {
        id: reporte.id,
        archivo: reporte.nombre_archivo,
        periodo: reporte.periodo_corte?.substring(0, 7) ?? "",
        estado: reporte.estado,
        totalRegistros: reporte.total_registros ?? 0,
        registrosValidos: reporte.registros_validos ?? 0,
        registrosConError: reporte.registros_con_error ?? 0,
        totalErrores: reporte.total_errores ?? 0,
        totalAdvertencias: reporte.total_advertencias ?? 0,
        fechaCarga: reporte.created_at,
        fechaValidacion: reporte.validated_at,
        eapbCodigo: (reporte as any).eapb_codigo ?? "XXXXX0",
        eapbNombre: (reporte as any).eapb_nombre ?? "Desconocida",
      },
      errores: errores ?? [],
      resumen: {
        erroresPorTipo,
        topVariables,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error(`[/api/reportes/${reporteId}] GET:`, msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 },
    );
  }
}

// ─── DELETE — Eliminar reporte ──────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Missing authentication" },
      { status: 401 },
    );
  }

  const { id: reporteId } = await params;

  try {
    // 1. Verificar que el reporte existe y obtener eapb_id
    const { data: reporte, error: reporteError } = await supabase
      .from("reportes_cancer")
      .select("id, eapb_id, nombre_archivo")
      .eq("id", reporteId)
      .single();

    if (reporteError || !reporte) {
      return NextResponse.json(
        { success: false, error: "Reporte no encontrado" },
        { status: 404 },
      );
    }

    // 2. Verificar acceso
    const tieneAcceso = await verificarAcceso(userId, reporte.eapb_id);
    if (!tieneAcceso) {
      return NextResponse.json(
        { success: false, error: "No autorizado para eliminar este reporte" },
        { status: 403 },
      );
    }

    // 3. Obtener IDs de registros para eliminar errores asociados
    const { data: registros } = await supabase
      .from("registros_cancer")
      .select("id")
      .eq("reporte_id", reporteId);

    const registroIds = registros?.map((r: { id: string }) => r.id) ?? [];

    // 4. Eliminar errores de validación de estos registros
    if (registroIds.length > 0) {
      await supabase
        .from("errores_validacion")
        .delete()
        .in("registro_id", registroIds);
    }

    // 5. Eliminar validation_jobs asociados
    await supabase
      .from("validation_jobs")
      .delete()
      .eq("reporte_id", reporteId);

    // 6. Eliminar registros de cáncer
    await supabase
      .from("registros_cancer")
      .delete()
      .eq("reporte_id", reporteId);

    // 7. Eliminar el reporte
    const { error: deleteError } = await supabase
      .from("reportes_cancer")
      .delete()
      .eq("id", reporteId);

    if (deleteError) {
      throw new Error(`Error eliminando reporte: ${deleteError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Reporte ${reporte.nombre_archivo} eliminado correctamente`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error(`[/api/reportes/${reporteId}] DELETE:`, msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 },
    );
  }
}
