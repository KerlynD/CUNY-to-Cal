import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface PopupState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  reminderMinutes: number;
  isOnCUNYPage: boolean;
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    isLoading: false,
    error: null,
    success: null,
    reminderMinutes: 10,
    isOnCUNYPage: false
  });

  useEffect(() => {
    // Load saved settings
    loadSettings();
    // Check if current tab is a CUNY page
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
      // Save current reminder setting
      await chrome.storage.sync.set({ reminderMinutes: state.reminderMinutes });

      // Send export request to background script
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
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '16px',
        borderBottom: '1px solid #e5e5e5',
        paddingBottom: '12px'
      }}>
        <span style={{ fontSize: '24px', marginRight: '8px' }}>📅</span>
        <h1 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#333'
        }}>
          CUNY to Calendar
        </h1>
      </div>

      {/* Page Detection */}
      {!state.isOnCUNYPage && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#856404'
        }}>
          ⚠️ Navigate to your CUNY schedule page to export
        </div>
      )}

      {/* Reminder Settings */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500',
          marginBottom: '8px',
          color: '#555'
        }}>
          Reminder:
        </label>
        <select
          value={state.reminderMinutes}
          onChange={(e) => handleReminderChange(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: '#fff'
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
          padding: '12px',
          backgroundColor: state.isOnCUNYPage ? '#0066cc' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: state.isOnCUNYPage ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (state.isOnCUNYPage && !state.isLoading) {
            e.currentTarget.style.backgroundColor = '#0052a3';
          }
        }}
        onMouseLeave={(e) => {
          if (state.isOnCUNYPage) {
            e.currentTarget.style.backgroundColor = '#0066cc';
          }
        }}
        aria-label="Export schedule to calendar"
      >
        {state.isLoading ? '⏳ Exporting...' : '📥 Export Schedule'}
      </button>

      {/* Status Messages */}
      {state.error && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#721c24'
        }}>
          ❌ {state.error}
        </div>
      )}

      {state.success && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#155724'
        }}>
          ✅ {state.success}
        </div>
      )}

      {/* Options Link */}
      <div style={{ 
        marginTop: '16px', 
        textAlign: 'center',
        borderTop: '1px solid #e5e5e5',
        paddingTop: '12px'
      }}>
        <button
          onClick={openOptionsPage}
          style={{
            background: 'none',
            border: 'none',
            color: '#0066cc',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Advanced Settings
        </button>
      </div>
    </div>
  );
};

// Mount the popup
const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 