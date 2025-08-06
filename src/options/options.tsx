import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="m12 16 0-4"/>
    <path d="m12 8 .01 0"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17,21 17,13 7,13 7,21"/>
    <polyline points="7,3 7,8 15,8"/>
  </svg>
);

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
    <div style={{ 
      padding: '40px 20px',
      minHeight: '100vh',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '12px 20px',
          marginBottom: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <CalendarIcon />
          <span style={{ 
            marginLeft: '12px',
            fontSize: '24px', 
            fontWeight: '700',
            color: 'white',
            letterSpacing: '-0.5px'
          }}>
            CUNY to Calendar
          </span>
        </div>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.8)',
          margin: 0,
          fontWeight: '400'
        }}>
          Configure your schedule export preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div style={{
        display: 'grid',
        gap: '24px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'
      }}>
        
        {/* Reminder Settings Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '28px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '8px',
              marginRight: '12px'
            }}>
              <BellIcon />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                margin: 0,
                color: 'white',
                letterSpacing: '-0.3px'
              }}>
                Default Reminder
              </h2>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: '4px 0 0 0'
              }}>
                Set your preferred reminder time
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { value: 0, label: 'No reminder', desc: 'Just the event' },
              { value: 10, label: '10 minutes before', desc: 'Quick heads up' },
              { value: 30, label: '30 minutes before', desc: 'Time to prepare' }
            ].map(option => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  background: state.reminderMinutes === option.value 
                    ? 'rgba(255, 255, 255, 0.25)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid',
                  borderColor: state.reminderMinutes === option.value 
                    ? 'rgba(255, 255, 255, 0.4)' 
                    : 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  if (state.reminderMinutes !== option.value) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (state.reminderMinutes !== option.value) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                <input
                  type="radio"
                  name="reminderMinutes"
                  value={option.value}
                  checked={state.reminderMinutes === option.value}
                  onChange={() => handleReminderChange(option.value)}
                  style={{ 
                    marginRight: '16px',
                    accentColor: 'white',
                    transform: 'scale(1.2)'
                  }}
                />
                <div>
                  <div style={{ 
                    fontSize: '15px', 
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '2px'
                  }}>
                    {option.label}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    {option.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* How It Works Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '28px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '8px',
              marginRight: '12px'
            }}>
              <InfoIcon />
            </div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              margin: 0,
              color: 'white',
              letterSpacing: '-0.3px'
            }}>
              How It Works
            </h2>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            {[
              'Navigate to your CUNY schedule page',
              'Click the extension or Export button',
              'Download your .ics calendar file',
              'Import into any calendar app'
            ].map((step, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                padding: '8px 0'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'white'
                }}>
                  {index + 1}
                </div>
                <span style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.4'
                }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Privacy Notice */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(106, 147, 108, 0.3) 0%, rgba(85, 123, 87, 0.3) 100%)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{ marginRight: '8px' }}>🔒</div>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'white'
              }}>
                Privacy First
              </span>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '13px', 
              lineHeight: '1.4',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Your schedule data never leaves your browser. No tracking, no data collection.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button
          onClick={saveSettings}
          disabled={state.isSaving}
          style={{
            background: 'linear-gradient(135deg, #8b6f8b 0%, #6b4e71 100%)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            padding: '16px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: state.isSaving ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            display: 'inline-flex',
            alignItems: 'center',
            opacity: state.isSaving ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!state.isSaving) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!state.isSaving) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <div style={{ marginRight: '8px' }}>
            <SaveIcon />
          </div>
          {state.isSaving ? 'Saving Settings...' : 'Save Settings'}
        </button>
      </div>

      {/* Save Message */}
      {state.saveMessage && (
        <div style={{
          textAlign: 'center',
          marginTop: '16px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: state.saveMessage.includes('successfully') 
              ? 'linear-gradient(135deg, rgba(106, 147, 108, 0.9) 0%, rgba(85, 123, 87, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(184, 82, 75, 0.9) 0%, rgba(164, 62, 85, 0.9) 100%)',
            borderRadius: '12px',
            padding: '12px 20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <CheckIcon />
            <span style={{ 
              marginLeft: '8px',
              fontSize: '14px',
              color: 'white',
              fontWeight: '500'
            }}>
              {state.saveMessage}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '48px',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <p style={{ 
          margin: 0,
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          CUNY to Calendar Extension v1.0.0 |{' '}
          <a 
            href="https://github.com/KerlynD/CUNY-to-Cal" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
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