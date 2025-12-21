'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BulkTemplateItem {
  day: string;
  time: string;
  duration: number; // in minutes
  activity_type: string;
  title: string;
  description?: string;
  location: string;
  host_user_id?: string;
  cost?: number;
  icon?: string;
  visibility?: string; // Always 'public' but kept for creation logic
}

const DEFAULT_TEMPLATE: BulkTemplateItem[] = [
  { day: 'Monday', time: '06:00', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Monday', time: '12:30', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Monday', time: '20:30', duration: 60, activity_type: 'Circuits', title: 'Hyrox Session', description: '', location: 'Highland House, RG41 4SP', cost: 0, icon: 'flame-outline' },
  { day: 'Tuesday', time: '06:00', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Tuesday', time: '12:30', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Wednesday', time: '06:00', duration: 30, activity_type: 'Cardio', title: 'Erg Session', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'boat' },
  { day: 'Wednesday', time: '06:30', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Wednesday', time: '18:00', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Thursday', time: '06:30', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Thursday', time: '11:30', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Thursday', time: '18:45', duration: 60, activity_type: 'Pilates', title: 'Pilates', description: '', location: 'Highland House, RG41 4SP', cost: 0, icon: 'pilates' },
  { day: 'Thursday', time: '18:45', duration: 60, activity_type: 'Running', title: 'Run Club - Walters Arms', description: '', location: 'Walters Arms', cost: 0, icon: 'walk' },
  { day: 'Friday', time: '06:00', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Friday', time: '12:30', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Saturday', time: '07:30', duration: 60, activity_type: 'Circuits', title: 'Circuits', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
  { day: 'Sunday', time: '08:00', duration: 60, activity_type: 'Running', title: 'Run Club Hamlet', description: '', location: 'Hamlet', cost: 0, icon: 'walk' },
];

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
}

