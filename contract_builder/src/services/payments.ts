import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { Payment, ContractNote } from '@/types/contractTypes'

// Payment CRUD operations
export async function addPayment(
  contractId: string,
  paymentData: Omit<Payment, 'id' | 'contractId' | 'createdAt'>,
  paymentFile?: File,
  onProgress?: (progress: number) => void
): Promise<Payment> {
  try {
    let paymentDocumentUrl: string | undefined
    let paymentDocumentType: string | undefined

    // Upload payment document if provided
    if (paymentFile) {
      const paymentId = doc(collection(db, 'payments')).id
      const storageRef = ref(storage, `payment-receipts/${contractId}/${paymentId}/${paymentFile.name}`)
      
      const uploadTask = uploadBytesResumable(storageRef, paymentFile)
      
      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            onProgress?.(progress)
          },
          (error) => {
            reject(error)
          },
          async () => {
            try {
              paymentDocumentUrl = await getDownloadURL(uploadTask.snapshot.ref)
              paymentDocumentType = getDocumentType(paymentFile.name, paymentData.paymentMethod)
              resolve()
            } catch (error) {
              reject(error)
            }
          }
        )
      })
    }

    // Create payment document
    const paymentDoc = {
      ...paymentData,
      contractId,
      createdAt: Timestamp.now(),
      ...(paymentDocumentUrl && { paymentDocumentUrl }),
      ...(paymentDocumentType && { paymentDocumentType })
    }

    const docRef = await addDoc(collection(db, 'payments'), paymentDoc)
    
    // Convert Timestamp to Date for the return type
    const newPayment = { 
      id: docRef.id, 
      ...paymentDoc,
      createdAt: paymentDoc.createdAt.toDate()
    } as Payment

    // Update contract payment summary
    await updateContractPaymentSummary(contractId)

    return newPayment
  } catch (error) {
    console.error('Error adding payment:', error)
    throw new Error('Failed to add payment')
  }
}

export async function getPayments(contractId: string): Promise<Payment[]> {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('contractId', '==', contractId),
      orderBy('paymentDate', 'desc'),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(paymentsQuery)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        paymentDate: data.paymentDate instanceof Timestamp ? data.paymentDate.toDate() : new Date(data.paymentDate),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
      } as Payment
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    throw new Error('Failed to fetch payments')
  }
}

export async function updatePayment(paymentId: string, updates: Partial<Payment>): Promise<void> {
  try {
    const paymentRef = doc(db, 'payments', paymentId)

    // Fetch existing payment to get contractId for summary recalculation
    const paymentSnap = await getDoc(paymentRef)
    const existingContractId = paymentSnap.data()?.contractId

    const updateData = {
      ...updates,
      // Convert dates back to Timestamps for Firestore
      ...(updates.paymentDate && { paymentDate: Timestamp.fromDate(updates.paymentDate) })
    }

    await updateDoc(paymentRef, updateData)

    // Always recalculate contract payment summary
    const contractId = updates.contractId || existingContractId
    if (contractId) {
      await updateContractPaymentSummary(contractId)
    }
  } catch (error) {
    console.error('Error updating payment:', error)
    throw new Error('Failed to update payment')
  }
}

export async function deletePayment(paymentId: string, contractId: string, documentUrl?: string): Promise<void> {
  try {
    // Delete payment document from storage if it exists
    if (documentUrl) {
      const filePath = extractFilePathFromUrl(documentUrl)
      if (filePath) {
        const storageRef = ref(storage, filePath)
        await deleteObject(storageRef)
      }
    }

    // Delete payment record
    await deleteDoc(doc(db, 'payments', paymentId))
    
    // Update contract payment summary
    await updateContractPaymentSummary(contractId)
  } catch (error) {
    console.error('Error deleting payment:', error)
    throw new Error('Failed to delete payment')
  }
}

// Contract Notes operations
export async function addContractNote(
  contractId: string,
  noteText: string,
  userId: string,
  userName?: string
): Promise<ContractNote> {
  try {
    const noteDoc = {
      text: noteText,
      createdAt: Timestamp.now(),
      createdBy: userId,
      createdByName: userName
    }

    const docRef = await addDoc(collection(db, 'groupContracts', contractId, 'notes'), noteDoc)
    
    // Convert Timestamp to Date for the return type
    const newNote = { 
      id: docRef.id, 
      ...noteDoc,
      createdAt: noteDoc.createdAt.toDate()
    } as ContractNote

    return newNote
  } catch (error) {
    console.error('Error adding contract note:', error)
    throw new Error('Failed to add contract note')
  }
}

