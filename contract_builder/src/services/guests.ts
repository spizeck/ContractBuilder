import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { 
  Guest, 
  ImportError, 
  DuplicateMatch, 
  FieldConflict,
  GuestFilter,
  GuestSearchResult,
  GuestValidationResult,
  ValidationError,
  ValidationWarning,
  ImportBatch,
  GuestSource,
  DataPriority,
  DuplicateGroup,
  BookingGroup
} from "@/types/guestTypes";

// Priority values for data sources
const PRIORITY_MAP: Record<GuestSource, DataPriority> = {
  'manual': 'high',      // Staff edits have highest priority
  'checkfront': 'medium', // Booking system has medium priority
  'waiver_import': 'low'  // Waiver imports have lowest priority
};

// Local normalization function
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

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
    dataPriority: guestData.dataPriority || PRIORITY_MAP[guestData.source],
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    lastUpdatedBy: userId,
  });
  return docRef.id;
}

// Update guest
export async function updateGuest(
  guestId: string,
  updates: Partial<Guest>,
  userId?: string
): Promise<void> {
  const docRef = doc(db, GUESTS_COLLECTION, guestId);
  
  // Get current guest to check priority
  const currentGuest = await getGuestById(guestId);
  if (!currentGuest) throw new Error("Guest not found");
  
  // Determine if update should override based on priority
  const updateData = { ...updates };
  const incomingPriority = updates.dataPriority || 'medium';
  
  // Only update fields if incoming has higher or equal priority
  if (getPriorityValue(incomingPriority) < getPriorityValue(currentGuest.dataPriority)) {
    // Lower priority - only update if explicitly marked as recent data
    if (updates.source !== 'manual') {
      // Don't override high priority data with low priority
      const protectedFields: (keyof Guest)[] = ['fullName', 'email', 'phone'];
      for (const field of protectedFields) {
        if (currentGuest[field] && updates[field]) {
          delete updateData[field];
        }
      }
    }
  }
  
  // Always update priority to the highest
  updateData.dataPriority = getHighestPriority(currentGuest.dataPriority, incomingPriority);
  
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: Timestamp.now(),
    ...(userId && { lastUpdatedBy: userId }),
  });
}

// Helper function to get priority value
function getPriorityValue(priority: DataPriority): number {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

// Helper function to get highest priority
function getHighestPriority(p1: DataPriority, p2: DataPriority): DataPriority {
  return getPriorityValue(p1) >= getPriorityValue(p2) ? p1 : p2;
}

// Merge guest data with priority logic
export async function mergeGuestData(
  existingGuest: Guest,
  newGuestData: Partial<Guest>,
  userId: string
): Promise<Guest> {
  const merged: Record<string, any> = { ...existingGuest };
  
  // Determine priority for each field
  const incomingPriority = newGuestData.dataPriority || PRIORITY_MAP[newGuestData.source || 'manual'];
  
  // Fields to check for conflicts
  const fieldsToMerge: (keyof Guest)[] = [
    'fullName', 'email', 'phone', 'accommodations', 'certificationLevel',
    'certificationAgency', 'nitroxCertified', 'emergencyContact',
    'medicalNotes', 'specialRequirements', 'lastDiveDate', 'totalDives'
  ];
  
  for (const field of fieldsToMerge) {
    const existingVal = existingGuest[field];
    const newVal = newGuestData[field];
    
    if (newVal && existingVal !== newVal) {
      // Use the value with higher priority, or newest if same priority
      const existingPriority = existingGuest.dataPriority;
      
      if (getPriorityValue(incomingPriority) > getPriorityValue(existingPriority)) {
        // Incoming has higher priority
        merged[field] = newVal;
      } else if (getPriorityValue(incomingPriority) === getPriorityValue(existingPriority)) {
        // Same priority - use the most recent (newGuestData)
        merged[field] = newVal;
      }
      // If existing has higher priority, keep existing value
    }
  }
  
  // Update metadata
  merged.updatedAt = Timestamp.now();
  merged.lastUpdatedBy = userId;
  merged.dataPriority = getHighestPriority(existingGuest.dataPriority, incomingPriority);
  
  // Save the merged data
  await updateGuest(existingGuest.id, merged as Partial<Guest>, userId);
  
  // Return the updated guest
  return await getGuestById(existingGuest.id) as Guest;
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

// Find potential duplicates using multi-factor analysis
export async function findPotentialDuplicates(
  newGuest: Partial<Guest>,
  existingGuests: Guest[]
): Promise<DuplicateGroup[]> {
  const groups: Map<string, DuplicateGroup> = new Map();
  
  for (const existing of existingGuests) {
    const analysis = analyzeDuplicateProbability(newGuest, existing);
    
    // Only flag if there's actual duplicate concern
    if (analysis.isDuplicate) {
      const groupKey = analysis.groupKey;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          suspects: [existing],
          matchReasons: analysis.reasons,
          confidence: analysis.confidence,
          resolutionStatus: 'pending',
        });
      } else {
        const group = groups.get(groupKey)!;
        group.suspects.push(existing);
        group.matchReasons = [...new Set([...group.matchReasons, ...analysis.reasons])];
      }
    }
  }
  
  return Array.from(groups.values());
}

