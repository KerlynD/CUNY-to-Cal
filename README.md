# CUNY to Calendar 📅

A Chrome extension that lets CUNY students export their class schedules from CUNYFIRST to standard calendar formats (.ics) in one click.

[![Build Status](https://github.com/your-repo/cuny-to-cal/workflows/Build%20and%20Test/badge.svg)](https://github.com/your-repo/cuny-to-cal/actions)

## Features

- **One-Click Export**: Export your entire semester schedule with a single click
- **Universal Compatibility**: Works with Google Calendar, Outlook, Apple Calendar, and any app that supports .ics files
- **Smart Detection**: Automatically detects and scrapes schedule data from CUNY Student Center and Schedule Builder pages
- **Recurring Events**: Properly handles weekly recurring classes with correct end dates
- **Customizable Reminders**: Set default reminder times (none, 10 min, or 30 min before class)
- **Privacy First**: All processing happens locally in your browser - no data is sent to external servers
- **Offline Operation**: Works completely offline after installation

## Supported Pages

- **Schedule Builder**: `https://schedulebuilder.cuny.edu/*` and `https://sb.cunyfirst.cuny.edu/*`

## Quick Start

### Installation

1. **Download the Extension**
   - Go to the [Releases](https://github.com/your-repo/cuny-to-cal/releases) page
   - Download the latest `cuny-to-cal-v*.zip` file

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the unzipped extension folder
   - The CUNY to Calendar extension should now appear in your extensions

### Usage

1. **Navigate to Your Schedule**
   - Go to your CUNY Schedule Builder

2. **Export Your Schedule**
   - Click the extension icon in your browser toolbar, or
   - Click the floating "📅 Export Schedule" button that appears on the page
   - You can choose your reminder preference from the extension icon in your browser toolbar (optional)

3. **Import to Your Calendar**
   - The `Schedule-[Semester]-[Year].ics` file will download automatically
   - Import this file into your preferred calendar app:
     - **Google Calendar**: Settings → Import & Export → Import
     - **Outlook**: File → Open & Export → Import/Export → Import an iCalendar (.ics) file
     - **Apple Calendar**: File → Import → Select the .ics file

## Development

### Prerequisites

- Node.js 18+ and npm
- Chrome browser for testing

### Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/cuny-to-cal.git
cd cuny-to-cal

# Install dependencies
npm install

# Build the extension
npm run build

# Run tests
npm test
npm run test:e2e

# Development mode (with hot reload)
npm run dev
```

### Project Structure

```
cuny-to-cal/
├── src/
│   ├── contentScript.ts      # DOM scraping and page detection
│   ├── background.ts         # Service worker for ICS generation
│   ├── types.ts             # TypeScript interfaces
│   ├── popup/               # React popup UI
│   │   ├── popup.html
│   │   └── popup.tsx
│   ├── options/             # Extension options page
│   │   ├── options.html
│   │   └── options.tsx
│   └── __tests__/           # Unit and integration tests
├── manifest.json            # Extension manifest (MV3)
├── package.json
└── README.md
```

### Loading for Development

1. Run `npm run build` to build the extension
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder
5. Make changes to source code and run `npm run build` again
6. Click the refresh button on the extension card to reload

### Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:e2e

# Lint and type checking
npm run lint
npm run type-check

# All quality checks
npm run lint && npm run type-check && npm test
```

## Build Process

The extension uses Vite for building and bundles everything for Manifest V3 compliance:

- **TypeScript**: All source code is written in TypeScript
- **React**: Popup and options pages use React with inline styles
- **Bundling**: All dependencies are bundled locally (no remote code)
- **Manifest V3**: Uses service workers and modern Chrome APIs

### Production Build

```bash
# Build for production
npm run build

# Create distribution zip
npm run zip

# The cuny-to-cal.zip file is ready for Chrome Web Store submission
```

### Common Issues

**Extension doesn't activate on CUNY pages**
- Ensure you're on a supported page ( Schedule Builder)
- Try refreshing the page
- Check that the extension is enabled in `chrome://extensions/`

**No classes found when exporting**
- Make sure your schedule is visible on the page
- The extension looks for standard CUNY schedule table formats
- Try scrolling to ensure all content is loaded

**Calendar events have wrong times**
- The extension uses your system timezone and converts appropriately
- Verify your schedule shows the correct times on the CUNY website

**Downloaded file won't import to calendar**
- Ensure the file has a `.ics` extension
- Try importing with a different calendar application
- Check that the file isn't corrupted (should contain readable text)

### Getting Help

1. Check the [Issues](https://github.com/your-repo/cuny-to-cal/issues) page for known problems
2. Create a new issue with:
   - Your Chrome version
   - The CUNY page you're trying to export from
   - Any error messages you see
   - Steps to reproduce the problem

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style (enforced by ESLint)
- Add tests for new functionality
- Update documentation as needed
- Ensure builds are successful before submitting PRs

## Acknowledgments

- Built for CUNY students by CUNY students
- Uses the excellent [ics](https://www.npmjs.com/package/ics) library for calendar generation
- Inspired by the need for better schedule management tools in academic environments

## Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/cuny-to-cal/issues)
- **Email**: difokerlyn19@example.com

---

Made with ❤️ for the CUNY community
