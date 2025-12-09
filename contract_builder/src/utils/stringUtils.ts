/**
 * Normalize a name to proper title case
 * Handles various formats: "JOHN DOE" -> "John Doe", "john doe" -> "John Doe", "McDONALD" -> "McDonald"
 */
export function normalizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0)
    .map((word, index) => {
      // Handle common name prefixes and special cases
      const specialCases = ['mc', 'mac', 'o\'', 'de', 'van', 'von', 'del'];
      const lowerWord = word.toLowerCase();
      
      // Check for special cases (McDonald, O'Connor, etc.)
      for (const special of specialCases) {
        if (lowerWord.startsWith(special) && word.length > special.length) {
          return special.charAt(0).toUpperCase() + 
                 special.slice(1) + 
                 word.charAt(special.length).toUpperCase() + 
                 word.slice(special.length + 1).toLowerCase();
        }
      }
      
      // Handle hyphenated names (mary-jane -> Mary-Jane)
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join('-');
      }
      
      // Standard capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .trim();
}

/**
 * Normalize email address to lowercase
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.toLowerCase().trim();
}

/**
 * Normalize phone number format
 * Removes extra spaces, dashes, and parentheses
 */
export function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  return phone.replace(/[\s\-\(\)]/g, '').trim();
}
