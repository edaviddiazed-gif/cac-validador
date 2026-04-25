/**
 * Toast — Sistema de notificaciones liviano.
 * Provee función `toast()` para mostrar notificaciones temporales.
 *
 * @module components/ui/toast
 */

"use client";

type ToastVariant = "default" | "success" | "destructive";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

/**
 * Mostrar una notificación toast.
 * Crea un elemento DOM temporal con animación de entrada/salida.
 */
export function toast({
  title,
  description,
  variant = "default",
  duration = 4000,
}: ToastOptions): void {
  // Asegurar que exista el contenedor
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    Object.assign(container.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "9999",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      pointerEvents: "none",
    });
    document.body.appendChild(container);
  }

  // Crear el toast
  const el = document.createElement("div");
  el.style.pointerEvents = "auto";

  const bgMap: Record<ToastVariant, string> = {
    default: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    success: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
    destructive: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
  };

  const iconMap: Record<ToastVariant, string> = {
    default: "ℹ️",
    success: "✅",
    destructive: "❌",
  };

  Object.assign(el.style, {
    background: bgMap[variant],
    color: "#fff",
    padding: "14px 20px",
    borderRadius: "12px",
    boxShadow:
      "0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)",
    minWidth: "280px",
    maxWidth: "420px",
    fontSize: "13px",
    lineHeight: "1.5",
    opacity: "0",
    transform: "translateX(100%) scale(0.95)",
    transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
  });

  el.innerHTML = `
    <div style="display:flex;gap:10px;align-items:flex-start;">
      <span style="font-size:16px;flex-shrink:0;margin-top:1px;">${iconMap[variant]}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:13.5px;">${title}</div>
        ${description ? `<div style="color:rgba(255,255,255,0.75);margin-top:3px;font-size:12.5px;">${description}</div>` : ""}
      </div>
    </div>
  `;

  container.appendChild(el);

  // Animar entrada
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateX(0) scale(1)";
  });

  // Animar salida y eliminar
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(100%) scale(0.95)";
    setTimeout(() => el.remove(), 350);
  }, duration);
}
