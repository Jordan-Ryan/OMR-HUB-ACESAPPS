'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchInput from './SearchInput';

interface CreditTransaction {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  amount: number;
  activity_id: string | null;
  activity_name: string;
  activity_date: string | null;
  activity_type: string | null;
  description: string | null;
  created_at: string;
}

type Column<T> = {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
};

export default function CreditList() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'circuits';
  
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTransactions();
  }, [type]);

  useEffect(() => {
    // Fetch profile image URLs for all users
    const fetchProfileImages = async () => {
      const imageUrls: Record<string, string> = {};
      
      await Promise.all(
        transactions.map(async (transaction) => {
          if (!transaction.avatar_url) return;
          
          // If it's already a full URL, use it directly
          if (transaction.avatar_url.startsWith('http')) {
            imageUrls[transaction.user_id] = transaction.avatar_url;
            return;
          }
          
          // Otherwise, get signed URL from Supabase Storage
          try {
            const response = await fetch(
              `/api/admin/users/profile-image?path=${encodeURIComponent(transaction.avatar_url)}`
            );
            const data = await response.json();
            if (data.url) {
              imageUrls[transaction.user_id] = data.url;
            }
          } catch (error) {
            console.error(`Error fetching profile image for user ${transaction.user_id}:`, error);
          }
        })
      );
      
      setProfileImageUrls(imageUrls);
    };

    if (transactions.length > 0) {
      fetchProfileImages();
    }
  }, [transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/credits?type=${type}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    const color = amount >= 0 ? '#34C759' : '#FF3B30';
    return (
      <span style={{ color, fontWeight: '600' }}>
        {sign}{amount}
      </span>
    );
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'pt':
        return 'PT';
      case 'partner-pt':
        return 'Partner PT';
      default:
        return 'Circuits';
    }
  };

  // Filter transactions by user name
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) {
      return transactions;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return transactions.filter((transaction) =>
      transaction.user_name.toLowerCase().includes(searchLower)
    );
  }, [transactions, searchTerm]);

  const columns: Column<CreditTransaction>[] = [
    {
      key: 'user_name',
      label: 'User',
      render: (transaction) => {
        const displayName = transaction.user_name || 'Unknown';
        const initials = displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
        
        const profileImageUrl = profileImageUrls[transaction.user_id];
        const hasProfileImage = !!profileImageUrl && !failedImages.has(transaction.user_id);
        const showImage = hasProfileImage && profileImageUrl;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: showImage
                  ? 'transparent'
                  : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#FFFFFF',
                flexShrink: 0,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {showImage ? (
                <img
                  src={profileImageUrl}
                  alt={displayName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={() => {
                    // Mark this image as failed and fallback to initials
                    setFailedImages((prev) => new Set(prev).add(transaction.user_id));
                  }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <span style={{ fontWeight: '500' }}>{displayName}</span>
          </div>
        );
      },
    },
    {
      key: 'activity_name',
      label: 'Activity',
      render: (transaction) => {
        const displayName = transaction.activity_name && transaction.activity_name !== 'N/A'
          ? transaction.activity_name
          : transaction.description || 'N/A';
        
        return (
          <div>
            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
              {displayName}
            </div>
            {transaction.activity_type && (
              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                {transaction.activity_type}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'activity_date',
      label: 'Activity Date',
      render: (transaction) => {
        if (!transaction.activity_date) {
          return (
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
              —
            </span>
          );
        }
        
        const activityDate = new Date(transaction.activity_date);
        const dateStr = activityDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        
        return (
          <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
            {dateStr}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (transaction) => formatAmount(transaction.amount),
    },
    {
      key: 'description',
      label: 'Description',
      render: (transaction) => (
        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
          {transaction.description || '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (transaction) => (
        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
          {formatDate(transaction.created_at)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ color: '#FFFFFF', padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading transactions...</div>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
          Please wait while we fetch the data
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="card"
        style={{
          padding: '32px',
          textAlign: 'center',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 59, 48, 0.3)',
        }}
      >
        <div style={{ color: '#FF3B30', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
          Error: {error}
        </div>
        <button
          onClick={fetchTransactions}
          className="button button-primary"
          style={{ fontSize: '15px', padding: '10px 20px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#FFFFFF' }}>
          {getTypeLabel()} Credits
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px' }}>
          View all credit transactions including credits added and removed.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <SearchInput
          placeholder="Search by user name..."
          value={searchTerm}
          onChange={setSearchTerm}
          style={{ maxWidth: '500px' }}
        />
      </div>

      {/* Data Table */}
      <div style={{ overflowX: 'auto', background: '#0a0a0a' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#0a0a0a',
          }}
        >
          <thead>
            <tr
              style={{
                background: '#141414',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: '16px 20px',
                    textAlign: column.align || 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '48px',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {searchTerm
                    ? `No ${getTypeLabel().toLowerCase()} credit transactions found matching "${searchTerm}".`
                    : `No ${getTypeLabel().toLowerCase()} credit transactions found.`}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  style={{
                    borderBottom:
                      index < filteredTransactions.length - 1
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : 'none',
                    background: '#0a0a0a',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#0a0a0a';
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{
                        padding: '16px 20px',
                        textAlign: column.align || 'left',
                        fontSize: '15px',
                        color: '#FFFFFF',
                      }}
                    >
                      {column.render ? column.render(transaction) : (transaction as any)[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div
        style={{
          marginTop: '24px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          padding: '12px 20px',
          background: '#1a1a1a',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'inline-block',
        }}
      >
        Showing <strong style={{ color: '#FFFFFF' }}>{filteredTransactions.length}</strong> of{' '}
        <strong style={{ color: '#FFFFFF' }}>{transactions.length}</strong> transactions
      </div>
    </div>
  );
}

