"use client";

import {useState} from "react";
import {Button, Heading, Text, VStack} from "@chakra-ui/react";
import GroupContractForm from "./GroupContractForm";
import GroupContractsList from "./GroupContractsList";


export default function ContractPage() {
  const [action, setAction] = useState<null | "create" | "edit">(null);
  const [step, setStep] = useState<number>(1);
  const [contractData, setContractData] = useState<any>({})

  const handleNext = (data: any) => {
    setContractData({...contractData, ...data});
    setStep(step + 1);
  }

  const handleBack = () => {
    setStep(step - 1);
  }

  const handleCancel = () => {
    setAction(null);
    setStep(1);
    setContractData({});
  }

const handleEditContract = (contractId: string) => {
    setAction("edit");
    setStep(1);
    fetchContract(contractId).then(data => setContractData(data));

}

  return (
    <VStack spacing={2} p={5}>
      <Heading as="h1" size="xl" textAlign="center">
        Group Contracts
      </Heading>

      {!action && (
        <>
          <VStack spacing={4} p={5} align="stretch">
            <Text fontSize="lg">What would you like to do?</Text>
            <Button colorScheme="teal" size="lg" onClick={() => setAction("create")}>
              Create New Contract
            </Button>
            <Button colorScheme="blue" size="lg" onClick={() => setAction("edit")}>
              View/Edit Existing Contract
            </Button>
          </VStack>
        </>
      )}

      {action === "create" && <GroupContractForm onNext={handleNext} onCancel={handleCancel}/>}

    </VStack>
  );
}
