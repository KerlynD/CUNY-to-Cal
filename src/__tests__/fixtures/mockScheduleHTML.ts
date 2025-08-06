// Mock HTML fixtures for testing schedule scraping

export const MOCK_STUDENT_CENTER_HTML = `
<div>
  <table class="PSLEVEL1GRID">
    <tr id="CLASS_1">
      <td>CSCI-316</td>
      <td>Lecture</td>
      <td>MoWe 2:00PM - 3:15PM</td>
      <td>Science Building 201</td>
      <td>Prof. Smith</td>
    </tr>
    <tr id="CLASS_2">
      <td>MATH-242</td>
      <td>Lecture</td>
      <td>TuTh 10:00AM - 11:15AM</td>
      <td>Math Building 305</td>
      <td>Prof. Johnson</td>
    </tr>
    <tr id="CLASS_3">
      <td>CSCI-316</td>
      <td>Lab</td>
      <td>Fr 1:00PM - 3:50PM</td>
      <td>Computer Lab A</td>
      <td>TA Williams</td>
    </tr>
  </table>
</div>
`;

export const MOCK_SCHEDULE_BUILDER_HTML = `
<div>
  <table>
    <tr class="class-row">
      <td class="course-title">CSCI-340 Operating Systems</td>
      <td>MoWe</td>
      <td>11:00AM - 12:15PM</td>
      <td>Room: Science 150</td>
      <td>Instructor: Prof. Davis</td>
    </tr>
    <tr class="class-row">
      <td class="course-title">ENGL-110 Writing</td>
      <td>TuTh</td>
      <td>9:00AM - 10:15AM</td>
      <td>Room: Humanities 203</td>
      <td>Instructor: Prof. Brown</td>
    </tr>
  </table>
</div>
`;

export const MOCK_GENERIC_SCHEDULE_HTML = `
<div>
  <table>
    <tr>
      <td>PHYS-201 Physics I</td>
      <td>Monday, Wednesday</td>
      <td>3:30PM - 4:45PM</td>
      <td>Physics Lab 101</td>
    </tr>
    <tr>
      <td>CHEM-103 General Chemistry</td>
      <td>Tuesday, Thursday</td>
      <td>1:00PM - 2:15PM</td>
      <td>Chemistry Building</td>
    </tr>
  </table>
</div>
`;

export const MOCK_SEMESTER_CONTEXT_HTML = `
<div>
  <h1>Fall 2025 Class Schedule</h1>
  <p>Term: Fall 2025</p>
  ${MOCK_STUDENT_CENTER_HTML}
</div>
`; 