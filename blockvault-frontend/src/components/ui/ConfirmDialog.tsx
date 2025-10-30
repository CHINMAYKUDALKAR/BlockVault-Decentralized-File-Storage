import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false,
}) => {
  if (!isOpen) return null;

  const icons = {
    danger: { icon: XCircle, color: 'from-status-error to-red-600', textColor: 'text-status-error' },
    warning: { icon: AlertTriangle, color: 'from-status-warning to-status-warningLight', textColor: 'text-status-warning' },
    info: { icon: Info, color: 'from-primary-500 to-accent-500', textColor: 'text-primary-400' },
    success: { icon: CheckCircle, color: 'from-status-success to-status-successLight', textColor: 'text-status-success' },
  };

  const { icon: Icon, color, textColor } = icons[variant];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card variant="premium" className="w-full max-w-md animate-scale-in relative overflow-hidden">
        {/* Decorative background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 pointer-events-none`} />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-xl blur-lg opacity-40 animate-glow-pulse`} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-text-secondary font-medium">Please confirm your action</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2.5 text-text-secondary hover:text-white hover:bg-secondary-700/70 transition-all rounded-xl group disabled:opacity-50"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Message */}
          <div className="mb-8 p-4 bg-secondary-900/40 rounded-xl border border-secondary-700/30">
            <p className="text-text-primary leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              disabled={loading}
              loading={loading}
              variant={variant === 'danger' ? 'danger' : 'primary'}
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Hook for easier usage
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info',
  });

  const confirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'danger' | 'warning' | 'info' | 'success' = 'info',
    confirmText?: string,
    cancelText?: string
  ) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      onConfirm,
      variant,
      confirmText,
      cancelText,
    });
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    dialogState,
    confirm,
    closeDialog,
  };
};

