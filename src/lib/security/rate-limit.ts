/**
 * Rate Limiting Service (In-Memory Fallback)
 * Implementa límite de subidas por EAPB (Max 10 / hora)
 * Nota: En entorno serveless real, reemplazar con Redis/Upstash.
 */

interface RateLimitInfo {
  count: number;
  resetAt: number; // timestamp
}

const rateLimiter = new Map<string, RateLimitInfo>();
const WINDOW_DURATION_MS = 60 * 60 * 1000; // 1 hora
const MAX_REQUESTS = 10;

/**
 * Verifica si el usuario (eapbId) ha excedido el rate limit.
 * @param eapbId Identificador de la EAPB
 * @returns true si está exitoso, false si está bloqueado.
 */
export async function checkRateLimit(eapbId: string): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  const now = Date.now();
  const lowerEapb = eapbId.toLowerCase();
  
  let info = rateLimiter.get(lowerEapb);

  if (!info || now > info.resetAt) {
    // Si no existe o la ventana ya pasó, crea uno nuevo.
    info = {
      count: 0,
      resetAt: now + WINDOW_DURATION_MS,
    };
  }

  info.count += 1;
  rateLimiter.set(lowerEapb, info);

  const remaining = Math.max(0, MAX_REQUESTS - info.count);
  const success = info.count <= MAX_REQUESTS;

  return {
    success,
    limit: MAX_REQUESTS,
    remaining,
    reset: new Date(info.resetAt),
  };
}

/**
 * Limpia entradas antiguas (prevenir memory leak)
 */
export function cleanupRateLimiter() {
  const now = Date.now();
  for (const [key, info] of rateLimiter.entries()) {
    if (now > info.resetAt) {
      rateLimiter.delete(key);
    }
  }
}
