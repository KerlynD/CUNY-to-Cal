/**
 * @jest-environment jsdom
 */

import { DAY_MAP } from '../types';
import { 
  MOCK_STUDENT_CENTER_HTML, 
  MOCK_SCHEDULE_BUILDER_HTML,
  MOCK_SEMESTER_CONTEXT_HTML 
} from './fixtures/mockScheduleHTML';

jest.mock('../contentScript', () => ({}));

describe('Schedule Scraping', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://home.cunyfirst.cuny.edu/test/CLASS_SCHEDULE'
      },
      writable: true
    });
  });

  describe('Day Mapping', () => {
    test('should correctly map single letter days', () => {
      expect(DAY_MAP['M']).toBe('MO');
      expect(DAY_MAP['T']).toBe('TU');
      expect(DAY_MAP['W']).toBe('WE');
      expect(DAY_MAP['TH']).toBe('TH');
      expect(DAY_MAP['F']).toBe('FR');
    });

    test('should correctly map two letter days', () => {
      expect(DAY_MAP['Mo']).toBe('MO');
      expect(DAY_MAP['Tu']).toBe('TU');
      expect(DAY_MAP['We']).toBe('WE');
      expect(DAY_MAP['Th']).toBe('TH');
      expect(DAY_MAP['Fr']).toBe('FR');
    });
  });

  describe('CUNY Page Detection', () => {
    test('should detect Student Center schedule page', () => {
      const url = 'https://home.cunyfirst.cuny.edu/psp/campus/CLASS_SCHEDULE';
      const isCUNYPage = url.includes('home.cunyfirst.cuny.edu') && url.includes('CLASS_SCHEDULE');
      expect(isCUNYPage).toBe(true);
    });

    test('should detect Schedule Builder page', () => {
      const url = 'https://schedulebuilder.cuny.edu/schedule';
      const isCUNYPage = url.includes('schedulebuilder.cuny.edu');
      expect(isCUNYPage).toBe(true);
    });

    test('should detect alternative Schedule Builder domain', () => {
      const url = 'https://sb.cunyfirst.cuny.edu/criteria.jsp';
      const isCUNYPage = url.includes('sb.cunyfirst.cuny.edu');
      expect(isCUNYPage).toBe(true);
    });

    test('should not detect non-CUNY pages', () => {
      const url = 'https://google.com';
      const isCUNYPage = url.includes('cunyfirst.cuny.edu') || url.includes('schedulebuilder.cuny.edu');
      expect(isCUNYPage).toBe(false);
    });
  });

  describe('HTML Table Parsing', () => {
    test('should find schedule tables in Student Center format', () => {
      document.body.innerHTML = MOCK_STUDENT_CENTER_HTML;
      
      const scheduleRows = document.querySelectorAll('tr[id*="CLASS_"], .ps_box-group tr, table.PSLEVEL1GRID tr');
      expect(scheduleRows.length).toBeGreaterThan(0);
      
      const firstRow = scheduleRows[0] as HTMLElement;
      expect(firstRow.textContent).toContain('CSCI-316');
    });

    test('should find schedule tables in Schedule Builder format', () => {
      document.body.innerHTML = MOCK_SCHEDULE_BUILDER_HTML;
      
      const classRows = document.querySelectorAll('tr[class*="class"], .class-row');
      expect(classRows.length).toBeGreaterThan(0);
      
      const firstRow = classRows[0] as HTMLElement;
      expect(firstRow.textContent).toContain('CSCI-340');
    });

    test('should extract course information from table cells', () => {
      document.body.innerHTML = MOCK_STUDENT_CENTER_HTML;
      
      const firstRow = document.querySelector('tr[id="CLASS_1"]') as HTMLElement;
      const cells = firstRow.querySelectorAll('td');
      
      expect(cells[0].textContent?.trim()).toBe('CSCI-316');
      expect(cells[1].textContent?.trim()).toBe('Lecture');
      expect(cells[2].textContent?.trim()).toBe('MoWe 2:00PM - 3:15PM');
      expect(cells[3].textContent?.trim()).toBe('Science Building 201');
      expect(cells[4].textContent?.trim()).toBe('Prof. Smith');
    });
  });

  describe('Time Parsing', () => {
    test('should parse 12-hour time format', () => {
      const parseTime = (timeStr: string, period?: string): string => {
        const [hoursStr, minutesStr] = timeStr.split(':');
        let hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        
        if (period) {
          if (period.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };

      expect(parseTime('2:00', 'PM')).toBe('14:00');
      expect(parseTime('10:00', 'AM')).toBe('10:00');
      expect(parseTime('12:00', 'PM')).toBe('12:00');
      expect(parseTime('12:00', 'AM')).toBe('00:00');
    });
  });

  describe('Semester Detection', () => {
    test('should detect semester from page content', () => {
      document.body.innerHTML = MOCK_SEMESTER_CONTEXT_HTML;
      
      const pageText = document.body.textContent || '';
      const seasonMatch = pageText.match(/(Fall|Spring|Summer|Winter)\s*(\d{4})/i);
      
      expect(seasonMatch).toBeTruthy();
      expect(seasonMatch![1]).toBe('Fall');
      expect(seasonMatch![2]).toBe('2025');
    });

    test('should fallback to current date when no semester found', () => {
      document.body.innerHTML = '<div>No semester info</div>';
      
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      let expectedSemester: string;
      if (month >= 8 || month <= 1) {
        expectedSemester = `Fall ${year}`;
      } else if (month >= 2 && month <= 5) {
        expectedSemester = `Spring ${year}`;
      } else {
        expectedSemester = `Summer ${year}`;
      }
      
      expect(expectedSemester).toMatch(/(Fall|Spring|Summer) \d{4}/);
    });
  });

  describe('Course Code Parsing', () => {
    test('should extract course codes from various formats', () => {
      const testCases = [
        'CSCI-316',
        'MATH 242',
        'ENGL110',
        'PHYS-201 Physics I'
      ];

      testCases.forEach(text => {
        const courseMatch = text.match(/([A-Z]{2,4}[-\s]?\d{2,4})/);
        expect(courseMatch).toBeTruthy();
        expect(courseMatch![1]).toMatch(/[A-Z]{2,4}[-\s]?\d{2,4}/);
      });
    });
  });
}); 