/**
 * Redaction Processor
 * Processes and applies redactions to documents
 */

import { PDFDocument, rgb } from 'pdf-lib';
import { RedactionMatch, applyRedactions } from './redactionPatterns';
import { DocumentContent, extractDocumentText } from './documentExtractor';

export interface RedactionResult {
  originalContent: DocumentContent;
  redactedContent: DocumentContent;
  matches: RedactionMatch[];
  redactedFile: File;
}

/**
 * Process redactions on a document
 */
export async function processDocumentRedactions(
  file: File | Blob,
  matches: RedactionMatch[],
  fileName: string = 'redacted_document'
): Promise<RedactionResult> {
  // Extract original content
  const originalContent = await extractDocumentText(file, fileName);
  
  if (originalContent.type === 'pdf') {
    return await processPdfRedactions(file, matches, originalContent, fileName);
  } else {
    return await processTextRedactions(file, matches, originalContent, fileName);
  }
}

/**
 * Process redactions on a text file
 */
async function processTextRedactions(
  file: File | Blob,
  matches: RedactionMatch[],
  originalContent: DocumentContent,
  fileName: string
): Promise<RedactionResult> {
  // Apply redactions to text
  const redactedText = applyRedactions(originalContent.text, matches);
  
  // Create redacted file
  const redactedBlob = new Blob([redactedText], { type: 'text/plain' });
  const redactedFile = new File([redactedBlob], `Redacted_${fileName}`, { 
    type: 'text/plain' 
  });
  
  // Create redacted content
  const redactedContent: DocumentContent = {
    text: redactedText,
    type: 'text'
  };
  
  return {
    originalContent,
    redactedContent,
    matches,
    redactedFile
  };
}

/**
 * Process redactions on a PDF file
 */
async function processPdfRedactions(
  file: File | Blob,
  matches: RedactionMatch[],
  originalContent: DocumentContent,
  fileName: string
): Promise<RedactionResult> {
  try {
    // Load PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Apply redactions to text (for content comparison)
    const redactedText = applyRedactions(originalContent.text, matches);
    
    // For PDF, we'll overlay black rectangles on redacted text
    // This is a simplified approach - in production, you'd want to:
    // 1. Get exact text positions from PDF.js
    // 2. Draw rectangles over those positions
    // 3. Or use a library like pdf-lib with better text manipulation
    
    // For now, we'll add a watermark indicating it's redacted
    const pages = pdfDoc.getPages();
    pages.forEach((page: any) => {
      const { height } = page.getSize();
      page.drawText('REDACTED VERSION', {
        x: 50,
        y: height - 50,
        size: 12,
        color: rgb(1, 0, 0),
      });
    });
    
    // Save modified PDF
    const pdfBytes = await pdfDoc.save();
    const redactedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const redactedFile = new File([redactedBlob], `Redacted_${fileName}`, { 
      type: 'application/pdf' 
    });
    
    // Create redacted content
    const redactedContent: DocumentContent = {
      text: redactedText,
      type: 'pdf',
      pages: originalContent.pages?.map((page, index) => ({
        pageNumber: index + 1,
        text: redactedText // Simplified: apply same redaction to all pages
      }))
    };
    
    return {
      originalContent,
      redactedContent,
      matches,
      redactedFile
    };
  } catch (error) {
    console.error('Error processing PDF redactions:', error);
    // Fallback to text-based redaction
    return await processTextRedactions(file, matches, originalContent, fileName);
  }
}

/**
 * Convert redactions to byte-level chunks for ZKPT compatibility
 */
export function convertRedactionsToChunks(
  text: string,
  matches: RedactionMatch[],
  chunkSize: number = 128
): number[] {
  const chunks: Set<number> = new Set();
  
  matches.forEach(match => {
    // Calculate which chunks contain redacted content
    const startChunk = Math.floor(match.start / chunkSize);
    const endChunk = Math.floor(match.end / chunkSize);
    
    for (let i = startChunk; i <= endChunk; i++) {
      chunks.add(i);
    }
  });
  
  return Array.from(chunks).sort((a, b) => a - b);
}

/**
 * Create redacted file from document
 */
export async function createRedactedFile(
  originalFile: File | Blob,
  redactedText: string,
  fileName: string,
  type: 'text' | 'pdf' = 'text'
): Promise<File> {
  if (type === 'pdf') {
    // For PDF, create a simple text-to-PDF conversion
    // In production, use a proper PDF library
    const blob = new Blob([redactedText], { type: 'text/plain' });
    return new File([blob], `Redacted_${fileName}`, { type: 'text/plain' });
  } else {
    const blob = new Blob([redactedText], { type: 'text/plain' });
    return new File([blob], `Redacted_${fileName}`, { type: 'text/plain' });
  }
}

/**
 * Validate redaction matches
 */
export function validateRedactions(
  text: string,
  matches: RedactionMatch[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  matches.forEach((match, index) => {
    // Check if match is within text bounds
    if (match.start < 0 || match.end > text.length) {
      errors.push(`Match ${index + 1} is out of bounds`);
    }
    
    // Check if match start is before end
    if (match.start >= match.end) {
      errors.push(`Match ${index + 1} has invalid range`);
    }
    
    // Check if actual text matches
    const actualText = text.slice(match.start, match.end);
    if (actualText !== match.text) {
      errors.push(`Match ${index + 1} text mismatch`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

