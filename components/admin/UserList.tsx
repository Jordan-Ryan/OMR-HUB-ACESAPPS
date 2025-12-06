'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchInput from './SearchInput';
import { FilterConfig } from './FilterBar';
import StatusBadge from './StatusBadge';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  email: string | null;
  avatar_url: string | null;
  circuits_credits: number;
  pt_credits: number;
  joint_pt_credits: number;
  subscription_end_date: string | null;
  created_at: string;
  is_guest: boolean;
}

type SortField = 'name' | 'email' | 'created_at' | 'subscription_end_date' | 'circuits_credits' | 'pt_credits' | 'joint_pt_credits';
type SortDirection = 'asc' | 'desc';

export default function UserList() {
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'members';
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Fetch profile image URLs for all users
    const fetchProfileImages = async () => {
      const imageUrls: Record<string, string> = {};
      
      await Promise.all(
        users.map(async (user) => {
          if (!user.avatar_url) return;
          
          // If it's already a full URL, use it directly
          if (user.avatar_url.startsWith('http')) {
            imageUrls[user.id] = user.avatar_url;
            return;
          }
          
          // Otherwise, get signed URL from Supabase Storage
          try {
            const response = await fetch(
              `/api/admin/users/profile-image?path=${encodeURIComponent(user.avatar_url)}`
            );
            const data = await response.json();
            if (data.url) {
              imageUrls[user.id] = data.url;
            }
          } catch (error) {
            console.error(`Error fetching profile image for user ${user.id}:`, error);
          }
        })
      );
      
      setProfileImageUrls(imageUrls);
    };

    if (users.length > 0) {
      fetchProfileImages();
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/admin/users', {
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/admin/login';
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
        throw new Error(errorData.error || `Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (user: User): 'active' | 'expired' | 'no-subscription' => {
    if (!user.subscription_end_date) return 'no-subscription';
    const endDate = new Date(user.subscription_end_date);
    const now = new Date();
    return endDate > now ? 'active' : 'expired';
  };

  const filteredUsers = users
    .filter((user) => {
      // Type filter (Members vs Guests)
      if (userType === 'members' && user.is_guest) return false;
      if (userType === 'guests' && !user.is_guest) return false;

      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const nickname = (user.nickname || '').toLowerCase();
      const email = (user.email || '').toLowerCase();

      const matchesSearch =
        fullName.includes(searchLower) ||
        nickname.includes(searchLower) ||
        email.includes(searchLower);

      if (!matchesSearch) return false;

      return true;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = (`${a.first_name || ''} ${a.last_name || ''}`.trim() || '').toLowerCase();
          bValue = (`${b.first_name || ''} ${b.last_name || ''}`.trim() || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'circuits_credits':
          aValue = a.circuits_credits;
          bValue = b.circuits_credits;
          break;
        case 'pt_credits':
          aValue = a.pt_credits;
          bValue = b.pt_credits;
          break;
        case 'joint_pt_credits':
          aValue = a.joint_pt_credits;
          bValue = b.joint_pt_credits;
          break;
        case 'subscription_end_date':
          aValue = a.subscription_end_date || '';
          bValue = b.subscription_end_date || '';
          break;
        case 'created_at':
        default:
          aValue = a.created_at;
          bValue = b.created_at;
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filterConfigs: FilterConfig[] = [];
  const clearFilters = () => {
    setCategoryFilter('all');
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (user) => {
        const displayName =
          `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
          'Unknown';
        const initials = displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
        
        const profileImageUrl = profileImageUrls[user.id];
        const hasProfileImage = !!profileImageUrl && !failedImages.has(user.id);
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
                    setFailedImages((prev) => new Set(prev).add(user.id));
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
      key: 'email',
      label: 'Email',
      render: (user) => (
        <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          {user.email || '-'}
        </span>
      ),
    },
    {
      key: 'circuits_credits',
      label: 'Circuits Credits',
      align: 'right',
      render: (user) => (
        <span style={{ fontWeight: '600' }}>{user.circuits_credits}</span>
      ),
    },
    {
      key: 'pt_credits',
      label: 'PT Credits',
      align: 'right',
      render: (user) => (
        <span style={{ fontWeight: '600' }}>{user.pt_credits}</span>
      ),
    },
    {
      key: 'joint_pt_credits',
      label: 'Joint PT Credits',
      align: 'right',
      render: (user) => (
        <span style={{ fontWeight: '600' }}>{user.joint_pt_credits}</span>
      ),
    },
    {
      key: 'subscription_end_date',
      label: 'Subscription End',
      render: (user) => {
        const status = getStatus(user);
        // Only show date if subscription is active
        if (status === 'active' && user.subscription_end_date) {
          return (
            <span>
              {new Date(user.subscription_end_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          );
        }
        // Show dash for expired or no subscription
        return <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>-</span>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ color: '#FFFFFF', padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading users...</div>
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
          onClick={fetchUsers}
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
      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <SearchInput
          placeholder="Search users by name or email..."
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
            {filteredUsers.length === 0 ? (
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
                    ? 'No users found matching your search.'
                    : 'No users found.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  onClick={() => {
                    window.location.href = `/admin/users/${user.id}`;
                  }}
                  style={{
                    borderBottom:
                      index < filteredUsers.length - 1
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
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
                      {column.render ? column.render(user) : (user as any)[column.key]}
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
        Showing <strong style={{ color: '#FFFFFF' }}>{filteredUsers.length}</strong> of{' '}
        <strong style={{ color: '#FFFFFF' }}>{users.length}</strong> users
      </div>
    </div>
  );
}
