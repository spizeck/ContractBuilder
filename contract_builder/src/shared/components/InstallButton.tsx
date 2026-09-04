'use client'

import { Button, ButtonProps } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface Window {
    seaSabaInstallPrompt?: BeforeInstallPromptEvent
  }
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
}

export default function InstallButton(props: ButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    setInstalled(isStandalone())
    setInstallPrompt(window.seaSabaInstallPrompt || null)

    const handlePrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const handleReady = () => setInstallPrompt(window.seaSabaInstallPrompt || null)
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handlePrompt)
    window.addEventListener('sea-saba-install-ready', handleReady)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt)
      window.removeEventListener('sea-saba-install-ready', handleReady)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  if (installed || !installPrompt) return null

  const install = async () => {
    await installPrompt.prompt()
    await installPrompt.userChoice
    delete window.seaSabaInstallPrompt
    setInstallPrompt(null)
  }

  return (
    <Button colorScheme="teal" onClick={install} {...props}>
      Install Sea Saba
    </Button>
  )
}
