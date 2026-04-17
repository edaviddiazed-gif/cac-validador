/**
 * useValidationStatus.ts
 * FASE 3: Hook personalizado para polling de validación vía SSE
 * 
 * Uso:
 * const { progress, status, isComplete, error } = useValidationStatus(jobId);
 */

'use client';

import { useEffect, useState } from 'react';

export interface ValidationProgress {
  jobId: string;
  status: 'pendiente' | 'procesando' | 'completado' | 'error';
  processed: number;
  total: number;
  percentage: number;
  valid: number;
  errors: number;
  elapsedSeconds: number;
  estimatedSecondsRemaining: number;
  currentState: string;
  errorMessage: string | null;
  final?: boolean;
  totalRegistros?: number;
  registrosValidos?: number;
  registrosConError?: number;
  erroresAgrupados?: Record<string, number>;
}

interface UseValidationStatusReturn {
  progress: ValidationProgress | null;
  status: 'pendiente' | 'procesando' | 'completado' | 'error' | null;
  isComplete: boolean;
  error: string | null;
  isConnected: boolean;
}

/**
 * Hook para conectarse al endpoint SSE /api/validate/[jobId]/status
 */
export function useValidationStatus(jobId: string | null): UseValidationStatusReturn {
  const [progress, setProgress] = useState<ValidationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setProgress(null);
      setError(null);
      setIsConnected(false);
      return;
    }

    // Conectar a SSE
    let eventSource: EventSource | null = null;

    try {
      const url = `/api/validate/${jobId}/status`;
      eventSource = new EventSource(url);

      setIsConnected(true);
      setError(null);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ValidationProgress;

          // Validar que los datos tengan la estructura esperada
          if ('processed' in data && 'total' in data) {
            setProgress(data);

            // Si error_message en data, establecer error
            if (data.errorMessage) {
              setError(data.errorMessage);
            }

            // Si status es completado o error, cerrar conexión
            if (data.status === 'completado' || data.status === 'error') {
              eventSource?.close();
              setIsConnected(false);
            }
          }
        } catch (parseErr) {
          console.error('Error parsing SSE data:', parseErr);
          setError('Error parsing validation progress');
        }
      };

      eventSource.onerror = () => {
        console.error('SSE connection error');
        setError('Conexión perdida con servidor');
        eventSource?.close();
        setIsConnected(false);
      };

      return () => {
        eventSource?.close();
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error connecting to validation status';
      setError(message);
      setIsConnected(false);
    }
  }, [jobId]);

  return {
    progress,
    status: progress?.status || null,
    isComplete: progress?.final || progress?.status === 'completado' || false,
    error,
    isConnected,
  };
}