export default function BulkCreationTemplate() {
  const router = useRouter();
  const [template, setTemplate] = useState<BulkTemplateItem[]>(DEFAULT_TEMPLATE);
  const [users, setUsers] = useState<User[]>([]);
  // Get the current week's Monday or next Monday
  const getNextMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysUntilMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [startDate, setStartDate] = useState(() => {
    return getNextMonday().toISOString().split('T')[0];
  });
  
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [omarId, setOmarId] = useState<string | null>(null);
  const [samId, setSamId] = useState<string | null>(null);
  const [weeks, setWeeks] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hostSearchQuery, setHostSearchQuery] = useState<Record<number, string>>({});
  const [showHostPicker, setShowHostPicker] = useState<Record<number, boolean>>({});

  // Load template from database
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await fetch('/api/admin/bulk-template');
        const data = await response.json();
        if (data.template && data.template.template_data) {
          let loadedTemplate = data.template.template_data;
          
          // Fix any incorrect icons in the loaded template
          loadedTemplate = loadedTemplate.map((item: BulkTemplateItem) => {
            const correctIcon = getIconForActivity(item.activity_type, item.title, item.icon);
            return {
              ...item,
              icon: correctIcon
            };
          });
          
          // Set default hosts: Omar for all, Sam for Pilates (if IDs are available)
          if (omarId || samId) {
            loadedTemplate = loadedTemplate.map((item: BulkTemplateItem) => {
              const defaultHost = item.activity_type === 'Pilates' && samId ? samId : omarId || item.host_user_id;
              return {
                ...item,
                host_user_id: item.host_user_id || defaultHost
              };
            });
          }
          
          setTemplate(loadedTemplate);
        } else {
          // No template found, use default template
          setTemplate(DEFAULT_TEMPLATE);
          // Mark as unsaved so user can save it
          setHasUnsavedChanges(true);
        }
      } catch (error) {
        console.error('Error loading template:', error);
        // On error, use default template
        setTemplate(DEFAULT_TEMPLATE);
      } finally {
        setTemplateLoaded(true);
      }
    };
    loadTemplate();
  }, []);

  // Update template with default hosts when user IDs become available
	  useEffect(() => {
	    if ((omarId || samId) && templateLoaded && template.length > 0) {
	      setTemplate(prevTemplate => 
	        prevTemplate.map(item => {
	          // Only set default host if no host is already set
	          if (!item.host_user_id) {
	            const defaultHost = item.activity_type === 'Pilates' && samId ? samId : omarId;
	            return {
	              ...item,
	              host_user_id: defaultHost ?? undefined
	            };
	          }
	          return item;
	        })
	      );
	    }
	  }, [omarId, samId, templateLoaded]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        if (data.users) {
          // Sort users alphabetically
          const sortedUsers = [...data.users].sort((a: User, b: User) => {
            const nameA = [a.first_name, a.last_name].filter(Boolean).join(' ').toLowerCase();
            const nameB = [b.first_name, b.last_name].filter(Boolean).join(' ').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          setUsers(sortedUsers);
          
          // Find Omar Ellaboudy and Sam Barnes
          const omar = sortedUsers.find((u: User) => 
            (u.first_name?.toLowerCase().includes('omar') && u.last_name?.toLowerCase().includes('ellaboudy')) ||
            u.first_name?.toLowerCase() === 'omar'
          );
          const sam = sortedUsers.find((u: User) => 
            (u.first_name?.toLowerCase().includes('sam') && u.last_name?.toLowerCase().includes('barnes')) ||
            (u.first_name?.toLowerCase() === 'sam' && u.last_name?.toLowerCase() === 'barnes')
          );
          
          if (omar) setOmarId(omar.id);
          if (sam) setSamId(sam.id);
          
          // Set the first user as the default admin host
          const adminUser = sortedUsers[0];
          if (adminUser) {
            setCurrentAdminId(adminUser.id);
          }
          
          // Note: Template hosts will be updated in separate useEffect when IDs are available
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);
  
  // Close host picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-host-picker]')) {
        setShowHostPicker({});
        setHostSearchQuery({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Track unsaved changes (but not on initial load)
  useEffect(() => {
    if (templateLoaded) {
      // Only mark as unsaved if template actually changed (not just initial load)
      // This is handled by updateTemplateItem, addTemplateRow, removeTemplateRow
    }
  }, [templateLoaded]);

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/bulk-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_data: template }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save template');
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateTemplateItem = (index: number, field: keyof BulkTemplateItem, value: string | number | undefined) => {
    const newTemplate = [...template];
    const updatedItem = { ...newTemplate[index], [field]: value };
    
    // Auto-set cost and icon based on activity_type
    if (field === 'activity_type' || field === 'title') {
      const activityType = field === 'activity_type' ? value as string : updatedItem.activity_type;
      const title = field === 'title' ? value as string : updatedItem.title;
      
      // Auto-set icon based on activity type
      if (field === 'activity_type') {
        switch (activityType) {
          case 'Circuits':
            updatedItem.icon = 'flame-outline';
            break;
          case 'Running':
            updatedItem.icon = 'walk';
            break;
          case 'Pilates':
            updatedItem.icon = 'pilates';
            break;
          case 'Cardio':
            // Check if it's an erg/rowing session
            if (typeof title === 'string' && title.toLowerCase().includes('erg')) {
              updatedItem.icon = 'boat';
            }
            break;
          default:
            // Keep existing icon if no match
            break;
        }
      }
      
      // Auto-set cost to 0 for Running, Pilates, or Hyrox activities
      if (activityType === 'Running' || activityType === 'Pilates' || 
          (typeof title === 'string' && title.toLowerCase().includes('hyrox'))) {
        updatedItem.cost = 0;
      } else if (field === 'activity_type' && updatedItem.cost === 0) {
        // Reset to default cost if changing away from Running/Pilates/Hyrox
        updatedItem.cost = 1;
      }
    }
    
    newTemplate[index] = updatedItem;
    setTemplate(newTemplate);
    setHasUnsavedChanges(true);
  };

  const addTemplateRow = () => {
    setTemplate([
      ...template,
      { day: 'Monday', time: '09:00', duration: 60, activity_type: 'Circuits', title: '', description: '', location: 'Highland House, RG41 4SP', cost: 1, icon: 'flame-outline' },
    ]);
    setHasUnsavedChanges(true);
  };

  const removeTemplateRow = (index: number) => {
    setTemplate(template.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return 'Select Host';
    return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Select Host';
  };

  const getIconForActivity = (activityType: string, title: string, currentIcon?: string): string => {
    // Auto-map based on activity type and title
    switch (activityType) {
      case 'Circuits':
        return 'flame-outline';
      case 'Running':
        return 'walk';
      case 'Pilates':
        return 'pilates';
      case 'Cardio':
        // Check if it's an erg/rowing session
        if (title.toLowerCase().includes('erg') || title.toLowerCase().includes('rowing')) {
          return 'boat';
        }
        return currentIcon || 'flame-outline';
      default:
        // If icon is explicitly set and not one of the old wrong values, use it
        if (currentIcon && currentIcon !== 'barbell' && currentIcon !== 'running' && currentIcon !== 'rowing' && currentIcon !== 'yoga') {
          return currentIcon;
        }
        return 'flame-outline';
    }
  };

  const handleBulkCreate = async () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    // Validate that all rows have titles
    const rowsWithoutTitles = template.filter(item => !item.title || !item.title.trim());
    if (rowsWithoutTitles.length > 0) {
      alert(`Please provide a title for all template rows. ${rowsWithoutTitles.length} row(s) are missing titles.`);
      return;
    }

    try {
      setLoading(true);
      const start = new Date(startDate);
      const activitiesToCreate: any[] = [];

      // Generate activities for each week
      for (let week = 0; week < weeks; week++) {
        template.forEach((item) => {
          if (!item.title || !item.title.trim()) return; // Skip rows without title (shouldn't happen after validation)

          const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(item.day);
          if (dayOfWeek === -1) return;

          const activityDate = new Date(start);
          const startDayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
          let daysToAdd = dayOfWeek - startDayOfWeek;
          // If the target day is earlier in the week than start day, add 7 days to get to next week
          if (daysToAdd < 0) {
            daysToAdd += 7;
          }
          activityDate.setDate(start.getDate() + week * 7 + daysToAdd);

          const [hours, minutes] = item.time.split(':').map(Number);
          activityDate.setHours(hours, minutes, 0, 0);

          const endDate = new Date(activityDate);
          endDate.setMinutes(endDate.getMinutes() + item.duration);

          // Determine cost: Running, Pilates, and Hyrox are always 0 cost
          let activityCost = item.cost ?? 1;
          if (item.activity_type === 'Running' || item.activity_type === 'Pilates' || 
              item.title.toLowerCase().includes('hyrox')) {
            activityCost = 0;
          }

          activitiesToCreate.push({
            title: item.title.trim(),
            description: item.description?.trim() || null,
            start_at: activityDate.toISOString(),
            end_at: endDate.toISOString(),
            location_name: item.location || null,
            activity_type: item.activity_type,
            host_user_id: item.host_user_id || undefined,
            cost: activityCost,
            icon: getIconForActivity(item.activity_type, item.title, item.icon),
            visibility: 'public', // Always public for bulk created activities
            attendees: [], // No attendees for bulk created activities
          });
        });
      }

      // Create activities in batches
      const batchSize = 10;
      for (let i = 0; i < activitiesToCreate.length; i += batchSize) {
        const batch = activitiesToCreate.slice(i, i + batchSize);
        await Promise.all(
          batch.map((activity) =>
            fetch('/api/admin/activities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(activity),
            })
          )
        );
      }

      alert(`Successfully created ${activitiesToCreate.length} activities!`);
      router.push('/admin/schedule?tab=upcoming');
      router.refresh();
    } catch (error) {
      console.error('Error creating bulk activities:', error);
      alert('Failed to create activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px', color: '#FFFFFF' }}>Bulk Creation Settings</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '8px' }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const selectedDate = new Date(e.target.value + 'T00:00:00');
                // Only allow Mondays (day 1)
                if (selectedDate.getDay() === 1) {
                  setStartDate(e.target.value);
                } else {
                  // If not Monday, find the next Monday
                  const daysUntilMonday = selectedDate.getDay() === 0 ? 1 : 8 - selectedDate.getDay();
                  const nextMonday = new Date(selectedDate);
                  nextMonday.setDate(selectedDate.getDate() + daysUntilMonday);
                  const mondayStr = nextMonday.toISOString().split('T')[0];
                  setStartDate(mondayStr);
                  // Force the input to update
                  setTimeout(() => {
                    const input = e.target as HTMLInputElement;
                    if (input) input.value = mondayStr;
                  }, 0);
                }
              }}
              onFocus={(e) => {
                // Prevent non-Monday selection by restricting available dates
                const input = e.target as HTMLInputElement;
                const minDate = getNextMonday().toISOString().split('T')[0];
                input.min = minDate;
              }}
              min={getNextMonday().toISOString().split('T')[0]}
              step={7}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1C1C1E',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '15px',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '8px' }}>
              Number of Weeks
            </label>
            <input
              type="number"
              min="1"
              max="52"
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value) || 1)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1C1C1E',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '15px',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#FFFFFF', marginBottom: '4px' }}>Template</h2>
            {saving && (
              <div style={{ fontSize: '12px', color: 'rgba(235, 235, 245, 0.6)' }}>Saving...</div>
            )}
            {hasUnsavedChanges && !saving && (
              <div style={{ fontSize: '12px', color: '#FF9500' }}>Unsaved changes</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveTemplate}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  background: saving ? 'rgba(0, 122, 255, 0.5)' : '#007AFF',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            )}
            <button
              onClick={addTemplateRow}
              style={{
                padding: '8px 16px',
                background: '#007AFF',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Add Row
            </button>
            <button
              onClick={handleBulkCreate}
              disabled={loading}
              className="button button-primary"
              style={{
                fontSize: '15px',
                padding: '8px 16px',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : `Create ${weeks} Week${weeks > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', background: '#0a0a0a' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0a0a0a' }}>
            <thead>
              <tr style={{ background: '#141414' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Day</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '120px' }}>Mins</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title *</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Host</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cost</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Icon</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {template.map((item, index) => (
                <tr 
                  key={index} 
                  style={{ 
                    background: '#0a0a0a',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#0a0a0a';
                  }}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <select
                      value={item.day}
                      onChange={(e) => updateTemplateItem(index, 'day', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => updateTemplateItem(index, 'time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px', width: '120px' }}>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={item.duration}
                      onChange={(e) => updateTemplateItem(index, 'duration', parseInt(e.target.value) || 60)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <select
                      value={item.activity_type}
                      onChange={(e) => updateTemplateItem(index, 'activity_type', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    >
                      <option value="PT">PT</option>
                      <option value="Circuits">Circuits</option>
                      <option value="Running">Running</option>
                      <option value="Pilates">Pilates</option>
                      <option value="Strength">Strength</option>
                      <option value="Cardio">Cardio</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <input
                      type="text"
                      placeholder="Title *"
                      value={item.title}
                      onChange={(e) => updateTemplateItem(index, 'title', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1C1C1E',
                        border: item.title ? '1px solid rgba(84, 84, 88, 0.65)' : '1px solid #FF3B30',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={item.description || ''}
                      onChange={(e) => updateTemplateItem(index, 'description', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <input
                      type="text"
                      value={item.location}
                      onChange={(e) => updateTemplateItem(index, 'location', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px', position: 'relative' }} data-host-picker>
                    <div
                      onClick={() => setShowHostPicker(prev => ({ ...prev, [index]: !prev[index] }))}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        {item.host_user_id 
                          ? (() => {
                              const host = users.find(u => u.id === item.host_user_id);
                              return host ? [host.first_name, host.last_name].filter(Boolean).join(' ') || 'Unknown' : 'Select Host';
                            })()
                          : 'Select Host (optional)'}
                      </span>
                      <span style={{ fontSize: '12px' }}>▼</span>
                    </div>
                    {showHostPicker[index] && (
                      <div
                        data-host-picker
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          background: '#1C1C1E',
                          border: '1px solid rgba(84, 84, 88, 0.65)',
                          borderRadius: '6px',
                          marginTop: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Search hosts..."
                          value={hostSearchQuery[index] || ''}
                          onChange={(e) => setHostSearchQuery(prev => ({ ...prev, [index]: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            padding: '8px',
                            background: '#2C2C2E',
                            border: 'none',
                            borderBottom: '1px solid rgba(84, 84, 88, 0.65)',
                            borderRadius: '6px 6px 0 0',
                            color: '#FFFFFF',
                            fontSize: '15px',
                          }}
                        />
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          <div
                            onClick={() => {
                              updateTemplateItem(index, 'host_user_id', undefined);
                              setShowHostPicker(prev => ({ ...prev, [index]: false }));
                              setHostSearchQuery(prev => ({ ...prev, [index]: '' }));
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              color: !item.host_user_id ? '#007AFF' : 'rgba(235, 235, 245, 0.6)',
                              fontSize: '15px',
                              borderBottom: '1px solid rgba(84, 84, 88, 0.3)',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            Select Host (optional)
                          </div>
                          {users
                            .filter((user) => {
                              const query = (hostSearchQuery[index] || '').toLowerCase();
                              if (!query) return true;
                              const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').toLowerCase();
                              const nickname = (user.nickname || '').toLowerCase();
                              return fullName.includes(query) || nickname.includes(query);
                            })
                            .map((user) => {
                              const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown';
                              return (
                                <div
                                  key={user.id}
                                  onClick={() => {
                                    updateTemplateItem(index, 'host_user_id', user.id);
                                    setShowHostPicker(prev => ({ ...prev, [index]: false }));
                                    setHostSearchQuery(prev => ({ ...prev, [index]: '' }));
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    color: item.host_user_id === user.id ? '#007AFF' : '#FFFFFF',
                                    fontSize: '15px',
                                    borderBottom: '1px solid rgba(84, 84, 88, 0.3)',
                                    fontWeight: item.host_user_id === user.id ? '600' : '400',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  {userName}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', width: '80px' }}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Cost"
                      value={item.cost ?? 1}
                      onChange={(e) => updateTemplateItem(index, 'cost', parseFloat(e.target.value) || 0)}
                      disabled={item.activity_type === 'Running' || item.activity_type === 'Pilates' || item.title.toLowerCase().includes('hyrox')}
                      style={{
                        width: '60px',
                        padding: '8px',
                        background: (item.activity_type === 'Running' || item.activity_type === 'Pilates' || item.title.toLowerCase().includes('hyrox')) 
                          ? '#2C2C2E' 
                          : '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: (item.activity_type === 'Running' || item.activity_type === 'Pilates' || item.title.toLowerCase().includes('hyrox'))
                          ? 'rgba(235, 235, 245, 0.4)'
                          : '#FFFFFF',
                        fontSize: '15px',
                        cursor: (item.activity_type === 'Running' || item.activity_type === 'Pilates' || item.title.toLowerCase().includes('hyrox'))
                          ? 'not-allowed'
                          : 'text',
                      }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <select
                      value={item.icon || 'flame-outline'}
                      onChange={(e) => updateTemplateItem(index, 'icon', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    >
                      <option value="flame-outline">Circuits</option>
                      <option value="walk">Running</option>
                      <option value="pilates">Pilates</option>
                      <option value="boat">Rowing/Erg</option>
                      <option value="barbell">Barbell</option>
                      <option value="yoga">Yoga</option>
                      <option value="swimming">Swimming</option>
                      <option value="cycling">Cycling</option>
                      <option value="tennis">Tennis</option>
                      <option value="basketball">Basketball</option>
                      <option value="football">Football</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px 20px', width: '40px', textAlign: 'center' }}>
                    <button
                      onClick={() => removeTemplateRow(index)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#FF3B30',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        lineHeight: '1',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
