import { useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'success', visible: false,
  })

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type, visible: true })
  }

  function hideToast() {
    setToast(prev => ({ ...prev, visible: false }))
  }

  return { toast, showToast, hideToast }
}