import * as ics from 'ics';
import { CourseMeeting, ScheduleData, ExtensionMessage, ExportSettings } from './types';

class CUNYCalendarExporter {
  constructor() {
    this.setupMessageListeners();
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
      if (message.type === 'EXPORT_REQUEST') {
        this.handleExportRequest(sender.tab?.id).then(sendResponse);
        return true; 
      }
    });

    chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
      if (message.type === 'EXPORT_FROM_POPUP') {
        this.handleExportFromPopup(message.settings).then(sendResponse);
        return true;
      }
    });
  }

  private async handleExportRequest(tabId?: number): Promise<void> {
    if (!tabId) {
      throw new Error('No active tab found');
    }

    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'EXPORT_REQUEST' });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to scrape schedule data');
      }

      const settings = await this.getExportSettings();
      
      // Generate and download ICS file
      await this.generateAndDownloadICS(response.data, settings);
      
    } catch (error) {
      console.error('Export failed:', error);
      chrome.runtime.sendMessage({
        type: 'EXPORT_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleExportFromPopup(settings?: ExportSettings): Promise<void> {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'EXPORT_REQUEST' });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to scrape schedule data');
      }

      const exportSettings = settings || await this.getExportSettings();
      
      await this.generateAndDownloadICS(response.data, exportSettings);
      
    } catch (error) {
      console.error('Export from popup failed:', error);
      throw error;
    }
  }

  private async generateAndDownloadICS(scheduleData: ScheduleData, settings: ExportSettings): Promise<void> {
    if (!scheduleData.meetings || scheduleData.meetings.length === 0) {
      throw new Error('No schedule data found on this page');
    }

         const events: any[] = [];
    
    for (const meeting of scheduleData.meetings) {
      const event = this.createEventFromMeeting(meeting, settings);
      if (event) {
        events.push(event);
      }
    }

    if (events.length === 0) {
      throw new Error('No valid events could be created from schedule data');
    }

              const { error, value: icsContent } = ics.createEvents(events);

    if (error || !icsContent) {
      throw new Error('Failed to generate calendar file: ' + (error?.message || 'Unknown error'));
    }

    const filename = `Schedule-${scheduleData.semester.replace(/\s+/g, '-')}.ics`;

    await this.downloadFile(icsContent, filename);
  }

     private createEventFromMeeting(meeting: CourseMeeting, settings: ExportSettings): any | null {
    try {
      const startDate = this.parseDate(meeting.startDate);
      const endDate = this.parseDate(meeting.endDate);
      const [startHour, startMinute] = meeting.startTime.split(':').map(Number);
      const [endHour, endMinute] = meeting.endTime.split(':').map(Number);

      const eventStart: [number, number, number, number, number] = [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startHour,
        startMinute
      ];

      const eventEnd: [number, number, number, number, number] = [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        endHour,
        endMinute
      ];

      const byDay = meeting.days.join(',');

      const untilDate = new Date(endDate);
      untilDate.setHours(23, 59, 59, 999); 
      const until = this.formatDateForUntil(untilDate);

             const event: any = {
        uid: `${meeting.courseId}-${meeting.startTime}-${meeting.days.join('')}`,
        title: `${meeting.title} (${meeting.courseId})`,
        description: `Instructor: ${meeting.instructor}`,
        location: meeting.location,
        start: eventStart,
        end: eventEnd,
        startInputType: 'local',
        endInputType: 'local',
        recurrenceRule: `FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${until}`,
        alarms: settings.reminderMinutes > 0 ? [{
          action: 'display',
          description: `Upcoming class — ${meeting.title}`,
          trigger: { minutes: settings.reminderMinutes, before: true }
        }] : undefined
      };

      return event;
    } catch (error) {
      console.error('Error creating event from meeting:', error, meeting);
      return null;
    }
  }

  private parseDate(dateStr: string): Date {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    
    return new Date(dateStr);
  }

  private formatDateForUntil(date: Date): string {
    // Convert to UTC and format as YYYYMMDDTHHMMSSZ
    const utc = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const year = utc.getUTCFullYear();
    const month = (utc.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = utc.getUTCDate().toString().padStart(2, '0');
    const hours = utc.getUTCHours().toString().padStart(2, '0');
    const minutes = utc.getUTCMinutes().toString().padStart(2, '0');
    const seconds = utc.getUTCSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  private async downloadFile(content: string, filename: string): Promise<void> {
    try {
      const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const downloadId = await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
      });

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      console.log(`Downloaded ${filename} with ID: ${downloadId}`);
      
      chrome.runtime.sendMessage({
        type: 'EXPORT_COMPLETE',
        data: { filename }
      });

    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async getExportSettings(): Promise<ExportSettings> {
    try {
      const result = await chrome.storage.sync.get(['reminderMinutes']);
      return {
        reminderMinutes: result.reminderMinutes ?? 10 // Default to 10 minutes
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return { reminderMinutes: 10 };
    }
  }
}

new CUNYCalendarExporter(); 