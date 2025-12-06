'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ActivityFormProps {
  activityId?: string;
}

export default function ActivityForm({ activityId }: ActivityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location_name: '',
    location_lat: '',
    location_lng: '',
    cost: 1,
    activity_type: 'PT',
  });

  useEffect(() => {
    if (activityId) {
      fetchActivity();
    }
  }, [activityId]);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/admin/activities/${activityId}`);
      const data = await response.json();
      if (data.activity) {
        const startDate = new Date(data.activity.start_at);
        const endDate = data.activity.end_at ? new Date(data.activity.end_at) : null;
        
        setFormData({
          title: data.activity.title || '',
          description: data.activity.description || '',
          start_at: startDate.toISOString().slice(0, 16),
          end_at: endDate ? endDate.toISOString().slice(0, 16) : '',
          location_name: data.activity.location_name || '',
          location_lat: data.activity.location_lat || '',
          location_lng: data.activity.location_lng || '',
          cost: data.activity.cost || 1,
          activity_type: data.activity.activity_type || 'PT',
        });
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = activityId
        ? `/api/admin/activities/${activityId}`
        : '/api/admin/activities';
      const method = activityId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        start_at: new Date(formData.start_at).toISOString(),
        end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
        location_lat: formData.location_lat ? parseFloat(formData.location_lat) : null,
        location_lng: formData.location_lng ? parseFloat(formData.location_lng) : null,
        cost: parseInt(formData.cost.toString()),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save activity');
      }

      if (activityId) {
        router.push(`/admin/coach/schedule/${activityId}`);
      } else {
        router.push('/admin/coach/schedule');
      }
      router.refresh();
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '24px' }}>Activity Details</h2>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2c2c2e',
              border: '1px solid rgba(84, 84, 88, 0.65)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '17px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2c2c2e',
              border: '1px solid rgba(84, 84, 88, 0.65)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '17px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(235, 235, 245, 0.6)',
                fontSize: '15px',
              }}
            >
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.start_at}
              onChange={(e) =>
                setFormData({ ...formData, start_at: e.target.value })
              }
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2c2c2e',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(235, 235, 245, 0.6)',
                fontSize: '15px',
              }}
            >
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.end_at}
              onChange={(e) =>
                setFormData({ ...formData, end_at: e.target.value })
              }
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2c2c2e',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Location Name
          </label>
          <input
            type="text"
            value={formData.location_name}
            onChange={(e) =>
              setFormData({ ...formData, location_name: e.target.value })
            }
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2c2c2e',
              border: '1px solid rgba(84, 84, 88, 0.65)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '17px',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(235, 235, 245, 0.6)',
                fontSize: '15px',
              }}
            >
              Cost (Credits)
            </label>
            <input
              type="number"
              min="0"
              value={formData.cost}
              onChange={(e) =>
                setFormData({ ...formData, cost: parseInt(e.target.value) || 1 })
              }
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2c2c2e',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(235, 235, 245, 0.6)',
                fontSize: '15px',
              }}
            >
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={formData.location_lat}
              onChange={(e) =>
                setFormData({ ...formData, location_lat: e.target.value })
              }
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2c2c2e',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(235, 235, 245, 0.6)',
                fontSize: '15px',
              }}
            >
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={formData.location_lng}
              onChange={(e) =>
                setFormData({ ...formData, location_lng: e.target.value })
              }
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2c2c2e',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="button button-secondary"
          style={{ fontSize: '15px', padding: '12px 24px' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="button button-primary"
          style={{
            fontSize: '15px',
            padding: '12px 24px',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Saving...' : activityId ? 'Update Activity' : 'Create Activity'}
        </button>
      </div>
    </form>
  );
}

