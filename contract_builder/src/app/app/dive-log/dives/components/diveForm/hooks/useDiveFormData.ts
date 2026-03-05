// components/diveForm/hooks/useDiveFormData.ts
'use client'

import { useEffect, useState } from 'react'
import { Boat, Site, Species, Guide } from '@/app/app/dive-log/_types'
import { UserProfile } from '@core/types/userTypes'
import { useAuth } from '@core/auth/AuthContext'
import { getBoats } from '@/app/app/dive-log/_lib/boatsRepo'
import { getSites } from '@/app/app/dive-log/_lib/sitesRepo'
import { getSpecies } from '@/app/app/dive-log/_lib/speciesRepo'
import { getUserProfile } from '@/app/app/admin/_lib/usersRepo'
import { getGuides } from '@/app/app/dive-log/_lib/guidesRepo'

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
    const load = async () => {
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
