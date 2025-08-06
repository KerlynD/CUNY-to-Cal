# Changelog

All notable changes to CUNY to Calendar extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-03

### Added
- **Core Features**
  - One-click export from CUNYFIRST schedule pages to .ics calendar files
  - Support for Student Center CLASS_SCHEDULE pages
  - Support for Schedule Builder (schedulebuilder.cuny.edu and sb.cunyfirst.cuny.edu)
  - Automatic recurring weekly events with proper semester end dates
  - Customizable reminder notifications (None, 10 minutes, 30 minutes)
  - Multi-pattern course support (lecture + lab combinations)

- **User Interface**
  - Modern burgundy gradient design with glassmorphism effects
  - Responsive popup interface with status detection
  - Comprehensive options page for settings management
  - Professional SVG icon system (16px, 48px, 128px)
  - Smooth hover animations and transitions

- **Technical Implementation**
  - Manifest V3 Chrome extension architecture
  - TypeScript codebase with strict type checking
  - React + Vite frontend build system
  - Comprehensive test suite (25 unit tests + 4 e2e tests)
  - CI/CD pipeline with automated quality checks
  - Local-only processing for complete privacy

- **Schedule Parsing**
  - Intelligent DOM scraping for multiple CUNY page formats
  - Course title, instructor, location, and time extraction
  - Day-of-week parsing with proper iCalendar formatting
  - Semester detection and end date calculation
  - Timezone handling (America/New_York with UTC conversion)

- **Calendar Integration**
  - Standards-compliant .ics file generation
  - RRULE support for weekly recurring events
  - VALARM support for reminder notifications
  - Unique UID generation for calendar event management
  - Compatible with Google Calendar, Outlook, Apple Calendar, and more

### Security & Privacy
- Local-only data processing (no external servers)
- Minimal permissions (activeTab, downloads, storage)
- No data collection or telemetry
- Open source with MIT license

### Development Tools
- ESLint configuration with TypeScript support
- Jest testing framework with Chrome API mocking
- Automated build and packaging scripts
- Cross-platform CI testing (Windows, macOS, Linux)
- GitHub Actions workflow for quality assurance

### Package Details
- Extension size: 84KB
- Build time: ~600ms
- 112 bundled modules
- Optimized for performance and reliability

---