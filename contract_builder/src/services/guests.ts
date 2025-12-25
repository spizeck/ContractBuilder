import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Guest, ImportError, DuplicateMatch } from "@/types/guestTypes";

const GUESTS_COLLECTION = "guests";
const IMPORT_BATCHES_COLLECTION = "importBatches";

// Create a single guest
export async function createGuest(
  guestData: Omit<Guest, "id" | "createdAt" | "updatedAt">,
  userId: string
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, GUESTS_COLLECTION), {
    ...guestData,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
  });
  return docRef.id;
}

// Update guest
export async function updateGuest(
  guestId: string,
  updates: Partial<Guest>
): Promise<void> {
  const docRef = doc(db, GUESTS_COLLECTION, guestId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// Get guest by ID
export async function getGuestById(guestId: string): Promise<Guest | null> {
  const docRef = doc(db, GUESTS_COLLECTION, guestId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Guest;
}

// Search guests (for duplicate detection)
export async function searchGuests(params: {
  name?: string;
  email?: string;
  phone?: string;
  bookingId?: number;
}): Promise<Guest[]> {
  const constraints = [];

  if (params.bookingId) {
    constraints.push(where("bookingId", "==", params.bookingId));
  }
  if (params.email) {
    constraints.push(where("email", "==", params.email.toLowerCase()));
  }

  const q = query(
    collection(db, GUESTS_COLLECTION),
    ...constraints,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Guest)
  );
}

// Find potential duplicates
export async function findDuplicates(
  guest: Partial<Guest>
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];

  // Exact booking ID match
  if (guest.bookingId) {
    const bookingMatches = await searchGuests({ bookingId: guest.bookingId });
    for (const existing of bookingMatches) {
      matches.push({
        existingGuest: existing,
        newGuest: guest,
        matchType: "booking_id",
        confidence: 1.0,
        conflicts: getConflicts(existing, guest),
      });
    }
  }

  // Email match
  if (guest.email) {
    const emailMatches = await searchGuests({ email: guest.email });
    for (const existing of emailMatches) {
      if (!matches.find((m) => m.existingGuest.id === existing.id)) {
        matches.push({
          existingGuest: existing,
          newGuest: guest,
          matchType: "email",
          confidence: 0.9,
          conflicts: getConflicts(existing, guest),
        });
      }
    }
  }

  // Phone match (if available)
  if (guest.phone) {
    const phoneMatches = await searchGuests({
      phone: normalizePhone(guest.phone),
    });
    for (const existing of phoneMatches) {
      if (!matches.find((m) => m.existingGuest.id === existing.id)) {
        matches.push({
          existingGuest: existing,
          newGuest: guest,
          matchType: "phone",
          confidence: 0.85,
          conflicts: getConflicts(existing, guest),
        });
      }
    }
  }

  // Fuzzy name match (consider using library like fuzzball.js)
  const allGuests = await getAllGuests();
  for (const existing of allGuests) {
    if (matches.find((m) => m.existingGuest.id === existing.id)) continue;

    const similarity = calculateNameSimilarity(
      guest.fullName || "",
      existing.fullName
    );
    if (similarity > 0.8) {
      matches.push({
        existingGuest: existing,
        newGuest: guest,
        matchType: "fuzzy_name",
        confidence: similarity,
        conflicts: getConflicts(existing, guest),
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

// Helper: Get conflicting fields
function getConflicts(existing: Guest, newGuest: Partial<Guest>): string[] {
  const conflicts: string[] = [];
  const fieldsToCheck = [
    "fullName",
    "email",
    "phone",
    "accommodations",
    "bookingId",
  ];

  for (const field of fieldsToCheck) {
    const existingVal = existing[field as keyof Guest];
    const newVal = newGuest[field as keyof Guest];

    if (newVal && existingVal && existingVal !== newVal) {
      conflicts.push(field);
    }
  }

  return conflicts;
}

// Helper: Normalize phone numbers
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Helper: Calculate name similarity (simple Levenshtein)
function calculateNameSimilarity(name1: string, name2: string): number {
  const a = name1.toLowerCase().trim();
  const b = name2.toLowerCase().trim();

  if (a === b) return 1.0;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

// Get all guests
export async function getAllGuests(): Promise<Guest[]> {
  const snapshot = await getDocs(collection(db, GUESTS_COLLECTION));
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Guest)
  );
}

// Batch import with duplicate detection
export async function importGuestsFromCSV(
  guests: Partial<Guest>[],
  fileName: string,
  userId: string
): Promise<{
  batchId: string;
  imported: number;
  duplicates: DuplicateMatch[];
  errors: ImportError[];
}> {
  const batchId = doc(collection(db, IMPORT_BATCHES_COLLECTION)).id;
  const duplicates: DuplicateMatch[] = [];
  const errors: ImportError[] = [];
  let imported = 0;

  // Create batch record
  await addDoc(collection(db, IMPORT_BATCHES_COLLECTION), {
    id: batchId,
    fileName,
    importedAt: Timestamp.now(),
    importedBy: userId,
    guestCount: guests.length,
    duplicateCount: 0,
    status: "processing",
  });

  // Process each guest
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i];

    // Validate required fields
    if (!guest.fullName) {
      errors.push({
        row: i + 1,
        field: "fullName",
        value: "",
        reason: "Name is required",
      });
      continue;
    }

    // Check for duplicates
    const potentialDuplicates = await findDuplicates(guest);

    if (potentialDuplicates.length > 0) {
      // High confidence match - flag as duplicate
      if (potentialDuplicates[0].confidence > 0.9) {
        duplicates.push(potentialDuplicates[0]);
        continue;
      }
    }

    // Import guest
    try {
      await createGuest(
        {
          ...guest,
          source: "waiver_import",
          importBatchId: batchId,
          matchStatus: "needs_review",
        } as Omit<Guest, "id" | "createdAt" | "updatedAt">,
        userId
      );
      imported++;
    } catch (error) {
      errors.push({
        row: i + 1,
        field: "unknown",
        value: JSON.stringify(guest),
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Update batch status
  await updateDoc(doc(db, IMPORT_BATCHES_COLLECTION, batchId), {
    status: "completed",
    duplicateCount: duplicates.length,
  });

  return {
    batchId,
    imported,
    duplicates,
    errors,
  };
}
