/**
 * Redaction Patterns Library
 * Defines regex patterns and functions for identifying and redacting PII
 */

export interface RedactionPattern {
  id: string;
  name: string;
  regex: RegExp;
  replacement: string;
  description: string;
}

export interface RedactionMatch {
  text: string;
  start: number;
  end: number;
  type: string;
  replacement: string;
}

// Common PII patterns
export const REDACTION_PATTERNS: Record<string, RedactionPattern> = {
  SSN: {
    id: 'ssn',
    name: 'Social Security Number',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN REDACTED]',
    description: 'Matches SSN in format: XXX-XX-XXXX'
  },
  CREDIT_CARD: {
    id: 'credit_card',
    name: 'Credit Card Number',
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: '[CREDIT CARD REDACTED]',
    description: 'Matches 16-digit credit card numbers'
  },
  EMAIL: {
    id: 'email',
    name: 'Email Address',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL REDACTED]',
    description: 'Matches email addresses'
  },
  PHONE: {
    id: 'phone',
    name: 'Phone Number',
    regex: /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    replacement: '[PHONE REDACTED]',
    description: 'Matches US and international phone numbers'
  },
  DOB: {
    id: 'dob',
    name: 'Date of Birth',
    regex: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](\d{2}|\d{4})\b/g,
    replacement: '[DOB REDACTED]',
    description: 'Matches dates in MM/DD/YYYY or MM-DD-YYYY format'
  },
  ADDRESS: {
    id: 'address',
    name: 'Street Address',
    regex: /\b\d{1,5}\s+([A-Z][a-z]*\s?)+\b(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way)\b/gi,
    replacement: '[ADDRESS REDACTED]',
    description: 'Matches street addresses'
  },
  ZIP_CODE: {
    id: 'zip',
    name: 'ZIP Code',
    regex: /\b\d{5}(-\d{4})?\b/g,
    replacement: '[ZIP REDACTED]',
    description: 'Matches 5 or 9-digit ZIP codes'
  }
};

/**
 * Find all matches for a pattern in text
 */
export function findPatternMatches(
  text: string,
  pattern: RedactionPattern
): RedactionMatch[] {
  const matches: RedactionMatch[] = [];
  let match: RegExpExecArray | null;
  
  // Reset regex lastIndex
  pattern.regex.lastIndex = 0;
  
  while ((match = pattern.regex.exec(text)) !== null) {
    matches.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      type: pattern.id,
      replacement: pattern.replacement
    });
  }
  
  return matches;
}

/**
 * Find all text search matches (case-sensitive or insensitive)
 */
export function findTextMatches(
  text: string,
  searchTerm: string,
  caseSensitive: boolean = false,
  replacement: string = '[REDACTED]'
): RedactionMatch[] {
  const matches: RedactionMatch[] = [];
  
  if (!searchTerm) return matches;
  
  const flags = caseSensitive ? 'g' : 'gi';
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedTerm, flags);
  
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      type: 'custom',
      replacement: replacement
    });
  }
  
  return matches;
}

/**
 * Find all redaction matches based on enabled patterns and search terms
 */
export function findAllRedactions(
  text: string,
  enabledPatterns: string[],
  searchTerms: Array<{ term: string; caseSensitive: boolean }> = []
): RedactionMatch[] {
  const allMatches: RedactionMatch[] = [];
  
  // Find pattern matches
  enabledPatterns.forEach(patternId => {
    const pattern = REDACTION_PATTERNS[patternId];
    if (pattern) {
      const matches = findPatternMatches(text, pattern);
      allMatches.push(...matches);
    }
  });
  
  // Find text search matches
  searchTerms.forEach(({ term, caseSensitive }) => {
    const matches = findTextMatches(text, term, caseSensitive);
    allMatches.push(...matches);
  });
  
  // Sort by start position and remove duplicates
  allMatches.sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches (keep first occurrence)
  const uniqueMatches: RedactionMatch[] = [];
  let lastEnd = -1;
  
  allMatches.forEach(match => {
    if (match.start >= lastEnd) {
      uniqueMatches.push(match);
      lastEnd = match.end;
    }
  });
  
  return uniqueMatches;
}

/**
 * Apply redactions to text
 */
export function applyRedactions(
  text: string,
  matches: RedactionMatch[]
): string {
  if (matches.length === 0) return text;
  
  let redactedText = '';
  let lastIndex = 0;
  
  matches.forEach(match => {
    // Add text before the match
    redactedText += text.slice(lastIndex, match.start);
    // Add replacement
    redactedText += match.replacement;
    // Update last index
    lastIndex = match.end;
  });
  
  // Add remaining text
  redactedText += text.slice(lastIndex);
  
  return redactedText;
}

/**
 * Get summary of redactions
 */
export function getRedactionSummary(matches: RedactionMatch[]): {
  total: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  
  matches.forEach(match => {
    const typeName = REDACTION_PATTERNS[match.type]?.name || 'Custom Text';
    byType[typeName] = (byType[typeName] || 0) + 1;
  });
  
  return {
    total: matches.length,
    byType
  };
}

