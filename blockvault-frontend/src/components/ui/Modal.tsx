import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  variant?: 'default' | 'premium' | 'glass';
  borderColor?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  variant = 'premium',
  borderColor = 'border-primary-500/30'
}) => {
  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center p-4 pt-24 pb-8 overflow-y-auto bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <Card
        variant={variant}
        className={`w-full ${sizeClasses[size]} shadow-2xl ${borderColor} animate-fade-in-up relative`}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-secondary-700/30">
            {title && (
              <div className="flex-1">
                <h2 id="modal-title" className="text-2xl font-bold text-white text-gradient mb-1">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-text-secondary">{subtitle}</p>
                )}
              </div>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-status-error/10 hover:text-status-error ml-4 flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </Card>
    </div>
  );

  // Render modal using portal to body
  return createPortal(modalContent, document.body);
};

