'use client';

import { useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterConfig[];
  onClearFilters?: () => void;
  style?: React.CSSProperties;
}

export default function FilterBar({ filters, onClearFilters, style }: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const hasActiveFilters = filters.some((f) => f.value !== 'all' && f.value !== '');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '24px',
        ...style,
      }}
    >
      {filters.map((filter) => (
        <div
          key={filter.label}
          style={{
            position: 'relative',
          }}
        >
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === filter.label ? null : filter.label)
            }
            style={{
              padding: '10px 16px',
              background: filter.value !== 'all' && filter.value !== ''
                ? 'rgba(0, 122, 255, 0.15)'
                : '#1a1a1a',
              border:
                filter.value !== 'all' && filter.value !== ''
                  ? '1px solid rgba(0, 122, 255, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                filter.value !== 'all' && filter.value !== ''
                  ? 'rgba(0, 122, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                filter.value !== 'all' && filter.value !== ''
                  ? 'rgba(0, 122, 255, 0.15)'
                  : '#1a1a1a';
            }}
          >
            <span>
              {filter.label}:{' '}
              {filter.options.find((opt) => opt.value === filter.value)?.label ||
                'All'}
            </span>
            <span style={{ fontSize: '12px' }}>
              {openDropdown === filter.label ? '▲' : '▼'}
            </span>
          </button>

          {openDropdown === filter.label && (
            <>
              <div
                onClick={() => setOpenDropdown(null)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 998,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  minWidth: '200px',
                  background: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '8px',
                  zIndex: 999,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                }}
              >
                {filter.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      filter.onChange(option.value);
                      setOpenDropdown(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      background:
                        filter.value === option.value
                          ? 'rgba(0, 122, 255, 0.15)'
                          : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color:
                        filter.value === option.value
                          ? '#FFFFFF'
                          : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      fontWeight: filter.value === option.value ? '600' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (filter.value !== option.value) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filter.value !== option.value) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ))}

      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}




