import { useCallback } from 'react'
import { createToaster } from '@chakra-ui/react'

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
})

export const Toaster = toaster.Toaster

type ToastStatus = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  isClosable?: boolean;
}

/**
 * Hook for showing toast notifications
 */
export const useToast = () => {
  const showToast = useCallback((status: ToastStatus, options: ToastOptions) => {
    toaster.create({
      title: options.title,
      description: options.description,
      type: status,
    })
  }, [])

  const success = useCallback((title: string, description?: string) => {
    showToast('success', { title, description })
  }, [showToast])

  const error = useCallback((title: string, description?: string) => {
    showToast('error', { title, description })
  }, [showToast])

  const warning = useCallback((title: string, description?: string) => {
    showToast('warning', { title, description })
  }, [showToast])

  const info = useCallback((title: string, description?: string) => {
    showToast('info', { title, description })
  }, [showToast])

  return {
    success,
    error,
    warning,
    info,
    toast: showToast,
  }
}

