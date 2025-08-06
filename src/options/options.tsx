import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface OptionsState {
  reminderMinutes: number;
  isSaving: boolean;
  saveMessage: string | null;
}

const Options: React.FC = () => {
  const [state, setState] = useState<OptionsState>({
    reminderMinutes: 10,
    isSaving: false,
    saveMessage: null
  });

  useEffect(() => {
    loadSettings();
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

  const saveSettings = async () => {
    setState(prev => ({ ...prev, isSaving: true, saveMessage: null }));

    try {
      await chrome.storage.sync.set({
        reminderMinutes: state.reminderMinutes
      });

      setState(prev => ({
        ...prev,
        isSaving: false,
        saveMessage: 'Settings saved successfully!'
      }));

      setTimeout(() => {
        setState(prev => ({ ...prev, saveMessage: null }));
      }, 3000);

    } catch (error) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        saveMessage: 'Failed to save settings. Please try again.'
      }));
    }
  };

  const handleReminderChange = (minutes: number) => {
    setState(prev => ({ ...prev, reminderMinutes: minutes }));
  };

  return (
    <div className="container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
        color: 'white',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '32px', marginRight: '12px' }}>📅</span>
          <h1 style={{ margin: 0, fontSize: '24px' }}>CUNY to Calendar</h1>
        </div>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
          Configure your schedule export preferences
        </p>
      </div>

      {/* Settings Content */}
      <div style={{ padding: '32px' }}>
        
        {/* Default Reminder Setting */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#333'
          }}>
            Default Reminder
          </h2>
          <p style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            Choose how early you want to be reminded about upcoming classes.
            This setting will be used as the default for all exports.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { value: 0, label: 'No reminder' },
              { value: 10, label: '10 minutes before class' },
              { value: 30, label: '30 minutes before class' }
            ].map(option => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: '2px solid',
                  borderColor: state.reminderMinutes === option.value ? '#0066cc' : '#e5e5e5',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                  backgroundColor: state.reminderMinutes === option.value ? '#f0f8ff' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="reminderMinutes"
                  value={option.value}
                  checked={state.reminderMinutes === option.value}
                  onChange={() => handleReminderChange(option.value)}
                  style={{ marginRight: '12px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#333'
          }}>
            How It Works
          </h2>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #e9ecef',
            borderRadius: '6px',
            padding: '16px'
          }}>
            <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>
                Navigate to your CUNY schedule page (Student Center or Schedule Builder)
              </li>
              <li style={{ marginBottom: '8px' }}>
                Click the extension icon or use the &quot;Export Schedule&quot; button
              </li>
              <li style={{ marginBottom: '8px' }}>
                Your schedule will be converted to a standard .ics calendar file
              </li>
              <li>
                Import the downloaded file into Google Calendar, Outlook, or Apple Calendar
              </li>
            </ol>
          </div>
        </div>

        {/* Privacy Notice */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#333'
          }}>
            Privacy & Security
          </h2>
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            border: '1px solid #c3e6c3',
            borderRadius: '6px',
            padding: '16px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
              🔒 Your schedule data never leaves your browser. This extension works entirely offline
              and does not collect, store, or transmit any personal information to external servers.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button
            onClick={saveSettings}
            disabled={state.isSaving}
            style={{
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: state.isSaving ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              opacity: state.isSaving ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!state.isSaving) {
                e.currentTarget.style.backgroundColor = '#0052a3';
              }
            }}
            onMouseLeave={(e) => {
              if (!state.isSaving) {
                e.currentTarget.style.backgroundColor = '#0066cc';
              }
            }}
          >
            {state.isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Save Message */}
        {state.saveMessage && (
          <div style={{
            textAlign: 'center',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: state.saveMessage.includes('successfully') ? '#d4edda' : '#f8d7da',
            border: `1px solid ${state.saveMessage.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`,
            color: state.saveMessage.includes('successfully') ? '#155724' : '#721c24'
          }}>
            {state.saveMessage}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #e5e5e5',
        padding: '16px 32px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#666'
      }}>
        <p style={{ margin: 0 }}>
          CUNY to Calendar Extension v1.0.0 |{' '}
          <a 
            href="https://github.com/your-repo/cuny-to-cal" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#0066cc' }}
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
};

const container = document.getElementById('options-root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
} 