export async function getContractNotes(contractId: string): Promise<ContractNote[]> {
  try {
    const notesQuery = query(
      collection(db, 'groupContracts', contractId, 'notes'),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(notesQuery)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
      } as ContractNote
    })
  } catch (error) {
    console.error('Error fetching contract notes:', error)
    throw new Error('Failed to fetch contract notes')
  }
}

export async function deleteContractNote(contractId: string, noteId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'groupContracts', contractId, 'notes', noteId))
  } catch (error) {
    console.error('Error deleting contract note:', error)
    throw new Error('Failed to delete contract note')
  }
}

// Helper functions

function getDocumentType(fileName: string, paymentMethod: string): string {
  const extension = fileName.toLowerCase().split('.').pop()
  
  if (paymentMethod === 'check') {
    return 'check'
  } else if (paymentMethod === 'wire') {
    return 'wire-confirmation'
  } else if (extension === 'pdf' && fileName.toLowerCase().includes('receipt')) {
    return 'receipt'
  }
  
  return 'other'
}

function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // Handle Firebase Storage URL format: /v0/b/BUCKET/o/ENCODED_PATH?...
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/)
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1])
    }
    // Fallback without query params
    const fallbackMatch = urlObj.pathname.match(/\/o\/(.+)$/)
    return fallbackMatch ? decodeURIComponent(fallbackMatch[1]) : null
  } catch {
    return null
  }
}

// Update contract payment summary after payment changes
export async function updateContractPaymentSummary(contractId: string): Promise<void> {
  try {
    console.log('🔄 Updating payment summary for contract:', contractId)
    
    // Get all payments for this contract
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('contractId', '==', contractId),
      where('status', '==', 'confirmed'), // Only count confirmed payments
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(paymentsQuery)
    const payments = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        paymentDate: data.paymentDate instanceof Timestamp ? data.paymentDate.toDate() : new Date(data.paymentDate)
      } as Payment
    })

    // Calculate payment totals
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const hasDepositPayment = payments.some(payment => payment.paymentType === 'deposit')
    
    // Get the contract to check total cost
    const contractRef = doc(db, 'groupContracts', contractId)
    const contractDoc = await getDoc(contractRef)
    
    if (!contractDoc.exists()) {
      console.error('Contract not found:', contractId)
      return
    }
    
    const contractData = contractDoc.data()
    const totalCost = contractData.totalCost || 0
    
    console.log('💰 Payment calculation:', { totalPaid, totalCost, hasDepositPayment })
    
    // Determine payment status
    const depositPaid = hasDepositPayment
    const paidInFull = totalPaid >= totalCost && totalPaid > 0
    
    const paymentStatus = paidInFull ? 'paid-in-full' : 
                         depositPaid ? 'deposit-paid' : 'unpaid'
    
    console.log('📊 New payment status:', paymentStatus)
    
    // Update contract with payment summary
    const updateData = {
      totalPaid,
      depositPaid,
      paidInFull,
      paymentStatus,
      paidInFullAt: paidInFull && !contractData.paidInFull ? Timestamp.now() : contractData.paidInFullAt || null,
      paidInFullBy: paidInFull && !contractData.paidInFull ? 'system' : contractData.paidInFullBy || null,
      depositPaidAt: depositPaid && !contractData.depositPaid ? Timestamp.now() : contractData.depositPaidAt || null,
      depositPaidBy: depositPaid && !contractData.depositPaid ? 'system' : contractData.depositPaidBy || null
    }
    
    await updateDoc(contractRef, updateData)
    console.log('✅ Contract payment summary updated successfully')
    
  } catch (error) {
    console.error('❌ Error updating contract payment summary:', error)
    throw new Error('Failed to update contract payment summary')
  }
}

// Debug function to recalculate all existing contracts
export async function recalculateAllContractPaymentStatuses(): Promise<void> {
  try {
    console.log('🚀 Starting bulk recalculation of all contract payment statuses...')
    
    // Get all contracts
    const contractsQuery = query(collection(db, 'groupContracts'))
    const querySnapshot = await getDocs(contractsQuery)
    const contracts = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as { id: string; groupName?: string }))
    
    console.log(`📋 Found ${contracts.length} contracts to process`)
    
    // Process each contract
    for (const contract of contracts) {
      try {
        await updateContractPaymentSummary(contract.id)
        console.log(`✅ Updated contract: ${contract.groupName || contract.id}`)
      } catch (error) {
        console.error(`❌ Failed to update contract ${contract.id}:`, error)
      }
    }
    
    console.log('🎉 Bulk recalculation completed')
  } catch (error) {
    console.error('❌ Error in bulk recalculation:', error)
    throw new Error('Failed to recalculate all contract payment statuses')
  }
}
