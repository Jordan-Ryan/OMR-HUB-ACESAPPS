'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface SubNavItem {
  filter: string;
  label: string;
  count?: number;
}

interface SubNavigationProps {
  items: SubNavItem[];
  basePath: string;
  filterKey?: string;
  defaultFilter?: string;
}

export default function SubNavigation({ items, basePath, filterKey = 'filter', defaultFilter }: SubNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get(filterKey) || defaultFilter || (items.length > 0 ? items[0].filter : 'all');

  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: '#1a1a1a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 32px',
        paddingLeft: 'calc(280px + 32px)',
        width: '100%',
      }}
      className="sub-navigation"
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          maxWidth: '1600px',
        }}
      >
        {items.map((item) => {
          const isActive = currentFilter === item.filter;
          const href = item.filter === 'all' 
            ? basePath 
            : `${basePath}?${filterKey}=${item.filter}`;

          return (
            <Link
              key={item.filter}
              href={href}
              style={{
                color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                padding: '12px 16px',
                borderRadius: '8px 8px 0 0',
                background: isActive
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
                borderBottom: isActive
                  ? '2px solid #007AFF'
                  : '2px solid transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }
              }}
            >
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '2px 6px',
                    borderRadius: '10px',
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
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          .sub-navigation {
            padding: 0 16px 0 calc(60px + 16px) !important;
          }
        }
        @media (max-width: 480px) {
          .sub-navigation {
            padding: 0 12px 0 calc(60px + 12px) !important;
          }
        }
      `}</style>
    </div>
  );
}

