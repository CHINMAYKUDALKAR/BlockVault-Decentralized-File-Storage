import React, { useState, useEffect } from 'react';
import { AlertCircle, FileText, File } from 'lucide-react';
import { DocumentContent } from '../../utils/documentExtractor';
import { RedactionMatch } from '../../utils/redactionPatterns';

interface DocumentPreviewProps {
  content: DocumentContent;
  matches?: RedactionMatch[];
  showRedactions?: boolean;
  title?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  content,
  matches = [],
  showRedactions = false,
  title = 'Document'
}) => {
  const [displayText, setDisplayText] = useState<string>('');
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');

  useEffect(() => {
    if (!content) return;

    setDisplayText(content.text);
    
    if (showRedactions && matches.length > 0) {
      setHighlightedHtml(generateHighlightedHtml(content.text, matches));
    } else {
      setHighlightedHtml(escapeHtml(content.text));
    }
  }, [content, matches, showRedactions]);

  const generateHighlightedHtml = (text: string, redactions: RedactionMatch[]): string => {
    if (redactions.length === 0) return escapeHtml(text);

    let html = '';
    let lastIndex = 0;

    // Sort redactions by start position
    const sortedRedactions = [...redactions].sort((a, b) => a.start - b.start);

    sortedRedactions.forEach(match => {
      // Add text before the match
      html += escapeHtml(text.slice(lastIndex, match.start));
      
      // Add highlighted redacted text
      if (showRedactions) {
        html += `<span class="bg-red-500/30 text-red-200 px-1 rounded border border-red-500/50" title="${escapeHtml(match.type)}">${escapeHtml(match.text)}</span>`;
      } else {
        html += escapeHtml(match.text);
      }
      
      lastIndex = match.end;
    });

    // Add remaining text
    html += escapeHtml(text.slice(lastIndex));

    return html;
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  if (!content) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-800/50 rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400">No document content available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center space-x-2 text-sm text-slate-400">
        {content.type === 'pdf' ? (
          <File className="w-4 h-4" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span>{title}</span>
        {content.type === 'pdf' && content.pages && (
          <span className="text-xs">({content.pages.length} pages)</span>
        )}
        {showRedactions && matches.length > 0 && (
          <span className="ml-auto text-red-400 font-medium">
            {matches.length} redaction{matches.length !== 1 ? 's' : ''} highlighted
          </span>
        )}
      </div>

      {/* Content */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
        <div 
          className="p-6 text-sm text-slate-200 leading-relaxed overflow-y-auto max-h-96 whitespace-pre-wrap font-mono"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </div>

      {/* Stats */}
      {showRedactions && matches.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{displayText.length} characters</span>
          <span>{displayText.split('\n').length} lines</span>
        </div>
      )}
    </div>
  );
};

interface DocumentComparisonProps {
  original: DocumentContent;
  redacted: DocumentContent;
  matches: RedactionMatch[];
}

export const DocumentComparison: React.FC<DocumentComparisonProps> = ({
  original,
  redacted,
  matches
}) => {
  const [activeTab, setActiveTab] = useState<'original' | 'redacted'>('original');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('original')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'original'
              ? 'text-white border-b-2 border-primary-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Original Document
        </button>
        <button
          onClick={() => setActiveTab('redacted')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'redacted'
              ? 'text-white border-b-2 border-primary-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Redacted Preview
        </button>
      </div>

      {/* Content */}
      {activeTab === 'original' ? (
        <DocumentPreview
          content={original}
          matches={matches}
          showRedactions={true}
          title="Original (with redactions highlighted)"
        />
      ) : (
        <DocumentPreview
          content={redacted}
          matches={[]}
          showRedactions={false}
          title="After Redaction"
        />
      )}

      {/* Summary */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-amber-200 mb-1">
              <strong>{matches.length}</strong> item{matches.length !== 1 ? 's' : ''} will be permanently redacted
            </p>
            <p className="text-amber-300/70 text-xs">
              Review carefully before proceeding. Redacted content cannot be recovered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

