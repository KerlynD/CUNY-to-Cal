import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface PopupState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  reminderMinutes: number;
  isOnCUNYPage: boolean;
}

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="m12 1 0 6m0 6 0 6m11-7-6 0m-6 0-6 0"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    isLoading: false,
    error: null,
    success: null,
    reminderMinutes: 10,
    isOnCUNYPage: false
  });

  useEffect(() => {
    loadSettings();
    checkCurrentPage();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['reminderMinutes']);
      setState(prev => ({
        ...prev,
        reminderMinutes: result.reminderMinutes ?? 10
      }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const checkCurrentPage = async () => {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = activeTab.url || '';
      
      const isCUNYPage = (
        url.includes('home.cunyfirst.cuny.edu') && url.includes('CLASS_SCHEDULE')
      ) || (
        url.includes('schedulebuilder.cuny.edu') || url.includes('sb.cunyfirst.cuny.edu')
      );
      
      setState(prev => ({ ...prev, isOnCUNYPage: isCUNYPage }));
    } catch (error) {
      console.error('Failed to check current page:', error);
    }
  };

  const handleExport = async () => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      success: null 
    }));

    try {
      await chrome.storage.sync.set({ reminderMinutes: state.reminderMinutes });

      await chrome.runtime.sendMessage({
        type: 'EXPORT_FROM_POPUP',
        settings: { reminderMinutes: state.reminderMinutes }
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: 'Schedule exported successfully! Check your downloads folder.'
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }));
    }
  };

  const handleReminderChange = (minutes: number) => {
    setState(prev => ({ ...prev, reminderMinutes: minutes }));
  };

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div style={{ 
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'transparent'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '8px',
          marginRight: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <CalendarIcon />
        </div>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '700',
            color: 'white',
            letterSpacing: '-0.5px'
          }}>
            CUNY to Calendar
          </h1>
          <p style={{
            margin: '2px 0 0 0',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '400'
          }}>
            Export your schedule seamlessly
          </p>
        </div>
      </div>

      {/* Status Card */}
      {!state.isOnCUNYPage ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(207, 142, 68, 0.9) 0%, rgba(184, 115, 51, 0.9) 100%)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AlertIcon />
            <span style={{ 
              marginLeft: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white'
            }}>
              Navigate to CUNY schedule page
            </span>
          </div>
          <p style={{
            margin: '8px 0 0 24px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.4'
          }}>
            Visit your CUNYFIRST schedule to export
          </p>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, rgba(106, 147, 108, 0.9) 0%, rgba(85, 123, 87, 0.9) 100%)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckIcon />
            <span style={{ 
              marginLeft: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white'
            }}>
              CUNY schedule detected
            </span>
          </div>
          <p style={{
            margin: '8px 0 0 24px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.4'
          }}>
            Ready to export your schedule
          </p>
        </div>
      )}

      {/* Settings Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <BellIcon />
          <label style={{ 
            marginLeft: '8px',
            fontSize: '14px', 
            fontWeight: '600',
            color: 'white'
          }}>
            Reminder Settings
          </label>
        </div>
        <select
          value={state.reminderMinutes}
          onChange={(e) => handleReminderChange(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#333',
            outline: 'none',
            cursor: 'pointer'
          }}
          aria-label="Select reminder time"
        >
          <option value={0}>No reminder</option>
          <option value={10}>10 minutes before</option>
          <option value={30}>30 minutes before</option>
        </select>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={state.isLoading || !state.isOnCUNYPage}
        style={{
          width: '100%',
          padding: '16px',
          background: state.isOnCUNYPage 
            ? 'linear-gradient(135deg, #8b6f8b 0%, #6b4e71 100%)' 
            : 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          border: state.isOnCUNYPage 
            ? '2px solid rgba(255, 255, 255, 0.3)' 
            : '2px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: state.isOnCUNYPage ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          opacity: state.isOnCUNYPage ? 1 : 0.5
        }}
        onMouseEnter={(e) => {
          if (state.isOnCUNYPage && !state.isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (state.isOnCUNYPage) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
        aria-label="Export schedule to calendar"
      >
        <div style={{ marginRight: '8px' }}>
          {state.isLoading ? <DownloadIcon /> : <DownloadIcon />}
        </div>
        {state.isLoading ? 'Exporting...' : 'Export Schedule'}
      </button>

      {/* Status Messages */}
      {state.error && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(184, 82, 75, 0.9) 0%, rgba(164, 62, 85, 0.9) 100%)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <AlertIcon />
          <span style={{ 
            marginLeft: '8px',
            fontSize: '13px',
            color: 'white',
            fontWeight: '500'
          }}>
            {state.error}
          </span>
        </div>
      )}

      {state.success && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(106, 147, 108, 0.9) 0%, rgba(85, 123, 87, 0.9) 100%)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <CheckIcon />
          <span style={{ 
            marginLeft: '8px',
            fontSize: '13px',
            color: 'white',
            fontWeight: '500'
          }}>
            {state.success}
          </span>
        </div>
      )}

      {/* Options Link */}
      <div style={{ 
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <button
          onClick={openOptionsPage}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            margin: '0 auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
          }}
        >
          <div style={{ marginRight: '6px' }}>
            <SettingsIcon />
          </div>
          Advanced Settings
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 