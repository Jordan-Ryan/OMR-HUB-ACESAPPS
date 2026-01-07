'use client';

import { useState } from 'react';

interface DiscountCodeInputProps {
  creditType: 'circuits' | 'pt' | 'joint_pt';
  purchaseAmountPence: number;
  onDiscountApplied?: (discount: {
    code: string;
    discountAmountPence: number;
    finalPricePence: number;
  }) => void;
  onDiscountRemoved?: () => void;
  className?: string;
}

interface DiscountValidationResult {
  valid: boolean;
  discountCode?: {
    id: string;
    code: string;
    description?: string;
  };
  originalPricePence: number;
  discountAmountPence: number;
  finalPricePence: number;
  error?: string;
}

export default function DiscountCodeInput({
  creditType,
  purchaseAmountPence,
  onDiscountApplied,
  onDiscountRemoved,
  className = '',
}: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidationResult | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a discount code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          creditType,
          purchaseAmountPence,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to validate discount code');
        return;
      }

      setAppliedDiscount(data);
      onDiscountApplied?.({
        code: data.discountCode.code,
        discountAmountPence: data.discountAmountPence,
        finalPricePence: data.finalPricePence,
      });
    } catch (err) {
      console.error('Error validating discount code:', err);
      setError('Failed to validate discount code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedDiscount(null);
    setError(null);
    onDiscountRemoved?.();
  };

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  return (
    <div className={className}>
      {!appliedDiscount ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter discount code"
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '16px',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                background: '#2c2c2e',
                color: 'rgba(255, 255, 255, 0.9)',
                outline: 'none',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleApply();
                }
              }}
            />
            <button
              onClick={handleApply}
              disabled={loading || !code.trim()}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                fontWeight: '600',
                background: loading ? '#48484a' : '#007AFF',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !code.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {error && (
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(255, 59, 48, 0.1)',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                borderRadius: '6px',
                color: '#FF3B30',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: '12px',
            background: 'rgba(52, 199, 89, 0.1)',
            border: '1px solid rgba(52, 199, 89, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '14px', color: '#34C759', fontWeight: '600' }}>
              Discount Applied: {appliedDiscount.discountCode?.code}
            </div>
            {appliedDiscount.discountCode?.description && (
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                {appliedDiscount.discountCode.description}
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
              You saved {formatPrice(appliedDiscount.discountAmountPence)}
            </div>
          </div>
          <button
            onClick={handleRemove}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              background: 'transparent',
              color: '#34C759',
              border: '1px solid rgba(52, 199, 89, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

