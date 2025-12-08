'use client';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  style?: React.CSSProperties;
}

export default function StatusBadge({
  status,
  variant = 'default',
  style,
}: StatusBadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          background: 'rgba(52, 199, 89, 0.2)',
          color: '#34C759',
          border: '1px solid rgba(52, 199, 89, 0.3)',
        };
      case 'warning':
        return {
          background: 'rgba(255, 149, 0, 0.2)',
          color: '#FF9500',
          border: '1px solid rgba(255, 149, 0, 0.3)',
        };
      case 'error':
        return {
          background: 'rgba(255, 59, 48, 0.2)',
          color: '#FF3B30',
          border: '1px solid rgba(255, 59, 48, 0.3)',
        };
      case 'info':
        return {
          background: 'rgba(0, 122, 255, 0.2)',
          color: '#007AFF',
          border: '1px solid rgba(0, 122, 255, 0.3)',
        };
      default:
        return {
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        ...variantStyles,
        ...style,
      }}
    >
      {status}
    </span>
  );
}


