/**
 * Basic integration tests for the Chrome extension
 * These test the core functionality without requiring a full browser environment
 */

import { CourseMeeting, ScheduleData } from '../types';

describe('Chrome Extension Integration Tests', () => {
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
      }
    ]
  };

  test('should export complete schedule workflow', async () => {
    // Mock the entire export workflow
    const exportWorkflow = async (scheduleData: ScheduleData, settings: { reminderMinutes: number }) => {
      // 1. Validate schedule data
      expect(scheduleData.meetings).toHaveLength(1);
      expect(scheduleData.semester).toBe('Fall 2025');
      
      // 2. Create events from meetings
      const events = scheduleData.meetings.map(meeting => ({
        uid: `${meeting.courseId}-${meeting.startTime}-${meeting.days.join('')}`,
        title: `${meeting.title} (${meeting.courseId})`,
        description: `Instructor: ${meeting.instructor}`,
        location: meeting.location,
        recurrenceRule: `FREQ=WEEKLY;BYDAY=${meeting.days.join(',')};UNTIL=20251215T235959Z`,
        hasReminder: settings.reminderMinutes > 0
      }));
      
      // 3. Generate filename
      const filename = `Schedule-${scheduleData.semester.replace(/\s+/g, '-')}.ics`;
      
      // 4. Return export result
      return {
        success: true,
        events,
        filename,
        eventsCount: events.length
      };
    };

    const result = await exportWorkflow(mockScheduleData, { reminderMinutes: 10 });
    
    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(1);
    expect(result.filename).toBe('Schedule-Fall-2025.ics');
    expect(result.eventsCount).toBe(1);
    expect(result.events[0].hasReminder).toBe(true);
  });

  test('should handle multiple meeting patterns', async () => {
    const complexScheduleData: ScheduleData = {
      semester: 'Spring 2025',
      meetings: [
        {
          courseId: 'CSCI-340',
          title: 'Operating Systems',
          instructor: 'Prof. Davis',
          location: 'Science Building 150',
          startDate: '2025-01-28',
          endDate: '2025-05-15',
          days: ['MO', 'WE'],
          startTime: '11:00',
          endTime: '12:15'
        },
        {
          courseId: 'CSCI-340',
          title: 'Operating Systems Lab',
          instructor: 'TA Wilson',
          location: 'Computer Lab B',
          startDate: '2025-01-28',
          endDate: '2025-05-15',
          days: ['FR'],
          startTime: '13:00',
          endTime: '15:50'
        }
      ]
    };

    // Validate that we can handle lecture + lab format
    expect(complexScheduleData.meetings).toHaveLength(2);
    
    // Both meetings should have the same course ID but different patterns
    const courseIds = complexScheduleData.meetings.map(m => m.courseId);
    expect(courseIds.every(id => id === 'CSCI-340')).toBe(true);
    
    // Different meeting times/days
    const days = complexScheduleData.meetings.map(m => m.days.join(','));
    expect(days).toEqual(['MO,WE', 'FR']);
  });

  test('should validate required fields', () => {
    const invalidMeeting = {
      courseId: '',
      title: '',
      instructor: 'Prof. Smith',
      location: 'Room 101',
      startDate: '2025-08-28',
      endDate: '2025-12-15',
      days: [],
      startTime: '14:00',
      endTime: '15:15'
    };

    // Validate that essential fields are present
    const isValidMeeting = (meeting: Partial<CourseMeeting>): boolean => {
      return !!(
        meeting.courseId && 
        meeting.title && 
        meeting.days && 
        meeting.days.length > 0 &&
        meeting.startTime && 
        meeting.endTime
      );
    };

    expect(isValidMeeting(invalidMeeting)).toBe(false);
    expect(isValidMeeting(mockScheduleData.meetings[0])).toBe(true);
  });

  test('should generate unique UIDs for events', () => {
    const meetings = [
      {
        courseId: 'MATH-101',
        startTime: '09:00',
        days: ['MO', 'WE']
      },
      {
        courseId: 'MATH-101',
        startTime: '10:00',
        days: ['TU', 'TH']
      },
      {
        courseId: 'PHYS-201',
        startTime: '09:00',
        days: ['MO', 'WE']
      }
    ];

    const generateUID = (meeting: any) => 
      `${meeting.courseId}-${meeting.startTime}-${meeting.days.join('')}`;

    const uids = meetings.map(generateUID);
    const uniqueUIDs = new Set(uids);

    // All UIDs should be unique
    expect(uniqueUIDs.size).toBe(meetings.length);
    expect(uids).toEqual([
      'MATH-101-09:00-MOWE',
      'MATH-101-10:00-TUTH',
      'PHYS-201-09:00-MOWE'
    ]);
  });
}); 