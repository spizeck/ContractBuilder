'use client'

import { Spinner } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Dive, DiveSlot, Sighting } from '@/types/diveLogTypes'
import { useAuth } from '@/context/AuthContext'
import { useDiveFormData } from './hooks/useDiveFormData'
import { StepDiveInfo } from './steps/StepDiveInfo'
import { StepSightings } from './steps/StepSightings'
import { StepConfirm } from './steps/StepConfirm'
import FormActions from './FormActions'

import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  feetToMeters,
  metersToFeet
} from '@/utils/conversions'
import { checkDuplicateDive } from '@/services/dives'
import { validateDive } from '@/utils/validators'

interface DiveFormProps {
  initialDive?: Dive
  onSave: (data: Omit<Dive, 'id' | 'createdAt'>) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export default function DiveForm ({
  initialDive,
  onSave,
  onCancel,
  isSaving = false
}: DiveFormProps) {
  const { user } = useAuth()
  const { prefs, boats, sites, speciesList, guides, loading, maxStep } =
    useDiveFormData()

  const [date, setDate] = useState('')
  const [diveSlot, setDiveSlot] = useState<DiveSlot>('' as DiveSlot)
  const [boatId, setBoatId] = useState('')
  const [diveGuide, setDiveGuide] = useState('')
  const [diveSiteId, setDiveSiteId] = useState('')
  const [maxDepth, setMaxDepth] = useState(0)
  const [waterTemperature, setWaterTemperature] = useState(0)
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (initialDive) {
      let formattedDate = ''

      // Handle Firestore Timestamp
      if (typeof (initialDive.date as any)?.toDate === 'function') {
        formattedDate = (initialDive.date as any)
          .toDate()
          .toISOString()
          .split('T')[0]
      }
      // Handle JS Date
      else if (initialDive.date instanceof Date) {
        formattedDate = initialDive.date.toISOString().split('T')[0]
      }
      // Handle ISO string or number
      else if (
        typeof initialDive.date === 'string' ||
        typeof initialDive.date === 'number'
      ) {
        formattedDate = new Date(initialDive.date).toISOString().split('T')[0]
      }

      setDate(formattedDate)
      setDiveSlot(initialDive.diveSlot)
      setBoatId(initialDive.boatId)
      setDiveGuide(initialDive.diveGuide)
      setDiveSiteId(initialDive.diveSiteId)
      setMaxDepth(initialDive.maxDepth)
      setWaterTemperature(initialDive.waterTemperature)
      setSightings(initialDive.sightings || [])
    } else {
      setDate(new Date().toISOString().split('T')[0])
      setDiveGuide(user?.displayName || '')
    }
  }, [initialDive, user])

  const handleSightingChange = (speciesId: string, count: number) => {
    setSightings(prev => {
      const updated = [...prev]
      const idx = updated.findIndex(s => s.speciesId === speciesId)
      if (idx >= 0) updated[idx].count = count
      else updated.push({ speciesId, count })
      return updated
    })
  }

  const handleDepthChange = (_: string, val: number) =>
    prefs?.units.depth === 'feet'
      ? setMaxDepth(feetToMeters(val))
      : setMaxDepth(val)

  const handleTempChange = (_: string, val: number) =>
    prefs?.units.temp === 'fahrenheit'
      ? setWaterTemperature(fahrenheitToCelsius(val))
      : setWaterTemperature(val)

  const handleSubmit = async () => {
    console.log('=== DIVE FORM SUBMIT DEBUG ===');
    console.log('User:', user?.email);
    console.log('Date:', date);
    console.log('Dive Slot:', diveSlot);
    console.log('Boat ID:', boatId);
    console.log('Guide:', diveGuide);
    console.log('Site ID:', diveSiteId);
    console.log('Max Depth:', maxDepth);
    console.log('Water Temp:', waterTemperature);
    console.log('Sightings:', sightings);

    if (!user) {
      console.log('No user found - returning');
      return
    }

    const warnings = validateDive(maxDepth, waterTemperature, prefs)
    console.log('Validation warnings:', warnings);
    if (warnings.length && !confirm('Warnings:\n' + warnings.join('\n'))) {
      console.log('User cancelled due to warnings');
      return
    }

    console.log('Checking for duplicate dive...');
    const duplicate = await checkDuplicateDive(
      date,
      diveSlot,
      boatId,
      diveGuide,
      initialDive?.id || ''
    )
    console.log('Duplicate check result:', duplicate);
    if (duplicate) {
      console.log('Duplicate dive found - alerting user');
      return alert('This dive has already been logged.')
    }

    console.log('Calling onSave with dive data...');
    try {
      await onSave({
        date,
        diveSlot,
        boatId,
        diveGuide,
        diveSiteId,
        maxDepth,
        waterTemperature,
        createdBy: user.uid,
        sightings
      });
      console.log('onSave completed successfully');
    } catch (error) {
      console.error('Error in onSave:', error);
    }
    
    console.log('=== END DIVE FORM SUBMIT DEBUG ===');
  }

  if (loading) return <Spinner />

  const totalSteps = maxStep + 2
  const progressValue = ((step + 1) / totalSteps) * 100

  const depthLabel =
    prefs?.units.depth === 'feet' ? 'Max Depth (ft)' : 'Max Depth (m)'
  const tempLabel =
    prefs?.units.temp === 'fahrenheit' ? 'Water Temp (°F)' : 'Water Temp (°C)'
  const displayDepth =
    prefs?.units.depth === 'feet'
      ? Math.round(metersToFeet(maxDepth))
      : Math.round(maxDepth * 2) / 2
  const displayTemp =
    prefs?.units.temp === 'fahrenheit'
      ? Math.round(celsiusToFahrenheit(waterTemperature))
      : Math.round(waterTemperature * 2) / 2

  return (
    <>
      {step === 0 && (
        <StepDiveInfo
          {...{
            date,
            diveSlot,
            boatId,
            diveGuide,
            diveSiteId,
            maxDepth,
            waterTemperature,
            boats,
            sites,
            guides,
            prefs,
            progressValue,
            depthLabel,
            tempLabel,
            displayDepth,
            displayTemp,
            onChange: {
              setDate,
              setDiveSlot,
              setBoatId,
              setDiveGuide,
              setDiveSiteId,
              handleDepthChange,
              handleTempChange
            }
          }}
        />
      )}

      {step > 0 && step <= maxStep && (
        <StepSightings
          speciesList={speciesList}
          sightings={sightings}
          step={step}
          maxStep={maxStep}
          progressValue={progressValue}
          onChange={handleSightingChange}
        />
      )}

      {step === maxStep + 1 && (
        <StepConfirm
          date={date}
          diveSlot={diveSlot}
          diveGuide={diveGuide}
          boatId={boatId}
          diveSiteId={diveSiteId}
          displayDepth={displayDepth}
          displayTemp={displayTemp}
          prefs={prefs}
          boats={boats}
          sites={sites}
          sightings={sightings}
          speciesList={speciesList}
          progressValue={progressValue}
        />
      )}

      <FormActions
        step={step}
        maxStep={maxStep}
        initialDive={!!initialDive}
        onCancel={onCancel}
        onBack={() => setStep(step - 1)}
        onNext={() => setStep(step + 1)}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </>
  )
}
