// services/rateSync.ts
import { db } from '../../firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp
} from 'firebase/firestore'
import type { RoomCategory } from '@/types'

/**
 * Ensures there is a rate doc for every (season × occupancyType) for this category.
 * Creates a default placeholder if missing.
 */
export async function ensureRatesForCategory (
  hotelId: string,
  category: Pick<RoomCategory, 'id' | 'occupancyTypes'>
) {
  // Get all seasons for this hotel
  const seasonsRef = collection(db, 'seasons')
  const seasonsQ = query(seasonsRef, where('hotelId', '==', hotelId))
  const seasonsSnap = await getDocs(seasonsQ)
  if (seasonsSnap.empty) return

  const ratesRef = collection(db, 'roomRates') // ⬅️ use your actual rates collection name

  // For each season × occupancyType, ensure a rate exists
  for (const seasonDoc of seasonsSnap.docs) {
    const seasonId = seasonDoc.id

    for (const occupancyType of category.occupancyTypes) {
      const existingQ = query(
        ratesRef,
        where('hotelId', '==', hotelId),
        where('categoryId', '==', category.id),
        where('seasonId', '==', seasonId),
        where('occupancyType', '==', occupancyType)
      )
      const existingSnap = await getDocs(existingQ)

      if (existingSnap.empty) {
        await addDoc(ratesRef, {
          hotelId,
          categoryId: category.id,
          seasonId,
          occupancyType,
          price: 0, // default placeholder
          currency: 'USD', // or omit/use your default
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      }
    }
  }
}
