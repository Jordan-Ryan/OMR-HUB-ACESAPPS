'use client';

import { useEffect } from 'react';

interface DeepLinkPageProps {
  type: 'activities' | 'events' | 'workouts';
  id: string;
  appStoreUrl?: string;
}

export default function DeepLinkPage({ 
  type, 
  id,
  appStoreUrl = 'https://apps.apple.com/gb/app/omr-hub/id6755069825'
}: DeepLinkPageProps) {
  const deepLinkUrl = `omrhub://a/${type}/${id}`;
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  // Smart App Banner is handled via Next.js metadata export in page files

  return (
    <main style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: '#333',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 30px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'white',
        }}>
          OMR
        </div>
        
        <h1 style={{
          fontSize: '28px',
          marginBottom: '16px',
          color: '#1a1a1a',
        }}>
          Open in OMR Hub
        </h1>
        
        <p style={{
          color: '#666',
          marginBottom: '30px',
          fontSize: '16px',
          lineHeight: '1.5',
        }}>
          This {type.slice(0, -1)} is ready to view in the OMR Hub app
        </p>
        
        <div style={{
          background: '#f5f5f5',
          padding: '12px 20px',
          borderRadius: '10px',
          marginBottom: '30px',
          fontFamily: '"Courier New", monospace',
          fontSize: '14px',
          color: '#666',
          wordBreak: 'break-all',
        }}>
          {typeLabel} ID: {id}
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <a
            href={deepLinkUrl}
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'all 0.2s',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              width: '100%',
            }}
            onClick={(e) => {
              // Try deep link, fallback to app store after delay
              setTimeout(() => {
                window.location.href = appStoreUrl;
              }, 500);
            }}
          >
            Open in App
          </a>
          
          <a
            href={appStoreUrl}
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'all 0.2s',
              background: '#f5f5f5',
              color: '#333',
              width: '100%',
            }}
          >
            Download from App Store
          </a>
        </div>
        
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f9f9f9',
          borderRadius: '10px',
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.6',
        }}>
          <p>
            <strong>Don't have the app?</strong> Tap "Download from App Store" to install OMR Hub and access this {type.slice(0, -1)}.
          </p>
          <p style={{ marginTop: '12px', fontSize: '13px' }}>
            If you already have the app installed, the link should open automatically.
          </p>
        </div>
      </div>
    </main>
  );
}

