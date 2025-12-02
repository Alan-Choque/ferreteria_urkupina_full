import { useState, useEffect } from 'react'

const MOCK_DATA_KEY = 'admin-mock-data-enabled'

export function useMockData() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // Cargar estado desde localStorage
    const saved = localStorage.getItem(MOCK_DATA_KEY)
    setEnabled(saved === 'true')
  }, [])

  const toggleMockData = (value?: boolean) => {
    const newValue = value !== undefined ? value : !enabled
    setEnabled(newValue)
    localStorage.setItem(MOCK_DATA_KEY, String(newValue))
    // Recargar la página para aplicar los cambios
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return {
    enabled,
    toggleMockData,
  }
}