interface DuplicateAnalysis {
  isDuplicate: boolean;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  groupKey: string;
}

function analyzeDuplicateProbability(
  newGuest: Partial<Guest>,
  existing: Guest
): DuplicateAnalysis {
  const reasons: string[] = [];
  let score = 0;
  
  // **SCENARIO 1: Same booking, same name = LIKELY DUPLICATE**
  const sameBooking = newGuest.bookingId && newGuest.bookingId === existing.bookingId;
  const sameName = normalizedNameMatch(newGuest.fullName || '', existing.fullName);
  
  if (sameBooking && sameName > 0.9) {
    reasons.push('Same booking ID and name');
    score += 100; // This is almost certainly a duplicate
  }
  
  // **SCENARIO 2: Same booking, different name = PROBABLY NOT DUPLICATE**
  // (Multiple people in group)
  if (sameBooking && sameName < 0.7) {
    // Not a duplicate - same booking, different person
    return {
      isDuplicate: false,
      confidence: 'high',
      reasons: ['Same booking but different person'],
      groupKey: '',
    };
  }
  
  // **SCENARIO 3: Different booking, same name = INVESTIGATE**
  const differentBooking = newGuest.bookingId && 
                          existing.bookingId && 
                          newGuest.bookingId !== existing.bookingId;
  
  if (differentBooking && sameName > 0.9) {
    reasons.push('Same name, different bookings');
    score += 50; // Could be returning customer or coincidence
    
    // Additional checks for returning customers
    if (newGuest.email && existing.email && 
        newGuest.email.toLowerCase() === existing.email.toLowerCase()) {
      reasons.push('Same email across bookings (returning customer)');
      score += 30;
    }
    
    if (newGuest.phone && existing.phone && 
        normalizePhone(newGuest.phone) === normalizePhone(existing.phone)) {
      reasons.push('Same phone across bookings');
      score += 20;
    }
  }
  
  // **SCENARIO 4: No booking ID match, but strong name + contact match**
  if (!sameBooking) {
    if (sameName > 0.9) {
      score += 40;
      reasons.push('Very similar names');
    }
    
    if (newGuest.email && existing.email && 
        newGuest.email.toLowerCase() === existing.email.toLowerCase()) {
      score += 30;
      reasons.push('Exact email match');
    }
    
    if (newGuest.phone && existing.phone && 
        normalizePhone(newGuest.phone) === normalizePhone(existing.phone)) {
      score += 25;
      reasons.push('Exact phone match');
    }
  }
  
  // **Determine if this is a duplicate**
  const isDuplicate = score >= 60; // Threshold for flagging
  
  let confidence: 'high' | 'medium' | 'low';
  if (score >= 90) confidence = 'high';
  else if (score >= 70) confidence = 'medium';
  else confidence = 'low';
  
  return {
    isDuplicate,
    confidence,
    reasons,
    groupKey: generateGroupKey(newGuest, existing, reasons),
  };
}

