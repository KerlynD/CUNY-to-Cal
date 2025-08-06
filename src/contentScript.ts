import { CourseMeeting, ScheduleData, ExtensionMessage, DAY_MAP } from './types';

class CUNYScheduleScraper {
  private currentUrl = window.location.href;

  constructor() {
    this.init();
  }

  private init(): void {
    // Looking for CUNY schedule pages
    if (this.isCUNYSchedulePage()) {
      console.log('CUNY Schedule detected, initializing scraper...');
      this.setupMessageListener();
      this.injectExportButton();
    }
  }

  private isCUNYSchedulePage(): boolean {
    return (
      this.currentUrl.includes('home.cunyfirst.cuny.edu') && this.currentUrl.includes('CLASS_SCHEDULE')
    ) || (
      this.currentUrl.includes('schedulebuilder.cuny.edu') || this.currentUrl.includes('sb.cunyfirst.cuny.edu')
    );
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
      if (message.type === 'EXPORT_REQUEST') {
        try {
          const scheduleData = this.scrapeSchedule();
          sendResponse({ success: true, data: scheduleData });
        } catch (error) {
          console.error('Error scraping schedule:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      return true; // Keep message channel open for async response
    });
  }

  private injectExportButton(): void {
    const button = document.createElement('div');
    button.id = 'cuny-export-button';
    button.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #0066cc;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: background 0.3s ease;
      ">
        📅 Export Schedule
      </div>
    `;
    
    button.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'EXPORT_REQUEST' });
    });

    button.addEventListener('mouseenter', (e) => {
      (e.target as HTMLElement).style.background = '#0052a3';
    });

    button.addEventListener('mouseleave', (e) => {
      (e.target as HTMLElement).style.background = '#0066cc';
    });

    document.body.appendChild(button);
  }

  private scrapeSchedule(): ScheduleData {
    const meetings: CourseMeeting[] = [];
    
    if (this.currentUrl.includes('schedulebuilder.cuny.edu') || this.currentUrl.includes('sb.cunyfirst.cuny.edu')) {
      meetings.push(...this.scrapeScheduleBuilder());
    } else if (this.currentUrl.includes('home.cunyfirst.cuny.edu')) {
      meetings.push(...this.scrapeStudentCenter());
    }

    const semester = this.detectSemester();
    
    return {
      semester,
      meetings
    };
  }

  private scrapeScheduleBuilder(): CourseMeeting[] {
    const meetings: CourseMeeting[] = [];
    
    // Look for schedule builder class entries
    const classRows = document.querySelectorAll('tr[class*="class"], .class-row, tr:has(.course-title)');
    
    classRows.forEach(row => {
      try {
        const meeting = this.parseScheduleBuilderRow(row as HTMLElement);
        if (meeting) {
          meetings.push(meeting);
        }
      } catch (error) {
        console.warn('Error parsing schedule builder row:', error);
      }
    });

    // Fallback: look for any table with course information
    if (meetings.length === 0) {
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const meeting = this.parseGenericScheduleRow(row as HTMLElement);
          if (meeting) {
            meetings.push(meeting);
          }
        });
      });
    }

    return meetings;
  }

  private scrapeStudentCenter(): CourseMeeting[] {
    const meetings: CourseMeeting[] = [];
    
    // Look for class schedule table rows
    const scheduleRows = document.querySelectorAll('tr[id*="CLASS_"], .ps_box-group tr, table.PSLEVEL1GRID tr');
    
    scheduleRows.forEach(row => {
      try {
        const meeting = this.parseStudentCenterRow(row as HTMLElement);
        if (meeting) {
          meetings.push(meeting);
        }
      } catch (error) {
        console.warn('Error parsing student center row:', error);
      }
    });

    return meetings;
  }

  private parseScheduleBuilderRow(row: HTMLElement): CourseMeeting | null {
    // Extract course information from schedule builder format
    const cells = row.querySelectorAll('td, th');
    if (cells.length < 4) return null;

    const courseText = this.getTextContent(cells[0]) || this.getTextContent(cells[1]);
    const timeText = this.getTextContent(cells[2]) || this.getTextContent(cells[3]);
    const daysText = this.findInRow(row, /([MTWFS]{1,2}|Mo|Tu|We|Th|Fr)/g);
    const locationText = this.findInRow(row, /room|bldg|building/i) || 'TBA';
    const instructorText = this.findInRow(row, /prof|instructor/i) || 'TBA';

    return this.buildCourseMeeting(courseText, timeText, daysText, locationText, instructorText);
  }

  private parseStudentCenterRow(row: HTMLElement): CourseMeeting | null {
    const cells = row.querySelectorAll('td, th');
    if (cells.length < 3) return null;

    const courseText = this.getTextContent(cells[0]);
    const componentText = this.getTextContent(cells[1]);
    const daysTimeText = this.getTextContent(cells[2]);
    const roomText = this.getTextContent(cells[3]) || 'TBA';
    const instructorText = this.getTextContent(cells[4]) || 'TBA';

    if (!courseText || !daysTimeText) return null;

    return this.buildCourseMeeting(
      `${courseText} ${componentText}`.trim(),
      daysTimeText,
      daysTimeText,
      roomText,
      instructorText
    );
  }

  private parseGenericScheduleRow(row: HTMLElement): CourseMeeting | null {
    const text = row.textContent || '';
    
    const courseMatch = text.match(/([A-Z]{2,4}[-\s]?\d{2,4})/);
    if (!courseMatch) return null;

    const courseId = courseMatch[1];
    const timeMatch = text.match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i);
    const daysMatch = text.match(/([MTWFS]+|(?:Mo|Tu|We|Th|Fr|Sa|Su)\s*)+/g);

    if (!timeMatch || !daysMatch) return null;

    return {
      courseId,
      title: courseId, 
      instructor: 'TBA',
      location: 'TBA',
      startDate: this.getCurrentSemesterStart(),
      endDate: this.getCurrentSemesterEnd(),
      days: this.parseDays(daysMatch[0]),
      startTime: this.parseTime(timeMatch[1], timeMatch[3]),
      endTime: this.parseTime(timeMatch[2], timeMatch[3])
    };
  }

  private buildCourseMeeting(
    courseText: string,
    timeText: string,
    daysText: string,
    locationText: string,
    instructorText: string
  ): CourseMeeting | null {
    if (!courseText || !timeText) return null;

    const courseMatch = courseText.match(/([A-Z]{2,4}[-\s]?\d{2,4})/);
    const courseId = courseMatch ? courseMatch[1] : courseText.split(' ')[0];

    const timeMatch = timeText.match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) return null;

    const days = this.parseDays(daysText);
    if (days.length === 0) return null;

    return {
      courseId,
      title: courseText,
      instructor: instructorText,
      location: locationText,
      startDate: this.getCurrentSemesterStart(),
      endDate: this.getCurrentSemesterEnd(),
      days,
      startTime: this.parseTime(timeMatch[1], timeMatch[3]),
      endTime: this.parseTime(timeMatch[2], timeMatch[3])
    };
  }

  private getTextContent(element: Element | null): string {
    return element?.textContent?.trim() || '';
  }

  private findInRow(row: HTMLElement, pattern: RegExp): string {
    const text = row.textContent || '';
    const match = text.match(pattern);
    return match ? match[0] : '';
  }

  private parseDays(daysText: string): string[] {
    const days: string[] = [];
    const normalizedText = daysText.replace(/\s+/g, '');

    const patterns = [
      { regex: /([MTWFS])/g, map: (m: string) => DAY_MAP[m] },
      { regex: /(Mo|Tu|We|Th|Fr|Sa|Su)/g, map: (m: string) => DAY_MAP[m] }
    ];

    for (const pattern of patterns) {
      const matches = normalizedText.match(pattern.regex);
      if (matches) {
        matches.forEach(match => {
          const mapped = pattern.map(match);
          if (mapped && !days.includes(mapped)) {
            days.push(mapped);
          }
        });
        break;
      }
    }

    return days;
  }

  private parseTime(timeStr: string, period?: string): string {
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
  }

  private detectSemester(): string {
    const pageText = document.body.textContent || '';
    
    const seasonMatch = pageText.match(/(Fall|Spring|Summer|Winter)\s*(\d{4})/i);
    if (seasonMatch) {
      return `${seasonMatch[1]} ${seasonMatch[2]}`;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (month >= 8 || month <= 1) {
      return `Fall ${year}`;
    } else if (month >= 2 && month <= 5) {
      return `Spring ${year}`;
    } else {
      return `Summer ${year}`;
    }
  }

  private getCurrentSemesterStart(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (month >= 8 || month <= 1) {
      // Fall semester
      return `${year}-08-28`;
    } else if (month >= 2 && month <= 5) {
      // Spring semester
      return `${year}-01-28`;
    } else {
      // Summer semester
      return `${year}-06-01`;
    }
  }

  private getCurrentSemesterEnd(): string {
    // Default semester end dates
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (month >= 8 || month <= 1) {
      // Fall semester
      return `${year}-12-15`;
    } else if (month >= 2 && month <= 5) {
      // Spring semester
      return `${year}-05-15`;
    } else {
      // Summer semester
      return `${year}-08-15`;
    }
  }
}

new CUNYScheduleScraper(); 