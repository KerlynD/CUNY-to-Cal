export interface CourseMeeting {
  courseId: string;   // "CSCI-316"
  title: string;      // "Programming Languages"
  instructor: string; // "Prof. Smith"
  location: string;   // "Science Bldg 201"
  startDate: string;  // "2025-08-28"
  endDate: string;    // "2025-12-12"
  days: string[];     // ["MO", "WE"]
  startTime: string;  // "09:30"
  endTime: string;    // "10:45"
}

export interface ScheduleData {
  semester: string;   // "Fall 2025"
  meetings: CourseMeeting[];
}

export interface ExtensionMessage {
  type: 'SCHEDULE_DATA' | 'EXPORT_REQUEST' | 'EXPORT_FROM_POPUP' | 'EXPORT_COMPLETE' | 'EXPORT_ERROR';
  data?: ScheduleData;
  settings?: ExportSettings;
  error?: string;
  success?: boolean;
}

export interface ExportSettings {
  reminderMinutes: number; // 0, 10, or 30
}

// Day mapping for ICS format
export const DAY_MAP: Record<string, string> = {
  'M': 'MO',
  'T': 'TU', 
  'W': 'WE',
  'TH': 'TH',
  'F': 'FR',
  'S': 'SA',
  'SU': 'SU',
  // Alternative formats
  'Mo': 'MO',
  'Tu': 'TU',
  'We': 'WE',
  'Th': 'TH',
  'Fr': 'FR',
  'Sa': 'SA',
  'Su': 'SU'
}; 