function normalizedNameMatch(name1: string, name2: string): number {
  const normalize = (name: string) => 
    name.toLowerCase()
      .trim()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ');
  
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  
  if (n1 === n2) return 1.0;
  
  // Check for nickname variations (could expand this)
  const nicknames: Record<string, string[]> = {
    'william': ['will', 'bill', 'billy'],
    'robert': ['rob', 'bob', 'bobby'],
    'michael': ['mike', 'mikey'],
    'elizabeth': ['liz', 'beth', 'betty'],
    // Add more as needed
  };
  
  for (const [full, nicks] of Object.entries(nicknames)) {
    if ((n1.includes(full) && nicks.some(n => n2.includes(n))) ||
        (n2.includes(full) && nicks.some(n => n1.includes(n)))) {
      return 0.85;
    }
  }
  
  // Levenshtein distance
  return calculateSimilarity(n1, n2);
}

function generateGroupKey(
  guest1: Partial<Guest>,
  guest2: Guest,
  reasons: string[]
): string {
  // Create a stable key for grouping related duplicates
  const bookingKey = guest1.bookingId || guest2.bookingId || 'no-booking';
  const nameKey = (guest1.fullName || guest2.fullName).toLowerCase().slice(0, 10);
  return `${bookingKey}-${nameKey}`;
}

function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
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
  
  return matrix[s2.length][s1.length];
}

