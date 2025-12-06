'use client';

import { useEffect, useState, useRef } from 'react';

interface AttendanceDataPoint {
  day: string;
  timeSlot: string;
  date: Date;
  activities: Array<{
    id: string;
    title: string;
    start_at: string;
    end_at: string | null;
    location_name: string | null;
    attendanceCount: number;
  }>;
  totalAttendance: number;
}

interface Summary {
  totalSessions: number;
  totalAttendance: number;
  averageAttendance: number;
}

export default function CircuitAttendanceChart() {
  const [attendanceData, setAttendanceData] = useState<AttendanceDataPoint[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalSessions: 0,
    totalAttendance: 0,
    averageAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDataPoint, setSelectedDataPoint] = useState<AttendanceDataPoint | null>(null);
  const [chartWidth, setChartWidth] = useState(1000);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/schedule/circuit-attendance');
        
        if (!response.ok) {
          throw new Error('Failed to fetch attendance data');
        }

        const data = await response.json();
        
        // Parse dates from strings
        const parsedData = data.attendanceData.map((point: any) => ({
          ...point,
          date: new Date(point.date),
        }));

        setAttendanceData(parsedData);
        setSummary(data.summary);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update chart width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth - 48); // Subtract padding (24px * 2)
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        Loading attendance data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#FF3B30' }}>
        Error: {error}
      </div>
    );
  }

  if (attendanceData.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        No circuit attendance data available.
      </div>
    );
  }

  // Find max attendance for scaling
  const maxAttendance = Math.max(...attendanceData.map(d => d.totalAttendance), 1);
  const minAttendance = Math.min(...attendanceData.map(d => d.totalAttendance), 0);
  const attendanceRange = maxAttendance - minAttendance || 1;

  // Chart dimensions - full width
  const chartHeight = 400;
  const padding = { top: 40, right: 60, bottom: 60, left: 80 };

  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Format date for display - "Sat 3rd" format
  const formatDateShort = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                   day === 2 || day === 22 ? 'nd' :
                   day === 3 || day === 23 ? 'rd' : 'th';
    return `${dayName} ${day}${suffix}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date, timeSlot: string) => {
    return `${formatDate(date)} ${timeSlot}`;
  };

  // Calculate positions for data points
  const getXPosition = (index: number) => {
    return padding.left + (index / (attendanceData.length - 1 || 1)) * graphWidth;
  };

  const getYPosition = (attendance: number) => {
    const normalized = (attendance - minAttendance) / attendanceRange;
    return padding.top + graphHeight - (normalized * graphHeight);
  };

  // Generate Y-axis labels
  const yAxisSteps = 5;
  const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
    const value = minAttendance + (attendanceRange / yAxisSteps) * i;
    return Math.round(value);
  });

  // Generate X-axis labels (show every nth label to avoid crowding)
  const xAxisLabelInterval = Math.max(1, Math.floor(attendanceData.length / 10));

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
            Total Sessions
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
            {summary.totalSessions}
          </div>
        </div>
        <div style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
            Total Attendance
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
            {summary.totalAttendance}
          </div>
        </div>
        <div style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
            Average Attendance
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
            {summary.averageAttendance.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Line Graph Chart */}
      <div 
        ref={chartContainerRef}
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          width: '100%',
        }}
      >
        <h2 style={{ 
          fontSize: '22px', 
          fontWeight: '600', 
          marginBottom: '24px', 
          color: '#FFFFFF' 
        }}>
          Attendance Over Time
        </h2>
        
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg 
            width={chartWidth} 
            height={chartHeight}
            style={{ display: 'block', width: '100%', height: 'auto' }}
          >
          {/* Grid lines */}
          {yAxisLabels.map((label, i) => {
            const y = getYPosition(label);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + graphWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + graphHeight}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="2"
          />

          {/* Y-axis labels */}
          {yAxisLabels.map((label, i) => {
            const y = getYPosition(label);
            return (
              <g key={`y-label-${i}`}>
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="rgba(255, 255, 255, 0.6)"
                  fontSize="12"
                  textAnchor="end"
                  style={{ userSelect: 'none' }}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Y-axis title */}
          <text
            x={20}
            y={chartHeight / 2}
            fill="rgba(255, 255, 255, 0.8)"
            fontSize="13"
            fontWeight="600"
            textAnchor="middle"
            transform={`rotate(-90, 20, ${chartHeight / 2})`}
            style={{ userSelect: 'none' }}
          >
            Attendance Count
          </text>

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + graphHeight}
            x2={padding.left + graphWidth}
            y2={padding.top + graphHeight}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="2"
          />

          {/* X-axis labels */}
          {attendanceData.map((dataPoint, index) => {
            if (index % xAxisLabelInterval !== 0 && index !== attendanceData.length - 1) return null;
            const x = getXPosition(index);
            return (
              <g key={`x-label-${index}`}>
                <text
                  x={x}
                  y={chartHeight - padding.bottom + 20}
                  fill="rgba(255, 255, 255, 0.6)"
                  fontSize="12"
                  textAnchor="middle"
                  style={{ userSelect: 'none' }}
                >
                  {formatDateShort(dataPoint.date)}
                </text>
                <text
                  x={x}
                  y={chartHeight - padding.bottom + 35}
                  fill="rgba(255, 255, 255, 0.5)"
                  fontSize="11"
                  textAnchor="middle"
                  style={{ userSelect: 'none' }}
                >
                  {dataPoint.timeSlot}
                </text>
              </g>
            );
          })}

          {/* X-axis title */}
          <text
            x={padding.left + graphWidth / 2}
            y={chartHeight - 10}
            fill="rgba(255, 255, 255, 0.8)"
            fontSize="13"
            fontWeight="600"
            textAnchor="middle"
            style={{ userSelect: 'none' }}
          >
            Date / Time
          </text>

          {/* Average line */}
          <line
            x1={padding.left}
            y1={getYPosition(summary.averageAttendance)}
            x2={padding.left + graphWidth}
            y2={getYPosition(summary.averageAttendance)}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x={padding.left + graphWidth - 10}
            y={getYPosition(summary.averageAttendance) - 5}
            fill="rgba(255, 255, 255, 0.5)"
            fontSize="11"
            textAnchor="end"
            style={{ userSelect: 'none' }}
          >
            Avg: {summary.averageAttendance.toFixed(1)}
          </text>

          {/* Line path */}
          <path
            d={`M ${attendanceData.map((point, index) => {
              const x = getXPosition(index);
              const y = getYPosition(point.totalAttendance);
              return `${x},${y}`;
            }).join(' L ')}`}
            fill="none"
            stroke="#007AFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {attendanceData.map((dataPoint, index) => {
            const x = getXPosition(index);
            const y = getYPosition(dataPoint.totalAttendance);
            const isSelected = selectedDataPoint === dataPoint;
            const isPopular = dataPoint.totalAttendance >= summary.averageAttendance;
            
            return (
              <g key={`point-${index}`}>
                {/* Hover area */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedDataPoint(isSelected ? null : dataPoint)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.r = '12';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.r = '8';
                  }}
                />
                {/* Point */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? "6" : "4"}
                  fill={isPopular ? "#007AFF" : "rgba(255, 255, 255, 0.6)"}
                  stroke={isSelected ? "#FFFFFF" : "transparent"}
                  strokeWidth={isSelected ? "2" : "0"}
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelectedDataPoint(isSelected ? null : dataPoint)}
                />
                {/* Tooltip on hover */}
                <title>
                  {formatDateTime(dataPoint.date, dataPoint.timeSlot)}: {dataPoint.totalAttendance} attendees
                </title>
              </g>
            );
          })}
          </svg>
        </div>
      </div>

      {/* Details Panel */}
      {selectedDataPoint && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#FFFFFF' 
            }}>
              {selectedDataPoint.day} {selectedDataPoint.timeSlot} - {formatDate(selectedDataPoint.date)}
            </h3>
            <button
              onClick={() => setSelectedDataPoint(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(0, 122, 255, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 122, 255, 0.2)',
          }}>
            <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '600' }}>
              Total Attendance: {selectedDataPoint.totalAttendance}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
              Across {selectedDataPoint.activities.length} session{selectedDataPoint.activities.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedDataPoint.activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ 
                  fontSize: '15px', 
                  fontWeight: '600', 
                  color: '#FFFFFF',
                  marginBottom: '8px',
                }}>
                  {activity.title}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '4px',
                }}>
                  {activity.location_name || 'No location'}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#007AFF',
                  fontWeight: '600',
                }}>
                  {activity.attendanceCount} attendee{activity.attendanceCount !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

