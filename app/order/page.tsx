'use client';

import { useState, useEffect } from 'react';
import DiscountCodeInput from '@/components/DiscountCodeInput';

interface PricingPackage {
  id: string;
  credit_type: 'circuits' | 'pt' | 'joint_pt';
  package_type: string;
  label: string;
  credits: number;
  price_pence: number;
  is_active: boolean;
  display_order: number;
}

interface DiscountInfo {
  code: string;
  discountAmountPence: number;
  finalPricePence: number;
}

export default function OrderPage() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [creditType, setCreditType] = useState<'circuits' | 'pt' | 'joint_pt'>('circuits');

  useEffect(() => {
    fetchPackages();
  }, [creditType]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pricing-packages?credit_type=${creditType}`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  const handlePackageSelect = (pkg: PricingPackage) => {
    setSelectedPackage(pkg);
    // Clear discount when package changes
    setDiscountInfo(null);
  };

  const handleDiscountApplied = (discount: DiscountInfo) => {
    setDiscountInfo(discount);
  };

  const handleDiscountRemoved = () => {
    setDiscountInfo(null);
  };

  const getFinalPrice = () => {
    if (!selectedPackage) return 0;
    return discountInfo ? discountInfo.finalPricePence : selectedPackage.price_pence;
  };

  const getDiscountAmount = () => {
    if (!selectedPackage || !discountInfo) return 0;
    return discountInfo.discountAmountPence;
  };

  const getCreditTypeLabel = (type: string) => {
    switch (type) {
      case 'circuits':
        return 'Circuits';
      case 'pt':
        return 'PT';
      case 'joint_pt':
        return 'Partner PT';
      default:
        return type;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Purchase Credits
        </h1>
        <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '40px' }}>
          Select a package and enter a discount code if you have one
        </p>

        {/* Discount Code Input - Always visible at top */}
        <div style={{ 
          marginBottom: '32px',
          padding: '24px',
          background: 'rgba(0, 122, 255, 0.05)',
          border: '2px solid rgba(0, 122, 255, 0.3)',
          borderRadius: '12px',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#007AFF' }}>
            💰 Discount Code
          </h2>
          <DiscountCodeInput
            creditType={creditType}
            purchaseAmountPence={selectedPackage?.price_pence || (packages.length > 0 ? packages[0].price_pence : 1000)}
            onDiscountApplied={handleDiscountApplied}
            onDiscountRemoved={handleDiscountRemoved}
          />
        </div>

        {/* Credit Type Selector */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {(['circuits', 'pt', 'joint_pt'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setCreditType(type);
                  setSelectedPackage(null);
                  setDiscountInfo(null);
                }}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: creditType === type ? '#007AFF' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: `1px solid ${creditType === type ? '#007AFF' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {getCreditTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Loading packages...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => handlePackageSelect(pkg)}
                style={{
                  padding: '24px',
                  background: selectedPackage?.id === pkg.id ? 'rgba(0, 122, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: `2px solid ${selectedPackage?.id === pkg.id ? '#007AFF' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                    {pkg.label}
                  </h3>
                  {pkg.credits > 0 && (
                    <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {pkg.credits} {pkg.credits === 1 ? 'credit' : 'credits'}
                    </p>
                  )}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#007AFF' }}>
                  {formatPrice(pkg.price_pence)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Summary */}
        {selectedPackage && (
          <div
            style={{
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              marginBottom: '32px',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Order Summary
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Package:</span>
                <span style={{ fontWeight: '600' }}>{selectedPackage.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Subtotal:</span>
                <span>{formatPrice(selectedPackage.price_pence)}</span>
              </div>
              {discountInfo && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Discount:</span>
                    <span style={{ color: '#34C759', fontWeight: '600' }}>
                      -{formatPrice(getDiscountAmount())}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      margin: '8px 0',
                    }}
                  />
                </>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: '600' }}>Total:</span>
                <span style={{ fontSize: '24px', fontWeight: '700', color: '#007AFF' }}>
                  {formatPrice(getFinalPrice())}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Button */}
        {selectedPackage && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => {
                // TODO: Implement purchase flow (Stripe integration, etc.)
                alert(`Purchase flow would be implemented here. Final price: ${formatPrice(getFinalPrice())}`);
              }}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '600',
                background: '#007AFF',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '200px',
              }}
            >
              Purchase for {formatPrice(getFinalPrice())}
            </button>
          </div>
        )}

        {!selectedPackage && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Select a package to continue
          </div>
        )}
      </div>
    </div>
  );
}

