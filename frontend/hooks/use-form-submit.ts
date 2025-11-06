import { useState, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"

interface UseFormSubmitOptions {
  debounceMs?: number
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  generateIdempotencyKey?: boolean
}

interface SubmitFunction {
  (data: any, idempotencyKey?: string): Promise<any>
}

export function useFormSubmit<T = any>(
  submitFn: SubmitFunction,
  options: UseFormSubmitOptions = {}
) {
  const {
    debounceMs = 300,
    onSuccess,
    onError,
    generateIdempotencyKey = true,
  } = options

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSubmitRef = useRef<{ data: T; key: string } | null>(null)

  const submit = useCallback(
    async (data: T) => {
      // Cancelar submit anterior si está pendiente
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Verificar si es el mismo submit que el anterior (debounce)
      const currentHash = JSON.stringify(data)
      const now = Date.now()
      if (
        lastSubmitRef.current &&
        JSON.stringify(lastSubmitRef.current.data) === currentHash &&
        now - (lastSubmitRef.current as any).timestamp < debounceMs
      ) {
        return Promise.resolve((lastSubmitRef.current as any).result)
      }

      // Generar idempotency key si no existe
      const idempotencyKey = generateIdempotencyKey ? uuidv4() : undefined

      // Debounce
      return new Promise((resolve, reject) => {
        debounceTimerRef.current = setTimeout(async () => {
          setIsSubmitting(true)
          setError(null)

          try {
            const result = await submitFn(data, idempotencyKey)
            lastSubmitRef.current = {
              data,
              key: idempotencyKey || "",
              result,
              timestamp: Date.now(),
            } as any

            if (onSuccess) {
              onSuccess(result)
            }
            resolve(result)
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
            if (onError) {
              onError(error)
            }
            reject(error)
          } finally {
            setIsSubmitting(false)
          }
        }, debounceMs)
      })
    },
    [submitFn, debounceMs, generateIdempotencyKey, onSuccess, onError]
  )

  return {
    submit,
    isSubmitting,
    error,
  }
}

