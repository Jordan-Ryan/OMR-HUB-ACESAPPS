'use client';

import { useState } from 'react';
import SearchInput from './SearchInput';

interface ActivityListProps {
  pastActivities: any[];
  upcomingActivities: any[];
}

export default function ActivityList({
  pastActivities,
  upcomingActivities,
}: ActivityListProps) {
  const [viewMode, setViewMode] = useState<'upcoming' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activitiesToShow = viewMode === 'upcoming' ? upcomingActivities : pastActivities;

  const filteredActivities = activitiesToShow.filter((activity) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      activity.title?.toLowerCase().includes(searchLower) ||
      activity.description?.toLowerCase().includes(searchLower) ||
      activity.location_name?.toLowerCase().includes(searchLower) ||
      activity.activity_type?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <SearchInput
          placeholder="Search activities..."
          value={searchTerm}
          onChange={setSearchTerm}
          style={{ maxWidth: '500px' }}
        />
      </div>

      {/* Toggle Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: '#1a1a1a',
          padding: '4px',
          borderRadius: '10px',
          width: 'fit-content',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={() => setViewMode('upcoming')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'upcoming' ? '#007AFF' : 'transparent',
            color: viewMode === 'upcoming' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          Upcoming ({upcomingActivities.length})
        </button>
        <button
          onClick={() => setViewMode('past')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'past' ? '#007AFF' : 'transparent',
            color: viewMode === 'past' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          Past ({pastActivities.length})
        </button>
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>
            {searchTerm
              ? 'No activities found matching your search.'
              : `No ${viewMode === 'upcoming' ? 'upcoming' : 'past'} activities`}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="card"
                style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '20px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <h3
                    style={{
                      marginBottom: '8px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                    }}
                  >
                    {activity.title}
                  </h3>
                  {activity.description && (
                    <p
                      style={{
                        color: 'rgba(235, 235, 245, 0.6)',
                        fontSize: '15px',
                        marginBottom: '12px',
                        lineHeight: '20px',
                      }}
                    >
                      {activity.description}
                    </p>
                  )}
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'rgba(235, 235, 245, 0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#FFFFFF' }}>Start:</strong>{' '}
                      {formatDate(activity.start_at)}
                    </div>
                    {activity.end_at && (
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>End:</strong>{' '}
                        {formatDate(activity.end_at)}
                      </div>
                    )}
                    {activity.location_name && (
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>Location:</strong>{' '}
                        {activity.location_name}
                      </div>
                    )}
                    {activity.activity_type && (
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>Type:</strong>{' '}
                        {activity.activity_type}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
            Showing <strong style={{ color: '#FFFFFF' }}>{filteredActivities.length}</strong> of{' '}
            <strong style={{ color: '#FFFFFF' }}>{activitiesToShow.length}</strong> activities
          </div>
        </>
      )}
    </div>
  );
}
