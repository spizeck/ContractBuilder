// components/diveForm/hooks/useDiveFormData.ts
'use client'

import { useEffect, useState } from 'react'
import { Boat, Site, Species, Guide } from '@/types/diveLogTypes'
import { UserProfile } from '@/types/userTypes'
import { useAuth } from '@/context/AuthContext'
import { getBoats } from '@/services/boats'
import { getSites } from '@/services/sites'
import { getSpecies } from '@/services/species'
import { getUserProfile } from '@/services/users'
import { getGuides } from '@/services/guides'

export function useDiveFormData () {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<UserProfile['preferences']>()
  const [boats, setBoats] = useState<Boat[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [maxStep, setMaxStep] = useState(0)

  useEffect(() => {
    async function load () {
      if (user) {
        const profile = await getUserProfile(user.uid)
        setPrefs(
          profile?.preferences || {
            units: { depth: 'meters', temp: 'celsius', pressure: 'bar' }
          }
        )
      }

      const [boatsData, sitesData, speciesData, guidesData] = await Promise.all(
        [getBoats(), getSites(), getSpecies(), getGuides(true)]
      )

      setBoats(boatsData.filter(b => b.active))
      setSites(sitesData.sort((a, b) => a.name.localeCompare(b.name)))

      const activeSpecies = speciesData.filter(sp => sp.active)
      activeSpecies.sort((a, b) => {
        const catA = (a.category || 'Uncategorized').toLowerCase()
        const catB = (b.category || 'Uncategorized').toLowerCase()
        return catA === catB
          ? a.name.localeCompare(b.name)
          : catA.localeCompare(catB)
      })

      setSpeciesList(activeSpecies)
      setGuides(guidesData)

      const uniqueSteps = Array.from(
        new Set(activeSpecies.map(s => Number(s.step) || 1))
      ).sort((a, b) => a - b)
      setMaxStep(uniqueSteps.length)

      setLoading(false)
    }

    load()
  }, [user])

  return { prefs, boats, sites, speciesList, guides, loading, maxStep }
}
