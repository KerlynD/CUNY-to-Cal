## 1 · Executive summary

CUNYFIRST does not let students export their term schedule to a standard calendar format (ICS) from the “Student Center / Schedule Builder” UI.
A Chrome extension will inject a small content-script into those pages, scrape the user’s visible schedule (or fetch the hidden MyInfo ICS feed when available), transform it into a standards-compliant .ics file, and trigger a download—one-click importable into Google Calendar, Outlook, Apple Calendar, etc.

---

## 2 · Goals & non-goals

|                                                                             | In scope | Out of scope                                        |
| --------------------------------------------------------------------------- | -------- | --------------------------------------------------- |
| Generate single-semester **.ics** file (download)                           | ✅        | Continuous 2-way sync                               |
| Support **Student Center → Class Schedule** & **Schedule Builder** pages    | ✅        | Other CUNYFIRST areas (financial aid, grades)       |
| Auto-detect already-available **MyInfo ICS feed** and fall back to scraping | ✅        | Building a dedicated mobile app                     |
| Basic reminder options (–10 min, –30 min, none)                             | ✅        | Custom color-coding per course (v1)                 |
| Works in Chrome & other Chromium browsers (Edge, Brave)                     | ✅        | Firefox (Manifest v3 ≠ WebExtension v3 differences) |

---

## 3 · User stories

* **US-1**: *As a CUNY student, I want to click one button on my schedule page and download an .ics file so I can import it to Google Calendar.*
* **US-2**: *If CUNYFIRST already exposes an ICS feed (via MyInfo), I want the extension to give me that URL directly so I don’t create duplicates.*
* **US-3**: *I want the events to include course code, location, instructor, and the correct recurrence rule (e.g., Mon/Wed only, until 12 Dec 2025).*
* **US-4**: *Privacy:* The extension must not store my CUNY credentials or upload my calendar anywhere.

---

## 4 · Functional requirements

1. **Page detection**

   * The content-script must activate only on:

     * `https://home.cunyfirst.cuny.edu/*/CLASS_SCHEDULE*`
     * `https://schedulebuilder.cuny.edu/*`
2. **Data extraction**

   * Parse visible HTML tables for each class row: course code, title, meeting days, start/end times, start/end dates, location, instructor.
   * Handle multiple meeting patterns per class (lecture + lab).
3. **Fallback to MyInfo feed**

   * If user is logged in **and** the hidden MyInfo “download iCal” endpoint is reachable, surface a “Use official feed” button (less parsing).

     * MyInfo FAQ confirms an integrated iCal download is available for *My Classes*([central.ccny.cuny.edu][1])
4. **ICS generation**

   * Use a pure-JS library (e.g. \[`ics` NPM pkg]\([npm][2])) in the service-worker to build the file, including:

     * `VEVENT` per meeting pattern with `RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20251212T045959Z`
     * `VALARM` 10 min default, configurable in extension options.
5. **File delivery**

   * Create a Blob and call `chrome.downloads.download()` (MV3-safe pattern for Blob downloads)([Stack Overflow][3]).
6. **UX**

   * Small omnipresent toolbar button → popup with “Export semester” + options.
   * Success toast: “Schedule-Fall 2025.ics saved”.
7. **Permissions**

   * Minimal: `activeTab`, `downloads`, `storage`, matching `host_permissions` for the two CUNYFIRST domains.

---

## 5 · Non-functional requirements

| Category          | Requirement                                                           |
| ----------------- | --------------------------------------------------------------------- |
| **Performance**   | Generate ICS < 1 s for typical 5-course load.                         |
| **Security**      | No remote code; all libs bundled (MV3 disallows eval/remote scripts). |
| **Privacy**       | Zero data leaves the browser; no analytics by default.                |
| **Compliance**    | Manifest v3 only (Chrome Web Store after June ’24 rejects MV2).       |
| **Accessibility** | Popup meets WCAG AA: keyboardable, ARIA labels.                       |

---

## 6 · Competitive / prior-art research

