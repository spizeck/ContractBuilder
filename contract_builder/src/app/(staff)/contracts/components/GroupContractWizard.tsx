import { useState } from 'react'
import GroupContractForm from './GroupContractForm'
import RoomSelectionForm from './RoomSelectionForm'
import DivePackageSelectionForm from './DivePackageSelectionForm'
import MealPackageSelectionForm from './MealPackageSelectionForm'
import AddonSelectionForm from './AddonSelectionForm'
import TotalCostCalculation from './TotalCostCalculation'

export default function GroupContractWizard ({
  onCancel,
  initialData = null,
  prefilledHotelId,
  isHotelStaff = false
}: {
  onCancel: () => void
  initialData?: any
  prefilledHotelId?: string
  isHotelStaff?: boolean
}) {
  const [step, setStep] = useState(1)
  const [contractData, setContractData] = useState<any>(
    initialData || (prefilledHotelId ? { hotelId: prefilledHotelId } : {})
  )

  const nextStep = (data: any) => {
    setContractData((prev: any) => ({ ...prev, ...data }))
    
    setStep((currentStep) => {
      const merged = { ...contractData, ...data }
      
      // For direct hotel booking, skip room selection and meal package steps
      if (merged.bookingType === 'directHotelBooking') {
        if (currentStep === 1) {
          return 3 // Skip to dive package selection
        }
        if (currentStep === 3) {
          return 5 // Skip meal package, go to addons
        }
      }

      return currentStep + 1
    })
  }

  const prevStep = () => {
    // For direct hotel booking, skip room selection and meal package steps when going back
    if (contractData.bookingType === 'directHotelBooking') {
      if (step === 5) {
        setStep(3) // Go back to dive package, skip meal package
      } else if (step === 3) {
        setStep(1) // Go back to initial form, skip room selection
      } else {
        setStep(step - 1)
      }
    } else {
      setStep(step - 1)
    }
  }

  switch (step) {
    case 1:
      return (
        <GroupContractForm
          initialData={contractData}
          onNext={nextStep}
          onCancel={onCancel}
          isHotelStaff={isHotelStaff}
        />
      )
    case 2:
      return (
        <RoomSelectionForm
          hotelId={contractData.hotelId}
          startDate={contractData.startDate}
          endDate={contractData.endDate}
          initialRooms={contractData.rooms}
          onNext={nextStep}
          onBack={prevStep}
          onCancel={onCancel}
        />
      )
    case 3:
      return (
        <DivePackageSelectionForm
          hotelId={contractData.hotelId}
          initialDivePackageId={contractData.divePackageId}
          initialNumDivers={contractData.numDivers}
          onNext={nextStep}
          onBack={prevStep}
          onCancel={onCancel}
        />
      )
    case 4:
      return (
        <MealPackageSelectionForm
          hotelId={contractData.hotelId}
          initialMealPackageId={contractData.mealPackageId}
          onNext={nextStep}
          onBack={prevStep}
          onCancel={onCancel}
        />
      )
    case 5:
      return (
        <AddonSelectionForm
          initialAddons={{
            hotelAddons: contractData.hotelAddons,
            diveAddons: contractData.diveAddons,
            mealAddons: contractData.mealAddons,
          }}
          bookingType={contractData.bookingType}
          onNext={nextStep}
          onBack={prevStep}
          onCancel={onCancel}
        />
      )
    case 6:
      return (
        <TotalCostCalculation
          contractData={contractData}
          onUpdateContractData={(patch) => {
            setContractData((prev: any) => {
              const next = { ...prev, ...patch }

              if ('customRates' in patch && patch.customRates === undefined) {
                delete next.customRates
              }
              if ('hasCustomRates' in patch && patch.hasCustomRates === undefined) {
                delete next.hasCustomRates
              }

              return next
            })
          }}
          onConfirm={() => {
            // Save contract and generate PDF
            onCancel()
          }}
          onBack={prevStep}
        onCancel={onCancel}
        onEditStep={setStep}
        />
      )
    default:
      return null
  }
}
