'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { VStack } from '@chakra-ui/react'
import GroupContractWizard from './GroupContractWizard'
import GroupContractsList from './GroupContractsList'
import ProtectedPage from "@/components/shared/LayoutComponents/ProtectedPage";
import { getGroupContractById } from '@/services/groupContracts'

export default function ContractPageContent() {
  const searchParams = useSearchParams()
  const [view, setView] = useState<'home' | 'add' | 'list' | 'edit'>('list')
  const [editingContract, setEditingContract] = useState<any>(null)

  // Check for edit parameter on component mount
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      // Load the contract for editing
      const loadContractForEdit = async () => {
        try {
          const contract = await getGroupContractById(editId)
          if (contract) {
            // Ensure addon arrays are properly initialized for old contracts
            const contractWithAddons = {
              ...contract,
              hotelAddons: contract.hotelAddons || [],
              diveAddons: contract.diveAddons || [],
              mealAddons: contract.mealAddons || []
            }
            setEditingContract(contractWithAddons)
            setView('edit')
          }
        } catch (error) {
          console.error('Error loading contract for edit:', error)
          // Fall back to list view if contract not found
          setView('list')
        }
      }
      
      loadContractForEdit()
    }
  }, [searchParams])

  const handleAddContract = () => {
    setEditingContract(null)
    setView('add')
  }

  const handleViewEditContracts = () => {
    setView('list')
  }

  const handleBackToHome = () => {
    setView('home')
    setEditingContract(null)
  }

  const handleEditContract = (contract: any) => {
    setEditingContract(contract)
    setView('edit')
  }

  return (
     <ProtectedPage allowedRoles={["admin", "manager"]}>
    <VStack spacing={4} p={5}>

      {view === 'home' && (
        <GroupContractsList
          onBack={handleBackToHome}
          onCreateNew={handleAddContract}
          onEditContract={handleEditContract}
        />
      )}

      {view === 'add' && <GroupContractWizard onCancel={handleBackToHome} />}

      {view === 'edit' && editingContract && (
        <GroupContractWizard
          onCancel={handleBackToHome}
          initialData={editingContract}
          
        />
      )}

      {view === 'list' && (
        
        <GroupContractsList
          onBack={handleBackToHome}
          onCreateNew={handleAddContract}
          onEditContract={handleEditContract}
        />
        
      )}
    </VStack>
    </ProtectedPage>
  )
}
