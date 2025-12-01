'use client';

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
  const singularType = type.slice(0, -1); // Remove 's' from activities/events/workouts

  return (
    <main style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      background: '#000000',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: '#FFFFFF',
    }}>
      <div style={{
        background: '#1C1C1E',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid rgba(84, 84, 88, 0.65)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          marginBottom: '32px',
        }}>
          <img 
            src="/omr-logo-inverted.png" 
            alt="OMR Hub" 
            style={{
              maxWidth: '200px',
              width: '100%',
              height: 'auto',
            }}
            onError={(e) => {
              // Fallback if logo doesn't exist yet
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.logo-fallback');
              if (fallback) {
                (fallback as HTMLElement).style.display = 'block';
              }
            }}
          />
          <div 
            className="logo-fallback"
            style={{
              display: 'none',
              fontSize: '48px',
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: '0.37px',
            }}
          >
            OMR Hub
          </div>
        </div>
        
        {/* Title */}
        <h1 style={{
          fontSize: '34px',
          fontWeight: '700',
          lineHeight: '41px',
          letterSpacing: '0.37px',
          marginBottom: '8px',
          color: '#FFFFFF',
        }}>
          Open in OMR Hub
        </h1>
        
        {/* Subtitle */}
        <p style={{
          fontSize: '17px',
          lineHeight: '22px',
          letterSpacing: '-0.41px',
          color: 'rgba(235, 235, 245, 0.6)',
          marginBottom: '32px',
        }}>
          This {singularType} is ready to view in the OMR Hub app
        </p>
        
        {/* ID Display */}
        <div style={{
          background: '#2C2C2E',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '32px',
          fontFamily: '"SF Mono", "Monaco", "Courier New", monospace',
          fontSize: '13px',
          lineHeight: '18px',
          color: 'rgba(235, 235, 245, 0.6)',
          wordBreak: 'break-all',
          textAlign: 'left',
        }}>
          {typeLabel} ID: {id}
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '32px',
        }}>
          <a
            href={deepLinkUrl}
            style={{
              display: 'inline-block',
              padding: '16px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '17px',
              lineHeight: '22px',
              letterSpacing: '-0.41px',
              transition: 'opacity 0.2s',
              background: '#007AFF',
              color: '#FFFFFF',
              width: '100%',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
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
              padding: '16px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '17px',
              lineHeight: '22px',
              letterSpacing: '-0.41px',
              transition: 'opacity 0.2s',
              background: '#2C2C2E',
              color: '#FFFFFF',
              width: '100%',
              textAlign: 'center',
              border: '1px solid rgba(84, 84, 88, 0.65)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Download from App Store
          </a>
        </div>
        
        {/* Info Text */}
        <div style={{
          padding: '20px',
          background: '#000000',
          borderRadius: '12px',
          fontSize: '15px',
          lineHeight: '20px',
          letterSpacing: '-0.24px',
          color: 'rgba(235, 235, 245, 0.6)',
        }}>
          <p style={{ margin: '0 0 12px 0' }}>
            <strong style={{ color: '#FFFFFF' }}>Don't have the app?</strong> Tap "Download from App Store" to install OMR Hub and access this {singularType}.
          </p>
          <p style={{ margin: '0', fontSize: '13px', lineHeight: '18px' }}>
            If you already have the app installed, the link should open automatically.
          </p>
        </div>
      </div>
    </main>
  );
}
