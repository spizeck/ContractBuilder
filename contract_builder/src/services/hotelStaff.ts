import { db } from '../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  DocumentData,
} from 'firebase/firestore'
import { Hotel, GroupContract } from '@/types/contractTypes'
import { UserProfile } from '@/types/userTypes'

// Get hotel assigned to a staff user
export async function getHotelByStaffId(staffId: string): Promise<Hotel | null> {
  try {
    console.log('Getting hotel for staff:', staffId)
    
    // First get the user to find their assigned hotel
    const userRef = doc(db, 'users', staffId)
    console.log('Fetching user document...')
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      console.error('Staff user not found:', staffId)
      return null
    }

    const userData = userSnap.data() as UserProfile
    console.log('User data:', { uid: userData.uid, role: userData.role, hotelId: userData.hotelId })
    
    if (!userData.hotelId) {
      console.error('Staff user has no assigned hotel:', staffId)
      return null
    }

    // Get the hotel details
    console.log('Fetching hotel details for:', userData.hotelId)
    const hotelRef = doc(db, 'hotels', userData.hotelId)
    const hotelSnap = await getDoc(hotelRef)
    
    if (hotelSnap.exists()) {
      const hotelData = { id: hotelSnap.id, ...(hotelSnap.data() as Omit<Hotel, 'id'>) }
      console.log('Hotel data retrieved:', hotelData.name)
      return hotelData
    } else {
      console.error('Assigned hotel not found:', userData.hotelId)
      return null
    }
  } catch (e) {
    console.error('Error getting hotel for staff:', e)
    return null
  }
}

// Get contracts assigned to a specific hotel
export async function getContractsByHotelId(hotelId: string): Promise<GroupContract[]> {
  try {
    const contractsQuery = query(
      collection(db, 'groupContracts'),
      where('hotelId', '==', hotelId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(contractsQuery)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<GroupContract, 'id'>)
    }))
  } catch (e) {
    console.error('Error getting contracts for hotel:', e)
    return []
  }
}

// Get contracts for a staff user (by their assigned hotel)
export async function getContractsForStaff(staffId: string): Promise<GroupContract[]> {
  try {
    console.log('Getting contracts for staff:', staffId)
    
    const hotel = await getHotelByStaffId(staffId)
    if (!hotel) {
      console.log('No hotel found for staff, returning empty contracts')
      return []
    }
    
    console.log('Fetching contracts for hotel:', hotel.id)
    const contracts = await getContractsByHotelId(hotel.id)
    console.log('Contracts retrieved:', contracts.length)
    return contracts
  } catch (e) {
    console.error('Error getting contracts for staff:', e)
    return []
  }
}

// Update hotel details (staff can only update their assigned hotel)
export async function updateHotelDetails(
  staffId: string, 
  hotelId: string, 
  hotelData: Partial<Hotel>
): Promise<boolean> {
  try {
    // Verify the staff is assigned to this hotel
    const staffHotel = await getHotelByStaffId(staffId)
    if (!staffHotel || staffHotel.id !== hotelId) {
      console.error('Staff not authorized to update this hotel')
      return false
    }

    const hotelRef = doc(db, 'hotels', hotelId)
    await updateDoc(hotelRef, hotelData)
    console.log('Hotel updated successfully:', hotelId)
    return true
  } catch (e) {
    console.error('Error updating hotel:', e)
    return false
  }
}

// Get staff user profile with hotel information
export async function getStaffProfile(staffId: string): Promise<(UserProfile & { hotel?: Hotel }) | null> {
  try {
    const userRef = doc(db, 'users', staffId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return null
    }

    const userData = userSnap.data() as UserProfile
    
    // If staff has assigned hotel, fetch hotel details
    let hotel: Hotel | undefined = undefined
    if (userData.hotelId) {
      const hotelData = await getHotelByStaffId(staffId)
      hotel = hotelData || undefined
    }

    return { ...userData, hotel }
  } catch (e) {
    console.error('Error getting staff profile:', e)
    return null
  }
}
