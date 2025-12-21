'use client';

import { useState } from 'react';
import { SearchIcon } from '@/components/icons/AdminIcons';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: React.CSSProperties;
}

export default function SearchInput({
  placeholder = 'Search...',
  value,
  onChange,
  onFocus,
  onBlur,
  style,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        ...style,
      }}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        style={{
          width: '100%',
          padding: '12px 16px 12px 44px',
          background: isFocused ? '#1f1f1f' : '#1a1a1a',
          border: isFocused
            ? '1px solid rgba(0, 122, 255, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: '#FFFFFF',
          fontSize: '15px',
          outline: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isFocused
            ? '0 4px 16px rgba(0, 122, 255, 0.1)'
            : '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: isFocused ? 'rgba(0, 122, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)',
          pointerEvents: 'none',
          transition: 'color 0.2s',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SearchIcon width={18} height={18} />
      </span>
    </div>
  );
}



