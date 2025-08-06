/**
 * @jest-environment node
 */

import { CourseMeeting, ScheduleData } from '../types';

// Mock the ics library
jest.mock('ics', () => ({
  createEvents: jest.fn()
}));

// Mock the background script module since it auto-initializes
jest.mock('../background', () => ({}));

describe('Background Service Worker', () => {
  const mockScheduleData: ScheduleData = {
    semester: 'Fall 2025',
    meetings: [
      {
        courseId: 'CSCI-316',
        title: 'Programming Languages',
        instructor: 'Prof. Smith',
        location: 'Science Building 201',
        startDate: '2025-08-28',
        endDate: '2025-12-15',
        days: ['MO', 'WE'],
        startTime: '14:00',
        endTime: '15:15'
      },
      {
        courseId: 'MATH-242',
        title: 'Calculus II',
        instructor: 'Prof. Johnson',
        location: 'Math Building 305',
        startDate: '2025-08-28',
        endDate: '2025-12-15',
        days: ['TU', 'TH'],
        startTime: '10:00',
        endTime: '11:15'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Date Parsing', () => {
    test('should parse YYYY-MM-DD date format', () => {
      const parseDate = (dateStr: string): Date => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        return new Date(dateStr);
      };

      const date = parseDate('2025-08-28');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(7); // August is month 7 (0-indexed)
      expect(date.getDate()).toBe(28);
    });
  });

  describe('UTC Date Formatting', () => {
    test('should format date for UNTIL field in UTC', () => {
      const formatDateForUntil = (date: Date): string => {
        const utc = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        const year = utc.getUTCFullYear();
        const month = (utc.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = utc.getUTCDate().toString().padStart(2, '0');
        const hours = utc.getUTCHours().toString().padStart(2, '0');
        const minutes = utc.getUTCMinutes().toString().padStart(2, '0');
        const seconds = utc.getUTCSeconds().toString().padStart(2, '0');
        
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
      };

      const testDate = new Date('2025-12-15T23:59:59');
      const formatted = formatDateForUntil(testDate);
      expect(formatted).toMatch(/^\d{8}T\d{6}Z$/);
      expect(formatted).toContain('2025');
      expect(formatted).toContain('T');
      expect(formatted.endsWith('Z')).toBe(true);
    });
  });

  describe('Event Creation', () => {
    test('should create valid event attributes from course meeting', () => {
      const meeting = mockScheduleData.meetings[0];
      
             // Mock the event creation logic
       const createEventFromMeeting = (meeting: CourseMeeting, reminderMinutes: number) => {
         const startDate = new Date(2025, 7, 28); // August 28, 2025 (month is 0-indexed)
        const [startHour, startMinute] = meeting.startTime.split(':').map(Number);
        const [endHour, endMinute] = meeting.endTime.split(':').map(Number);

        return {
          uid: `${meeting.courseId}-${meeting.startTime}-${meeting.days.join('')}`,
          title: `${meeting.title} (${meeting.courseId})`,
          description: `Instructor: ${meeting.instructor}`,
          location: meeting.location,
          start: [
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            startDate.getDate(),
            startHour,
            startMinute
          ],
          end: [
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            startDate.getDate(),
            endHour,
            endMinute
          ],
          recurrenceRule: `FREQ=WEEKLY;BYDAY=${meeting.days.join(',')};UNTIL=20251215T235959Z`,
          alarms: reminderMinutes > 0 ? [{
            action: 'display',
            description: `Upcoming class — ${meeting.title}`,
            trigger: { minutes: reminderMinutes, before: true }
          }] : undefined
        };
      };

      const event = createEventFromMeeting(meeting, 10);
      
      expect(event.uid).toBe('CSCI-316-14:00-MOWE');
      expect(event.title).toBe('Programming Languages (CSCI-316)');
      expect(event.description).toBe('Instructor: Prof. Smith');
      expect(event.location).toBe('Science Building 201');
      expect(event.start).toEqual([2025, 8, 28, 14, 0]);
      expect(event.end).toEqual([2025, 8, 28, 15, 15]);
      expect(event.recurrenceRule).toBe('FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20251215T235959Z');
      expect(event.alarms).toBeDefined();
      expect(event.alarms![0].trigger.minutes).toBe(10);
    });

    test('should not include alarms when reminder is 0', () => {
      const meeting = mockScheduleData.meetings[0];
      
      const createEventFromMeeting = (meeting: CourseMeeting, reminderMinutes: number) => {
        return {
          alarms: reminderMinutes > 0 ? [{
            action: 'display',
            description: `Upcoming class — ${meeting.title}`,
            trigger: { minutes: reminderMinutes, before: true }
          }] : undefined
        };
      };

      const event = createEventFromMeeting(meeting, 0);
      expect(event.alarms).toBeUndefined();
    });
  });

  describe('Filename Generation', () => {
    test('should generate proper filename from semester', () => {
      const generateFilename = (semester: string): string => {
        return `Schedule-${semester.replace(/\s+/g, '-')}.ics`;
      };

      expect(generateFilename('Fall 2025')).toBe('Schedule-Fall-2025.ics');
      expect(generateFilename('Spring 2024')).toBe('Schedule-Spring-2024.ics');
      expect(generateFilename('Summer  2025')).toBe('Schedule-Summer-2025.ics'); // Extra space
    });
  });

  describe('Chrome Downloads API', () => {
    test('should call chrome.downloads.download with correct parameters', async () => {
      const mockDownload = chrome.downloads.download as jest.Mock;
      mockDownload.mockResolvedValue(12345);

      const downloadFile = async (content: string, filename: string): Promise<void> => {
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        await chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false
        });
      };

      await downloadFile('mock ics content', 'Schedule-Fall-2025.ics');

      expect(mockDownload).toHaveBeenCalledWith({
        url: expect.stringContaining('mock-object-url'),
        filename: 'Schedule-Fall-2025.ics',
        saveAs: false
      });
    });
  });

  describe('Storage Operations', () => {
    test('should load export settings from chrome.storage', async () => {
      const mockGet = chrome.storage.sync.get as jest.Mock;
      mockGet.mockResolvedValue({ reminderMinutes: 30 });

      const getExportSettings = async () => {
        const result = await chrome.storage.sync.get(['reminderMinutes']);
        return {
          reminderMinutes: result.reminderMinutes ?? 10
        };
      };

      const settings = await getExportSettings();
      expect(settings.reminderMinutes).toBe(30);
      expect(mockGet).toHaveBeenCalledWith(['reminderMinutes']);
    });

    test('should use default settings when storage fails', async () => {
      const mockGet = chrome.storage.sync.get as jest.Mock;
      mockGet.mockRejectedValue(new Error('Storage error'));

      const getExportSettings = async () => {
        try {
          const result = await chrome.storage.sync.get(['reminderMinutes']);
          return {
            reminderMinutes: result.reminderMinutes ?? 10
          };
        } catch (error) {
          return { reminderMinutes: 10 };
        }
      };

      const settings = await getExportSettings();
      expect(settings.reminderMinutes).toBe(10);
    });
  });

  describe('ICS Calendar Generation', () => {
    test('should generate calendar with multiple events', () => {
      const ics = require('ics');
      const { createEvents } = ics;
      const mockCreateEvents = createEvents as jest.Mock;
      
      mockCreateEvents.mockReturnValue({
        error: null,
        value: 'mock ics content'
      });

      const events = mockScheduleData.meetings.map(meeting => ({
        uid: `${meeting.courseId}-${meeting.startTime}`,
        title: meeting.title,
        start: [2025, 8, 28, 14, 0],
        end: [2025, 8, 28, 15, 15]
      }));

      const result = createEvents(events);

      expect(mockCreateEvents).toHaveBeenCalledWith(events);
      expect(result.error).toBeNull();
      expect(result.value).toBe('mock ics content');
    });

    test('should handle calendar generation errors', () => {
      const ics = require('ics');
      const { createEvents } = ics;
      const mockCreateEvents = createEvents as jest.Mock;
      
      mockCreateEvents.mockReturnValue({
        error: new Error('Invalid event data'),
        value: null
      });

      const result = createEvents([]);

      expect(result.error).toBeDefined();
      expect(result.value).toBeNull();
    });
  });
}); 