// Group guests by booking ID
export async function getBookingGroups(
  bookingIds?: number[]
): Promise<BookingGroup[]> {
  let guests: Guest[];
  
  if (bookingIds && bookingIds.length > 0) {
    // Fetch specific bookings
    const promises = bookingIds.map(id => 
      getDocs(query(collection(db, 'guests'), where('bookingId', '==', id)))
    );
    const snapshots = await Promise.all(promises);
    guests = snapshots.flatMap(snap => 
      snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guest))
    );
  } else {
    // Get all guests
    guests = await getAllGuestsLegacy();
  }
  
  // Group by booking ID
  const groupMap = new Map<number, Guest[]>();
  const noBooking: Guest[] = [];
  
  for (const guest of guests) {
    if (guest.bookingId) {
      if (!groupMap.has(guest.bookingId)) {
        groupMap.set(guest.bookingId, []);
      }
      groupMap.get(guest.bookingId)!.push(guest);
    } else {
      noBooking.push(guest);
    }
  }
  
  // Create booking groups
  const groups: BookingGroup[] = [];
  
  for (const [bookingId, bookingGuests] of groupMap) {
    const primaryContact = bookingGuests.find(g => g.isGroupLead) || bookingGuests[0];
    
    groups.push({
      bookingId,
      guests: bookingGuests,
      actualCount: bookingGuests.length,
      status: 'complete', // Will be updated based on expected count
      primaryContact,
    });
  }
  
  return groups;
}
export async function findDuplicates(
  guest: Partial<Guest>
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];

  // HIGH CONFIDENCE MATCHES (require multiple matching fields)
  
  // Email + Name match (very high confidence)
  if (guest.email && guest.fullName) {
    const emailMatches = await searchGuests({ email: guest.email });
    for (const existing of emailMatches) {
      const nameSimilarity = calculateNameSimilarity(
        guest.fullName.toLowerCase(),
        existing.fullName.toLowerCase()
      );
      if (nameSimilarity > 0.85) {
        matches.push({
          existingGuest: existing,
          newGuest: guest,
          matchType: "email",
          confidence: 0.95,
          conflicts: getConflicts(existing, guest),
        });
      }
    }
  }

  // Phone + Name match (high confidence)
  if (guest.phone && guest.fullName) {
    const phoneMatches = await searchGuests({
      phone: normalizePhone(guest.phone),
    });
    for (const existing of phoneMatches) {
      if (!matches.find((m) => m.existingGuest.id === existing.id)) {
        const nameSimilarity = calculateNameSimilarity(
          guest.fullName.toLowerCase(),
          existing.fullName.toLowerCase()
        );
        if (nameSimilarity > 0.85) {
          matches.push({
            existingGuest: existing,
            newGuest: guest,
            matchType: "phone",
            confidence: 0.9,
            conflicts: getConflicts(existing, guest),
          });
        }
      }
    }
  }

  // Booking ID + Name match (medium confidence - same booking could be multiple people)
  if (guest.bookingId && guest.fullName) {
    const bookingMatches = await searchGuests({ bookingId: Number(guest.bookingId) });
    for (const existing of bookingMatches) {
      if (!matches.find((m) => m.existingGuest.id === existing.id)) {
        const nameSimilarity = calculateNameSimilarity(
          guest.fullName.toLowerCase(),
          existing.fullName.toLowerCase()
        );
        // Require very high name similarity for booking ID matches
        if (nameSimilarity > 0.95) {
          matches.push({
            existingGuest: existing,
            newGuest: guest,
            matchType: "booking_id",
            confidence: 0.7,
            conflicts: getConflicts(existing, guest),
          });
        }
      }
    }
  }

  // LOWER CONFIDENCE MATCHES (single field only)
  
  // Exact email match only (medium confidence - could be family sharing email)
  if (guest.email && !matches.some(m => m.matchType === "email")) {
    const emailMatches = await searchGuests({ email: guest.email });
    for (const existing of emailMatches) {
      if (!matches.find((m) => m.existingGuest.id === existing.id)) {
        matches.push({
          existingGuest: existing,
          newGuest: guest,
          matchType: "email",
          confidence: 0.6,
          conflicts: getConflicts(existing, guest),
        });
      }
    }
  }

  // Exact phone match only (low confidence - could be family/shared number)
  if (guest.phone && !matches.some(m => m.matchType === "phone")) {
    const phoneMatches = await searchGuests({
      phone: normalizePhone(guest.phone),
    });
    for (const existing of phoneMatches) {
      if (!matches.find((m) => m.existingGuest.id === existing.id)) {
        matches.push({
          existingGuest: existing,
          newGuest: guest,
          matchType: "phone",
          confidence: 0.5,
          conflicts: getConflicts(existing, guest),
        });
      }
    }
  }

  // Fuzzy name match only (lowest confidence - common names)
  if (guest.fullName && !matches.some(m => m.matchType === "fuzzy_name")) {
    const allGuests = await getAllGuestsLegacy();
    for (const existing of allGuests) {
      if (matches.find((m) => m.existingGuest.id === existing.id)) continue;

      const similarity = calculateNameSimilarity(
        guest.fullName.toLowerCase(),
        existing.fullName.toLowerCase()
      );
      // Only flag very high similarity for names alone
      if (similarity > 0.95) {
        matches.push({
          existingGuest: existing,
          newGuest: guest,
          matchType: "fuzzy_name",
          confidence: similarity * 0.4, // Lower confidence for fuzzy matches
          conflicts: getConflicts(existing, guest),
        });
      }
    }
  }

  // Sort by confidence and only return matches above threshold
  return matches
    .filter(m => m.confidence > 0.5) // Only return matches with >50% confidence
    .sort((a, b) => b.confidence - a.confidence);
}

