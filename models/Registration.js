export const students = [
  {
    id: "CS2026-001",
    password: "123456",
    name: "አበበ ከበደ",
    gender: "ወንድ",
    entryYear: "2026",
    email: "abebe123@example.com",
    phone: "+251 911 111 111",
    status: "Learning in Progress",
    gpa: 3.72,
    results: [
      { code: "መሃ 03-ምሥ/ጥም", course: "ምሥጢረ ጥምቀት", score: 88, grade: "A" },
      { code: "መሃ 02-ምሥ/ሥጋ", course: "ምሥጢረ ሥጋዌ", score: 82, grade: "A-" },
      { code: "መሃ 01-ምሥ/ሥላ", course: "ምሥጢረ ሥላሴ", score: 91, grade: "A+" },
    ]
  },
  {
    id: "CS2026-002",
    password: "123456",
    name: "Bethlehem Tesfaye",
    gender: "Female",
    entryYear: "2026",
    email: "bethlehem@example.com",
    phone: "+251 922 222 222",
    status: "Learning in Progress",
    gpa: 3.45,
    results: [
      { code: "CS301", course: "Web Design and Development", score: 75, grade: "B+" },
      { code: "CS302", course: "Computer Networks", score: 68, grade: "C+" },
    ]
  },
  {
    id: "CS2026-003",
    password: "123456",
    name: "Dawit Alemu",
    gender: "Male",
    entryYear: "2026",
    email: "dawit@example.com",
    phone: "+251 933 333 333",
    status: "Learning in Progress",
    gpa: 3.18,
    results: [
      { code: "CS301", course: "Web Design and Development", score: 92, grade: "A+" },
    ]
  },
  {
    id: "CS2026-004",
    password: "123456",
    name: "Ruth Bekele",
    gender: "Female",
    entryYear: "2026",
    email: "ruth@example.com",
    phone: "+251 944 444 444",
    status: "Learning in Progress",
    gpa: 3.86,
    results: [
      { code: "መሃ 03-ምሥ/ጥም", course: "ምሥጢረ ጥምቀት", score: 95, grade: "A+" },
      { code: "መሃ 02-ምሥ/ሥጋ", course: "ምሥጢረ ሥጋዌ", score: 89, grade: "A" },
      { code: "መሃ 01-ምሥ/ሥላ", course: "ምሥጢረ ሥላሴ", score: 93, grade: "A+" },
    ]
  },
  {
    id: "CS2026-005",
    password: "123456",
    name: "Yonatan Girma",
    gender: "Male",
    entryYear: "2026",
    email: "yonatan@example.com",
    phone: "+251 955 555 555",
    status: "Learning in Progress",
    gpa: 3.31,
    results: [
      { code: "CS301", course: "Web Design and Development", score: 78, grade: "B+" },
      { code: "CS303", course: "Statistics and Probability", score: 84, grade: "A-" },
    ]
  },
];

export function getCurrentStudent() {
  const loggedInId = localStorage.getItem("loggedInStudentId");
  const student = students.find((student) => student.id === loggedInId);
  return student || students[0];
}

export function getStudentResults(studentId) {
  const student = students.find((s) => s.id === studentId);
  if (student) {
    // Check localStorage first for updated results
    const savedResults = localStorage.getItem(`results_${studentId}`);
    if (savedResults) {
      return JSON.parse(savedResults);
    }
    return student.results || [];
  }
  return [];
}
