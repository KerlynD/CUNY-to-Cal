import { CourseMeeting, ScheduleData, ExtensionMessage } from './types';

class CUNYScheduleScraper {
  private currentUrl = window.location.href;

  constructor() {
    this.init();
  }

  private init(): void {
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
      return true; 
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
    
    button.addEventListener('click', async () => {
      try {
        button.textContent = '⏳ Exporting...';
        button.style.pointerEvents = 'none';
        
        console.log('Starting schedule scrape...');
        const scheduleData = this.scrapeSchedule();
        console.log('Schedule data scraped:', scheduleData);
        
        if (!scheduleData.meetings || scheduleData.meetings.length === 0) {
          throw new Error('No schedule data found on this page. Make sure you are on a CUNY schedule page with visible courses.');
        }
        
        console.log('Getting export settings...');
        const settings = await this.getExportSettings();
        console.log('Settings:', settings);
        
        console.log('Sending message to background script...');
        const response = await chrome.runtime.sendMessage({ 
          type: 'EXPORT_FROM_POPUP', 
          data: scheduleData,
          settings: settings 
        });
        console.log('Background script response:', response);
        
        button.textContent = '✅ Exported!';
        setTimeout(() => {
          button.innerHTML = '📅 Export Schedule';
          button.style.pointerEvents = 'auto';
        }, 2000);
      } catch (error) {
        console.error('Export failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error details:', errorMessage);
        button.textContent = '❌ Failed';
        setTimeout(() => {
          button.innerHTML = '📅 Export Schedule';
          button.style.pointerEvents = 'auto';
        }, 2000);
      }
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
    console.log('Scraping Schedule Builder page...');
    
    try {
      const legendMeetings = this.parseFromLegendBox();
      if (legendMeetings.length > 0) {
        console.log('Found courses in legend box:', legendMeetings.length);
        meetings.push(...legendMeetings);
      }
    } catch (error) {
      console.warn('Error parsing courses from legend box:', error);
    }

    if (meetings.length === 0) {
      try {
        const urlMeetings = this.parseCoursesFromURL();
        if (urlMeetings.length > 0) {
          console.log('Found courses in URL:', urlMeetings.length);
          meetings.push(...urlMeetings);
        }
      } catch (error) {
        console.warn('Error parsing courses from URL:', error);
      }
    }

    if (meetings.length === 0) {
      console.log('Looking for course blocks in DOM...');
      const courseBlocks = document.querySelectorAll('[class*="course"], [class*="class"], div:has(> div:contains("CSCI")), div:has(> div:contains("MATH")), div:has(> div:contains("ENGL"))');
      console.log('Found course blocks:', courseBlocks.length);
      
      courseBlocks.forEach(block => {
        try {
          const meeting = this.parseScheduleBuilderBlock(block as HTMLElement);
          if (meeting) {
            meetings.push(meeting);
          }
        } catch (error) {
          console.warn('Error parsing schedule builder block:', error);
        }
      });
    }

    if (meetings.length === 0) {
      console.log('Looking for course text in DOM...');
      const courseTexts = document.querySelectorAll('div, span, p, td, th');
      let foundTexts = 0;
      courseTexts.forEach(element => {
        const text = element.textContent || '';
        if (/^[A-Z]{2,4}\s+\d{3}/.test(text.trim())) { 
          foundTexts++;
          try {
            const meeting = this.parseScheduleBuilderText(element as HTMLElement);
            if (meeting) {
              meetings.push(meeting);
            }
          } catch (error) {
            console.warn('Error parsing schedule builder text:', error);
          }
        }
      });
      console.log('Found course text elements:', foundTexts);
    }

    console.log('Total meetings found:', meetings.length);
    return meetings;
  }

  private parseFromLegendBox(): CourseMeeting[] {
    const meetings: CourseMeeting[] = [];
    
    const legendBox = document.querySelector('#legend_box, .legend_box');
    if (!legendBox) return meetings;
    
    const courseBoxes = legendBox.querySelectorAll('.course_box');
    console.log('Found course boxes in legend:', courseBoxes.length);
    
    courseBoxes.forEach(courseBox => {
      try {
        const meeting = this.parseCourseBox(courseBox as HTMLElement);
        if (meeting) {
          meetings.push(meeting);
        }
      } catch (error) {
        console.warn('Error parsing course box:', error);
      }
    });
    
    return meetings;
  }

  private parseCourseBox(courseBox: HTMLElement): CourseMeeting | null {
    const titleElement = courseBox.querySelector('.course_title');
    if (!titleElement) return null;
    
    const courseCode = titleElement.textContent?.trim();
    if (!courseCode) return null;
    
    const titleSpan = courseBox.querySelector('.header_cell span:not(.term_label):not(.session_label):not(.mobileNUmber)');
    const fullTitle = titleSpan ? `${courseCode} - ${titleSpan.textContent?.trim()}` : courseCode;
    
    const hoursElement = courseBox.querySelector('#hoursInLegend');
    if (!hoursElement) return null;
    
    const scheduleText = hoursElement.textContent || '';
    const scheduleMatch = scheduleText.match(/(.*?)\s*:\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*to\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (!scheduleMatch) return null;
    
    const daysStr = scheduleMatch[1].trim();
    const startTime = this.parseTime(scheduleMatch[2].replace(/\s/g, ''));
    const endTime = this.parseTime(scheduleMatch[3].replace(/\s/g, ''));
    const days = this.parseDays(daysStr);
    
    if (days.length === 0) return null;
    
    const instructorElement = courseBox.querySelector('.rightnclear[title="Instructor(s)"]');
    const instructor = instructorElement ? instructorElement.textContent?.trim() || 'TBA' : 'TBA';
    
    const locationElement = courseBox.querySelector('.location_block');
    const location = locationElement ? locationElement.textContent?.trim() || 'TBA' : 'TBA';
    

    
    return {
      courseId: courseCode.replace(/\s+/g, '-'),
      title: fullTitle,
      instructor,
      location,
      startDate: this.getCurrentSemesterStart(),
      endDate: this.getCurrentSemesterEnd(),
      days,
      startTime,
      endTime
    };
  }

  private parseCoursesFromURL(): CourseMeeting[] {
    const meetings: CourseMeeting[] = [];
    const url = new URL(window.location.href);
    const params = url.searchParams;
    
    let courseIndex = 0;
    let courseParam = params.get(`course_${courseIndex}_0`);
    while (courseParam) {
      
      const courseMatch = courseParam.match(/([A-Z]{2,4})-(\d{3})/);
      if (courseMatch) {
        const courseId = courseParam;
        const title = `${courseMatch[1]} ${courseMatch[2]}`;
        
        const meeting: CourseMeeting = {
          courseId,
          title,
          instructor: 'TBA',
          location: 'TBA',
          startDate: this.getCurrentSemesterStart(),
          endDate: this.getCurrentSemesterEnd(),
          days: ['MO', 'WE'], 
          startTime: '09:00',
          endTime: '10:15'
        };
        
        meetings.push(meeting);
      }
      
      courseIndex++;
      courseParam = params.get(`course_${courseIndex}_0`);
    }
    
    return meetings;
  }

  private scrapeStudentCenter(): CourseMeeting[] {
    const meetings: CourseMeeting[] = [];
    
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

  private parseScheduleBuilderBlock(block: HTMLElement): CourseMeeting | null {
    const text = block.textContent || '';
    
    const courseMatch = text.match(/([A-Z]{2,4})\s+(\d{3})/);
    if (!courseMatch) return null;
    
    const courseId = `${courseMatch[1]}-${courseMatch[2]}`;
    
    const titleMatch = text.match(/[A-Z]{2,4}\s+\d{3}\s+([^•\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : courseId;
    
    const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*to\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (!timeMatch) return null;
    
    const startTime = this.parseTime(timeMatch[1].replace(/\s/g, ''));
    const endTime = this.parseTime(timeMatch[2].replace(/\s/g, ''));
    
    const daysMatch = text.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:,\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun))?/i);
    const days = this.parseDays(daysMatch ? daysMatch[0] : '');
    
    if (days.length === 0) return null;
    
    return {
      courseId,
      title,
      instructor: 'TBA',
      location: 'TBA',
      startDate: this.getCurrentSemesterStart(),
      endDate: this.getCurrentSemesterEnd(),
      days,
      startTime,
      endTime
    };
  }

  private parseScheduleBuilderText(element: HTMLElement): CourseMeeting | null {
    const text = element.textContent || '';
    
    const courseMatch = text.match(/([A-Z]{2,4})\s+(\d{3})/);
    if (!courseMatch) return null;
    
    const courseId = `${courseMatch[1]}-${courseMatch[2]}`;
    
    const titleMatch = text.match(/[A-Z]{2,4}\s+\d{3}\s+([^•\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : courseId;
    
    const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*to\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (!timeMatch) return null;
    
    const startTime = this.parseTime(timeMatch[1].replace(/\s/g, ''));
    const endTime = this.parseTime(timeMatch[2].replace(/\s/g, ''));
    
    const daysMatch = text.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:,\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun))?/i);
    const days = this.parseDays(daysMatch ? daysMatch[0] : '');
    
    if (days.length === 0) return null;
    
    return {
      courseId,
      title,
      instructor: 'TBA',
      location: 'TBA',
      startDate: this.getCurrentSemesterStart(),
      endDate: this.getCurrentSemesterEnd(),
      days,
      startTime,
      endTime
    };
  }

  private parseScheduleBuilderRow(row: HTMLElement): CourseMeeting | null {
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



  private parseTime(timeStr: string, period?: string): string {
    const cleanTime = timeStr.replace(/\s/g, '');
    const [hoursStr, initialMinutesStr] = cleanTime.split(':');
    
    let minutesStr = initialMinutesStr;
    const ampmMatch = minutesStr?.match(/(\d+)(AM|PM)/i);
    if (ampmMatch) {
      minutesStr = ampmMatch[1];
      period = ampmMatch[2];
    }
    
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

  private parseDays(daysStr: string): string[] {
    const dayMap: Record<string, string> = {
      'Mon': 'MO',
      'Tue': 'TU', 
      'Wed': 'WE',
      'Thu': 'TH',
      'Fri': 'FR',
      'Sat': 'SA',
      'Sun': 'SU',
      'Monday': 'MO',
      'Tuesday': 'TU',
      'Wednesday': 'WE', 
      'Thursday': 'TH',
      'Friday': 'FR',
      'Saturday': 'SA',
      'Sunday': 'SU'
    };

    const days: string[] = [];
    const dayNames = daysStr.split(/[,\s]+/).filter(d => d.length > 0);
    
    for (const dayName of dayNames) {
      const icsDay = dayMap[dayName];
      if (icsDay && !days.includes(icsDay)) {
        days.push(icsDay);
      }
    }
    
    return days;
  }

  private detectSemester(): string {
    const termLabels = document.querySelectorAll('.term_label');
    for (const label of termLabels) {
      const text = label.textContent || '';
      const seasonMatch = text.match(/(\d{4})\s+(Fall|Spring|Summer|Winter)/i);
      if (seasonMatch) {
        return `${seasonMatch[2]} ${seasonMatch[1]}`;
      }
    }
    
    const url = new URL(window.location.href);
    const termParam = url.searchParams.get('term');
    if (termParam) {
      const termMatch = termParam.match(/(\d{2})(\d{2})(\d{2})/);
      if (termMatch) {
        const year = `20${termMatch[2]}`;
        const semesterCode = termMatch[3];
        let semester = 'Fall';
        if (semesterCode === '10') semester = 'Spring';
        else if (semesterCode === '20') semester = 'Summer';
        else if (semesterCode === '30') semester = 'Fall';
        return `${semester} ${year}`;
      }
    }
    
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
      return `${year}-08-28`;
    } else if (month >= 2 && month <= 5) {
      return `${year}-01-28`;
    } else {
      return `${year}-06-01`;
    }
  }

  private getCurrentSemesterEnd(): string {
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

  private async getExportSettings(): Promise<{ reminderMinutes: number }> {
    try {
      const result = await chrome.storage.sync.get(['reminderMinutes']);
      return {
        reminderMinutes: result.reminderMinutes ?? 10
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return { reminderMinutes: 10 };
    }
  }
}

new CUNYScheduleScraper(); 