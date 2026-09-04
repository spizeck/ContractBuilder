'use client'

import { Button, HStack, Text, useToast } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface Window {
    seaSabaInstallPrompt?: BeforeInstallPromptEvent
  }
}

export default function PwaManager() {
  const toast = useToast()
  const reloadRequested = useRef(false)

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault()
      window.seaSabaInstallPrompt = event as BeforeInstallPromptEvent
      window.dispatchEvent(new Event('sea-saba-install-ready'))
    }
    const clearInstallPrompt = () => {
      delete window.seaSabaInstallPrompt
    }

    window.addEventListener('beforeinstallprompt', captureInstallPrompt)
    window.addEventListener('appinstalled', clearInstallPrompt)

    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') {
      return () => {
        window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
        window.removeEventListener('appinstalled', clearInstallPrompt)
      }
    }

    const handleControllerChange = () => {
      if (!reloadRequested.current) return
      reloadRequested.current = false
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((registration) => {
      const offerUpdate = (worker: ServiceWorker) => {
        toast({
          id: 'pwa-update',
          duration: null,
          isClosable: true,
          position: 'bottom',
          render: ({ onClose }) => (
            <HStack bg="teal.700" color="white" borderRadius="md" boxShadow="lg" p={4} spacing={4}>
              <Text>An update is available.</Text>
              <Button
                size="sm"
                colorScheme="whiteAlpha"
                onClick={() => {
                  reloadRequested.current = true
                  worker.postMessage({ type: 'SKIP_WAITING' })
                }}
              >
                Refresh to update
              </Button>
              <Button size="sm" variant="ghost" color="white" onClick={onClose}>
                Later
              </Button>
            </HStack>
          ),
        })
      }

      const observedWorkers = new WeakSet<ServiceWorker>()
      const observeWorker = (worker: ServiceWorker | null) => {
        if (!worker || observedWorkers.has(worker)) return
        observedWorkers.add(worker)
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker)
        })
      }

      if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting)
      observeWorker(registration.installing)
      registration.addEventListener('updatefound', () => observeWorker(registration.installing))
    }).catch(() => undefined)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
      window.removeEventListener('appinstalled', clearInstallPrompt)
    }
  }, [toast])

  return null
}
