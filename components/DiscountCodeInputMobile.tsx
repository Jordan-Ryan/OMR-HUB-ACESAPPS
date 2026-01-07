'use client';

import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface DiscountCodeInputMobileProps {
  creditType: 'circuits' | 'pt' | 'joint_pt';
  purchaseAmountPence: number;
  onDiscountApplied?: (discount: {
    code: string;
    discountAmountPence: number;
    finalPricePence: number;
  }) => void;
  onDiscountRemoved?: () => void;
  style?: any;
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

export default function DiscountCodeInputMobile({
  creditType,
  purchaseAmountPence,
  onDiscountApplied,
  onDiscountRemoved,
  style,
}: DiscountCodeInputMobileProps) {
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

  if (appliedDiscount) {
    return (
      <View style={[styles.container, styles.appliedContainer, style]}>
        <View style={styles.appliedContent}>
          <Text style={styles.appliedTitle}>
            Discount Applied: {appliedDiscount.discountCode?.code}
          </Text>
          {appliedDiscount.discountCode?.description && (
            <Text style={styles.appliedDescription}>
              {appliedDiscount.discountCode.description}
            </Text>
          )}
          <Text style={styles.appliedSavings}>
            You saved {formatPrice(appliedDiscount.discountAmountPence)}
          </Text>
        </View>
        <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          placeholder="Enter discount code"
          placeholderTextColor="#8E8E93"
          editable={!loading}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          onPress={handleApply}
          disabled={loading || !code.trim()}
          style={[styles.applyButton, (loading || !code.trim()) && styles.applyButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.applyButtonText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(84, 84, 88, 0.65)',
  },
  applyButton: {
    paddingHorizontal: 20,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  applyButtonDisabled: {
    backgroundColor: '#48484A',
    opacity: 0.6,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  appliedContainer: {
    padding: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedContent: {
    flex: 1,
  },
  appliedTitle: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 4,
  },
  appliedDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  appliedSavings: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  removeButtonText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '600',
  },
});

