# app/main.py
import os
import io
import tempfile
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.schemas.cac import CACReport
from app.schemas.common import ValidationResponse
from app.validators import ejecutar_validaciones

# ── App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Validador CAC – Resolución 0247 de 2023",
    description="Motor de validación para reportes de cáncer ante la CAC/MinSalud Colombia.",
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth admin ────────────────────────────────────────────────────────
security  = HTTPBasic()
ADMIN_USER = os.getenv("ADMIN_USER", "cac_admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "Res247_2023!")

def verificar_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != ADMIN_USER or credentials.password != ADMIN_PASS:
        raise HTTPException(status_code=401, detail="Credenciales inválidas",
                            headers={"WWW-Authenticate": "Basic"})
    return credentials.username


# ── Health ─────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "servicio": "Validador CAC RES 0247", "version": "2.0.0"}


# ── Validación registro a registro ────────────────────────────────────
@app.post("/api/validar-cac", response_model=ValidationResponse, tags=["validacion"])
async def validar_cac(reporte: CACReport):
    """Valida un reporte CAC completo. Devuelve errores por campo y sección."""
    return ejecutar_validaciones(reporte)


@app.post("/api/validar-cac/batch", tags=["validacion"])
async def validar_batch(reportes: list[CACReport]):
    """Valida múltiples reportes en una sola llamada."""
    return [
        {"id_reporte": r.cabecera.id_reporte, **ejecutar_validaciones(r).dict()}
        for r in reportes
    ]


# ── Carga masiva ───────────────────────────────────────────────────────
@app.get("/api/plantilla-malla", tags=["carga_masiva"])
async def descargar_plantilla():
    """
    Descarga la plantilla Excel vacía con las 166 columnas VXX en el orden
    del anexo técnico de la Resolución 0247/2014. Lista para completar y
    enviar a /api/validar-masivo.
    """
    from app.carga_masiva import _generar_plantilla
    contenido = _generar_plantilla()
    return StreamingResponse(
        io.BytesIO(contenido),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=plantilla_malla_cac.xlsx"},
    )


@app.post("/api/validar-masivo", tags=["carga_masiva"])
async def validar_masivo(archivo: UploadFile = File(...)):
    """
    Valida una malla CAC completa (Excel .xlsx o archivo plano .txt con pipes |).

    - Acepta hasta 50.000 registros por archivo.
    - Devuelve un Excel con tres hojas: Errores, Resumen, Top errores por variable.
    - Las filas con ERROR se resaltan en rojo.
    - Las fechas se validan dinámicamente según V134 (fecha de corte del reporte).
    """
    ext = Path(archivo.filename).suffix.lower()
    if ext not in (".xlsx", ".xls", ".txt", ".csv"):
        raise HTTPException(
            status_code=400,
            detail="Formato no soportado. Use .xlsx para Excel o .txt para archivo plano con pipes."
        )

    from app.carga_masiva import validar_malla

    contenido = await archivo.read()
    try:
        excel_bytes, resumen = validar_malla(contenido, archivo.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")

    nombre_salida = f"errores_{Path(archivo.filename).stem}.xlsx"
    headers = {
        "Content-Disposition": f"attachment; filename={nombre_salida}",
        "X-Resumen-Total": str(resumen["total_filas"]),
        "X-Resumen-Errores": str(resumen["filas_con_error"]),
        "X-Resumen-Limpias": str(resumen["filas_limpias"]),
    }
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@app.post("/api/validar-masivo/resumen", tags=["carga_masiva"])
async def validar_masivo_resumen(archivo: UploadFile = File(...)):
    """
    Igual que /api/validar-masivo pero devuelve solo el resumen JSON
    (sin descargar el Excel). Útil para mostrar estadísticas en pantalla antes
    de descargar el reporte completo.
    """
    from app.carga_masiva import validar_malla
    contenido = await archivo.read()
    try:
        _, resumen = validar_malla(contenido, archivo.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return resumen


# ── Admin ──────────────────────────────────────────────────────────────
# ── Configuración de cohorte / período de reporte ─────────────────────────

@app.get("/admin/cohorte", tags=["admin"])
def get_cohorte(admin: str = Depends(verificar_admin)):
    """
    Consulta la configuración activa del período de reporte.
    En modo automático usa V134 del propio reporte.
    En modo manual usa las fechas configuradas aquí.
    """
    from app.config_cohorte import get_cohorte
    return get_cohorte()


@app.post("/admin/cohorte", tags=["admin"])
def set_cohorte(
    fecha_corte: str,
    fecha_inicio: Optional[str] = None,
    descripcion: Optional[str] = None,
    admin: str = Depends(verificar_admin),
):
    """
    Configura el período de reporte manualmente.

    - **fecha_corte**: último día del período, formato YYYY-MM-DD.
      Ejemplo cohorte 2026→2027: 
    - **fecha_inicio**: primer día del período, formato YYYY-MM-DD (opcional).
      Si no se pasa, se calcula como fecha_corte − 1 año + 1 día.
      Ejemplo:  si el período inicia en febrero.
    - **descripcion**: texto libre para identificar la cohorte.

    Una vez configurado, TODAS las validaciones usarán estas fechas
    independientemente del V134 de cada reporte individual.
    """
    from app.config_cohorte import set_cohorte
    try:
        return set_cohorte(fecha_corte, fecha_inicio, descripcion)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/admin/cohorte", tags=["admin"])
def reset_cohorte(admin: str = Depends(verificar_admin)):
    """
    Vuelve al modo automático: cada reporte usa su propio V134
    como fecha de corte y calcula el inicio del período automáticamente.
    """
    from app.config_cohorte import reset_cohorte
    return reset_cohorte()
@app.post("/admin/cargar-reglas-excel", tags=["admin"])
async def cargar_excel(
    reglas: UploadFile = File(..., description="Excel de reglas (siempre requerido)"),
    cie10:  Optional[UploadFile] = File(None, description="Archivo CIE-10 2026+"),
    atc:    Optional[UploadFile] = File(None, description="Archivo ATC 2026+"),
    cups:   Optional[UploadFile] = File(None, description="Archivo CUPS completo"),
    admin:  str = Depends(verificar_admin),
):
    """
    Actualiza catálogos y reglas sin reiniciar el servidor.
    Modo legacy: solo 'reglas'. Modo 2026+: reglas + cie10/atc/cups.
    """
    from app.catalogos import recargar_desde_excel
    from app.validators.motor_reglas import recargar_reglas
    from scripts.generar_catalogos import generar_desde_excel

    if not reglas.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="'reglas' debe ser .xlsx")

    uploads = {"reglas": reglas, "cie10": cie10, "atc": atc, "cups": cups}
    tmp_paths: dict = {}

    try:
        for campo, upload in uploads.items():
            if upload is None:
                continue
            contenido = await upload.read()
            tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
            tmp.write(contenido)
            tmp.close()
            tmp_paths[campo] = tmp.name

        app_dir = str(Path(__file__).parent)
        resumen = generar_desde_excel(
            tmp_paths["reglas"],
            directorio_salida=app_dir,
            ruta_cie10=tmp_paths.get("cie10"),
            ruta_atc=tmp_paths.get("atc"),
            ruta_cups=tmp_paths.get("cups"),
        )
        recargar_desde_excel(tmp_paths["reglas"])
        recargar_reglas()

        fuentes = {c: u.filename for c, u in uploads.items() if u is not None}
        return {"mensaje": "Catálogos y reglas actualizados", "archivos": fuentes, "resumen": resumen}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        for path in tmp_paths.values():
            try:
                os.unlink(path)
            except Exception:
                pass