// Helper: Get conflicting fields
function getConflicts(existing: Guest, newGuest: Partial<Guest>): FieldConflict[] {
  const conflicts: FieldConflict[] = [];
  const fieldsToCheck: (keyof Guest)[] = [
    "fullName",
    "email",
    "phone",
    "accommodations",
    "bookingId",
    "certificationLevel",
    "certificationAgency",
    "nitroxCertified",
    "emergencyContact",
    "medicalNotes",
  ];

  for (const field of fieldsToCheck) {
    const existingVal = existing[field];
    const newVal = newGuest[field];

    if (newVal && existingVal && existingVal !== newVal) {
      conflicts.push({
        field,
        existingValue: existingVal,
        incomingValue: newVal,
      });
    }
  }

  return conflicts;
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

// Get all guests with filtering
export async function getAllGuests(filter?: GuestFilter, limitCount = 100): Promise<GuestSearchResult> {
  let q = query(
    collection(db, GUESTS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  // Apply filters
  if (filter) {
    const conditions = [];
    
    if (filter.matchStatus) {
      conditions.push(where('matchStatus', '==', filter.matchStatus));
    }
    
    if (filter.source) {
      conditions.push(where('source', '==', filter.source));
    }
    
    if (filter.importBatchId) {
      conditions.push(where('importBatchId', '==', filter.importBatchId));
    }
    
    if (conditions.length > 0) {
      q = query(collection(db, GUESTS_COLLECTION), ...conditions, orderBy('createdAt', 'desc'), limit(limitCount));
    }
  }

  const querySnapshot = await getDocs(q);
  const guests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Guest);
  
  // Apply client-side filtering for search term
  let filteredGuests = guests;
  if (filter?.searchTerm) {
    const term = filter.searchTerm.toLowerCase();
    filteredGuests = guests.filter(guest => 
      guest.fullName.toLowerCase().includes(term) ||
      guest.email?.toLowerCase().includes(term) ||
      guest.phone?.includes(term) ||
      guest.bookingId?.toString().includes(term) ||
      guest.accommodations?.toLowerCase().includes(term)
    );
  }

  return {
    guests: filteredGuests,
    total: filteredGuests.length,
    hasMore: guests.length === limitCount,
  };
}

// Legacy version for backward compatibility
export async function getAllGuestsLegacy(): Promise<Guest[]> {
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

    // Set priority based on source
    const guestWithPriority = {
      ...guest,
      source: guest.source || 'waiver_import',
      dataPriority: PRIORITY_MAP[guest.source || 'waiver_import'],
      importBatchId: batchId,
    };

    // Check for duplicates
    const potentialDuplicates = await findDuplicates(guestWithPriority);

    if (potentialDuplicates.length > 0) {
      // Only auto-merge high confidence duplicates (>80%)
      const highConfidenceMatch = potentialDuplicates.find(m => m.confidence > 0.8);
      
      if (highConfidenceMatch) {
        // Auto-merge high confidence duplicates
        const existingGuest = highConfidenceMatch.existingGuest;
        
        try {
          await mergeGuestData(existingGuest, guestWithPriority, userId);
          duplicates.push(highConfidenceMatch);
        } catch (error) {
          errors.push({
            row: i + 1,
            field: "merge",
            value: guestWithPriority.fullName || "",
            reason: "Failed to merge guest data",
          });
        }
      } else {
        // Lower confidence matches - mark for manual review
        duplicates.push(potentialDuplicates[0]);
      }
    } else {
      // No duplicates - create new guest
      try {
        // Ensure required fields are present
        const guestToCreate = {
          ...guestWithPriority,
          fullName: guestWithPriority.fullName || 'Unknown',
          duplicateStatus: 'clean' as const,
        };
        await createGuest(guestToCreate, userId);
        imported++;
      } catch (error) {
        errors.push({
          row: i + 1,
          field: "create",
          value: guestWithPriority.fullName || "",
          reason: "Failed to create guest",
        });
      }
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

// Delete guest
export async function deleteGuest(guestId: string): Promise<void> {
  await deleteDoc(doc(db, GUESTS_COLLECTION, guestId));
}

// Validate guest data
export async function validateGuestData(guestData: any): Promise<GuestValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Required fields
  if (!guestData.fullName?.trim()) {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  }
  
  if (!guestData.source) {
    errors.push({ field: 'source', message: 'Source is required' });
  }
  
  // Email validation
  if (guestData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestData.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }
  
  // Phone validation
  if (guestData.phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(guestData.phone)) {
      warnings.push({ field: 'phone', message: 'Phone number format may be invalid' });
    }
  }
  
  // Certification validation
  if (guestData.certificationLevel) {
    const validLevels = ['Open Water', 'Advanced Open Water', 'Rescue Diver', 'Divemaster', 'Instructor'];
    if (!validLevels.some(level => guestData.certificationLevel.toLowerCase().includes(level.toLowerCase()))) {
      warnings.push({ field: 'certificationLevel', message: 'Unrecognized certification level' });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Import batch services
export async function createImportBatch(batchData: Omit<ImportBatch, 'id' | 'importedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, IMPORT_BATCHES_COLLECTION), {
    ...batchData,
    importedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getImportBatch(id: string): Promise<ImportBatch | null> {
  const docSnap = await getDoc(doc(db, IMPORT_BATCHES_COLLECTION, id));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as ImportBatch : null;
}

export async function getAllImportBatches(): Promise<ImportBatch[]> {
  const q = query(
    collection(db, IMPORT_BATCHES_COLLECTION),
    orderBy('importedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ImportBatch);
}

// Merge multiple guests into one
export async function mergeGuests(
  guests: Guest[],
  userId: string,
  notes?: string
): Promise<void> {
  if (guests.length < 2) return;
  
  // Sort by priority and date to find the primary guest
  const sortedGuests = [...guests].sort((a, b) => {
    // First by data priority
    const priorityDiff = getPriorityValue(b.dataPriority) - getPriorityValue(a.dataPriority);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by update date
    return b.updatedAt.toMillis() - a.updatedAt.toMillis();
  });
  
  const primary = sortedGuests[0];
  const duplicates = sortedGuests.slice(1);
  
  // Merge all data into primary
  const mergedData: Record<string, any> = { ...primary };
  
  for (const duplicate of duplicates) {
    // Merge fields with priority logic
    const fieldsToMerge: (keyof Guest)[] = [
      'fullName', 'email', 'phone', 'accommodations', 'certificationLevel',
      'certificationAgency', 'nitroxCertified', 'emergencyContact',
      'medicalNotes', 'specialRequirements', 'lastDiveDate', 'totalDives'
    ];
    
    for (const field of fieldsToMerge) {
      const duplicateVal = duplicate[field];
      const primaryVal = primary[field];
      
      if (duplicateVal && duplicateVal !== primaryVal) {
        // Use the value with higher priority
        const duplicatePriority = getPriorityValue(duplicate.dataPriority);
        const primaryPriority = getPriorityValue(primary.dataPriority);
        
        if (duplicatePriority > primaryPriority) {
          mergedData[field] = duplicateVal;
        }
      }
    }
  }
  
  // Update metadata
  mergedData.updatedAt = Timestamp.now();
  mergedData.lastUpdatedBy = userId;
  mergedData.duplicateStatus = 'merged';
  mergedData.duplicateNotes = notes;
  mergedData.dataPriority = 'high'; // Merged records get high priority
  
  // Save the merged guest
  await updateGuest(primary.id, mergedData as Partial<Guest>, userId);
  
  // Mark duplicates as merged
  for (const duplicate of duplicates) {
    await updateGuest(duplicate.id, {
      duplicateStatus: 'merged',
      mergedIntoGuestId: primary.id,
      duplicateNotes: notes,
      updatedAt: Timestamp.now(),
      lastUpdatedBy: userId,
    }, userId);
  }
}

// Confirm guests are different (not duplicates)
export async function confirmDifferentGuests(
  guests: Guest[],
  userId: string,
  notes?: string
): Promise<void> {
  for (const guest of guests) {
    await updateGuest(guest.id, {
      duplicateStatus: 'confirmed_unique',
      duplicateNotes: notes,
      updatedAt: Timestamp.now(),
      lastUpdatedBy: userId,
    }, userId);
  }
}

// Update import batch status
export async function updateImportBatchStatus(
  batchId: string, 
  status: ImportBatch['status'], 
  duplicateCount?: number
): Promise<void> {
  const updateData: any = { status };
  if (duplicateCount !== undefined) {
    updateData.duplicateCount = duplicateCount;
  }
  
  await updateDoc(doc(db, IMPORT_BATCHES_COLLECTION, batchId), updateData);
}
