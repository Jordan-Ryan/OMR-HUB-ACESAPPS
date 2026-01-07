'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactNode } from 'react';

export interface FilterTabItem {
  filter: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface FilterTabsProps {
  items: FilterTabItem[];
  basePath: string;
  filterKey?: string;
  defaultFilter?: string;
}

export default function FilterTabs({
  items,
  basePath,
  filterKey = 'filter',
  defaultFilter,
}: FilterTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get(filterKey) || defaultFilter || (items.length > 0 ? items[0].filter : 'all');

  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {items.map((item, index) => {
        const isActive = currentFilter === item.filter;
        // First item or 'all' filter goes to base path (no query param) - this makes it the default
        const href =
          item.filter === 'all' || index === 0
            ? basePath
            : `${basePath}?${filterKey}=${item.filter}`;

        return (
          <Link
            key={item.filter}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: item.icon ? '8px' : '0',
              padding: '10px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
              background: isActive
                ? 'rgba(255, 255, 255, 0.12)'
                : 'transparent',
              border: isActive
                ? '1px solid rgba(255, 255, 255, 0.2)'
                : '1px solid transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontWeight: isActive ? '600' : '500',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            {item.icon && (
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  background: isActive
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                  minWidth: '20px',
                  textAlign: 'center',
                }}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}


