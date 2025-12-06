'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactNode } from 'react';

interface SecondaryNavItem {
  filter: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface SecondarySidebarProps {
  title: string;
  items: SecondaryNavItem[];
  basePath: string;
  filterKey?: string;
  mainSidebarWidth?: string;
}

export default function SecondarySidebar({
  title,
  items,
  basePath,
  filterKey = 'filter',
  mainSidebarWidth = '80px',
}: SecondarySidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Default to first item's filter if no filter is set, otherwise 'all'
  const currentFilter = searchParams.get(filterKey) || (items.length > 0 ? items[0].filter : 'all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only read from localStorage after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('secondary-sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem('secondary-sidebar-collapsed', String(isCollapsed));
      // Dispatch custom event to notify layout of width change
      window.dispatchEvent(new Event('sidebar-toggle'));
    }
  }, [isCollapsed, isMounted]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      style={{
        position: 'fixed',
        left: mainSidebarWidth,
        top: 0,
        bottom: 0,
        width: isCollapsed ? '40px' : '200px',
        background: '#1a1a1a',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 998,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
      className="secondary-sidebar"
    >
      {/* Title Section */}
      {!isCollapsed && (
        <div
          style={{
            height: '72px',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#FFFFFF',
              margin: 0,
              letterSpacing: '0.37px',
            }}
          >
            {title}
          </h2>
        </div>
      )}

      {/* Navigation Items */}
      {!isCollapsed && (
        <nav
          style={{
            flex: 1,
            padding: '12px 8px',
            overflowY: 'auto',
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
                justifyContent: 'space-between',
                padding: '10px 12px',
                marginBottom: '4px',
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
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: item.icon ? '8px' : '0',
                }}
              >
                {item.icon && (
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </span>
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
        </nav>
      )}
      
      {/* Toggle Button at Bottom */}
      <div
        style={{
          height: '56px',
          padding: isCollapsed ? '0 12px' : '0 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 'auto',
        }}
      >
        <button
          onClick={toggleCollapse}
          style={{
            width: isCollapsed ? '32px' : '100%',
            height: '40px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: '500',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span>{isCollapsed ? '▶' : '◀'}</span>
          {!isCollapsed && (
            <span style={{ fontSize: '14px' }}>
              Collapse
            </span>
          )}
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .secondary-sidebar {
            left: 0 !important;
            width: 240px !important;
            transform: translateX(-100%);
          }
        }
      `}</style>
    </aside>
  );
}
