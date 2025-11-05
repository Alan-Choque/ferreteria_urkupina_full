"use client";

import { ReactNode } from "react";

interface ApiBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: (error: Error) => ReactNode;
}

interface ApiBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default function ApiBoundary({
  children,
  fallback,
  errorFallback,
}: ApiBoundaryProps) {
  // Este componente se puede extender para usar ErrorBoundary de React
  // Por ahora, es un wrapper simple
  return <>{children}</>;
}

// Componente de loading
export function LoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-red-600 mb-4"></div>
        <p className="text-neutral-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

// Skeleton loader para productos
export function ProductSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg overflow-hidden animate-pulse">
          <div className="bg-neutral-200 h-48 w-full"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 rounded w-full"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
            <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente de error
export function ErrorState({ error, message }: { error?: Error; message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Error al cargar datos</h3>
        <p className="text-neutral-600 mb-4">{message || error?.message || "Ocurrió un error inesperado"}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

