import { useState } from "react";
import GroupContractForm from "./GroupContractForm";
import RoomSelectionForm from "./RoomSelectionForm";
import DivePackageSelectionForm from "./DivePackageSelectionForm";
import MealPackageSelectionForm from "./MealPackageSelectionForm";
import TotalCostCalculation from "./TotalCostCalculation";

export default function GroupContractWizard({
  onCancel,
}: {
  onCancel: () => void;
}) {
  const [step, setStep] = useState(1);
  const [contractData, setContractData] = useState<any>({});

  const nextStep = (data: any) => {
    setContractData({ ...contractData, ...data });
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  switch (step) {
    case 1:
      return (
        <GroupContractForm
          initialData={contractData}
          onNext={nextStep}
          onCancel={onCancel}
        />
      );
    case 2:
      return (
        <RoomSelectionForm
          hotelId={contractData.hotelId}
          startDate={contractData.startDate}
          endDate={contractData.endDate}
          onNext={nextStep}
          onBack={prevStep}
        />
      );
    case 3:
      return (
        <DivePackageSelectionForm
          hotelId={contractData.hotelId}
          onNext={nextStep}
          onBack={prevStep}
        />
      );
    case 4:
      return (
        <MealPackageSelectionForm
          hotelId={contractData.hotelId}
          onNext={nextStep}
          onBack={prevStep}
        />
      );
    case 5:
      return (
        <TotalCostCalculation
          contractData={contractData}
          onConfirm={() => {
            // Save contract and generate PDF
            onCancel(); // or navigate away
          }}
          onBack={prevStep}
        />
      );
    default:
      return null;
  }
}
