/**
 * Document Extractor
 * Extracts text content from various document formats
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface DocumentContent {
  text: string;
  type: 'text' | 'pdf';
  pages?: Array<{
    pageNumber: number;
    text: string;
  }>;
}

/**
 * Extract text from a file
 */
export async function extractDocumentText(
  file: File | Blob,
  fileName?: string
): Promise<DocumentContent> {
  const fileType = file.type || getFileTypeFromName(fileName || '');
  
  if (fileType === 'application/pdf') {
    return await extractPdfText(file);
  } else {
    return await extractPlainText(file);
  }
}

/**
 * Extract text from a plain text file
 */
async function extractPlainText(file: File | Blob): Promise<DocumentContent> {
  const text = await file.text();
  
  return {
    text,
    type: 'text'
  };
}

/**
 * Extract text from a PDF file
 */
async function extractPdfText(file: File | Blob): Promise<DocumentContent> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const pages: Array<{ pageNumber: number; text: string }> = [];
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      pages.push({
        pageNumber: pageNum,
        text: pageText
      });
      
      fullText += pageText + '\n';
    }
    
    return {
      text: fullText.trim(),
      type: 'pdf',
      pages
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Fetch and extract text from document by file_id
 */
export async function fetchAndExtractDocument(
  fileId: string,
  passphrase: string,
  apiUrl: string = 'http://localhost:5000'
): Promise<DocumentContent> {
  try {
    const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
    
    const response = await fetch(`${apiUrl}/files/${fileId}?key=${encodeURIComponent(passphrase)}&inline=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.jwt}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }
    
    const blob = await response.blob();
    const contentType = response.headers.get('Content-Type') || '';
    const contentDisposition = response.headers.get('Content-Disposition') || '';
    
    // Extract filename from Content-Disposition header
    let fileName = 'document';
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch) {
      fileName = filenameMatch[1];
    }
    
    // Create a file object with the blob
    const file = new File([blob], fileName, { type: contentType });
    
    return await extractDocumentText(file, fileName);
  } catch (error) {
    console.error('Error fetching and extracting document:', error);
    throw error;
  }
}

/**
 * Get file type from filename
 */
function getFileTypeFromName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'txt':
      return 'text/plain';
    case 'doc':
    case 'docx':
      return 'application/msword';
    default:
      return 'text/plain';
  }
}

/**
 * Extract text from raw bytes (for already downloaded documents)
 */
export async function extractTextFromBytes(
  bytes: Uint8Array,
  type: 'text' | 'pdf'
): Promise<DocumentContent> {
  const blob = new Blob([bytes], { 
    type: type === 'pdf' ? 'application/pdf' : 'text/plain' 
  });
  
  if (type === 'pdf') {
    return await extractPdfText(blob);
  } else {
    return await extractPlainText(blob);
  }
}