* **MyInfo mobile / web** already offers an ical download (hidden behind My Classes page) but many students never discover it or prefer the richer Schedule Builder UI.([central.ccny.cuny.edu][1])
* No Chrome Web Store extension today targets CUNYFIRST schedule export—searches for “CUNY schedule calendar export” and “CUNYFIRST chrome extension” return only forum tips.([Reddit][4], [The City University of New York][5])
* Generic ICS generators exist (npm `ics`, `ical-generator`) we can leverage instead of rolling our own.([npm][2])

---

## 7 · Technical approach

| Layer              | Details                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Manifest (v3)**  | `action` popup + background **service worker**; content-script injected via `"content_scripts"`([Chrome for Developers][6]). |
| **Content-script** | – Detect schedule tables.<br>– Pull raw text & data attributes.<br>– `postMessage` payload to service worker.                |
| **Service worker** | – Convert raw schedule into event list.<br>– Use `ics` lib to create .ics string.<br>– Blob → `chrome.downloads.download()`. |
| **Options page**   | Store default reminder offset in `chrome.storage.sync`.                                                                      |
| **Testing**        | Use `chrome-extension-v3-starter` boilerplate for Jest + Puppeteer e2e; can stub schedule HTML for CI.                       |
| **CI/CD**          | GitHub Actions → `chrome-webstore-upload-cli` for automatic zip & upload on tag.                                             |

---

## 8 · Data model

```ts
interface CourseMeeting {
  courseId: string;   // “CSCI-38100”
  title: string;      // “Algorithms”
  instructor: string; // “Prof. Smith”
  location: string;   // “Science Bldg 201”
  startDate: string;  // “2025-08-28”
  endDate: string;    // “2025-12-12”
  days: string[];     // [“MO”, “WE”]
  startTime: string;  // “09:30”
  endTime: string;    // “10:45”
}
```

---

## 9 · Open questions / risks

1. **DOM volatility** – CUNYFIRST UI updates could break selectors; mitigate by isolating selectors and adding small heuristic checks (e.g., presence of “Class Number”).
2. **Time-zone handling** – Ensure start/end times are exported in **America/New\_York**; convert to UTC before writing `DTSTART` to avoid daylight-shift bugs.
3. **Releases & Web-Store review** – Google forbids remotely hosted code; all libraries must be vendored. Continuous review for MV3 policy changes.
4. **Edge cases** – Courses with irregular dates (weekend labs, hybrid). Provide manual edit instructions on help page.

---

## 10 · Milestones & timeline (aggressive MVP)

| Week | Deliverable                                              |
| ---- | -------------------------------------------------------- |
| 1    | Skeleton MV3 extension scaffold + test harness           |
| 2    | Content-script scraping Student Center schedule          |
| 3    | Service-worker ICS generation via `ics` lib              |
| 4    | Support Schedule Builder page + recurrence rules         |
| 5    | Settings UI (reminders) + MyInfo feed fallback           |
| 6    | Beta testing with 5 classmates; bug fixes                |
| 7    | Prep marketing (logo, screenshots); Web-Store submission |
| 8    | v1 launch                                                |

---

## 11 · Success metrics

* **Adoption**: ≥ 200 installs across CUNY campuses by finals week.
* **Engagement**: ≥ 80 % of users complete an export within 2 minutes of install.
* **Support**: < 2 bug reports per 100 users per semester.

---

### Appendix A · Sample ICS payload (one class)

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//cunyfirst-export//1.0
BEGIN:VEVENT
UID:CSCI38100-Fall2025-MO0900
SUMMARY:Algorithms (CSCI 38100)
LOCATION:Science Bldg 201
DTSTART;TZID=America/New_York:20250828T093000
DTEND;TZID=America/New_York:20250828T104500
RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20251212T045959Z
DESCRIPTION:Instructor: Prof. Smith
BEGIN:VALARM
TRIGGER:-PT10M
ACTION:DISPLAY
DESCRIPTION:Upcoming class — Algorithms
END:VALARM
END:VEVENT
END:VCALENDAR
```

