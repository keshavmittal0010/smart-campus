import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database data...');
  
  // Clean up in dependency order
  await prisma.attendance.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding rich MySQL database for Smart Campus...');

  // 1. Create Users & Profiles
  // Students
  const studentData = [
    { email: 'arjun.sharma@campus.edu', firstName: 'Arjun', lastName: 'Sharma', studentId: 'CS21045', department: 'Computer Science', semester: '5', section: 'A' },
    { email: 'priya.kapoor@campus.edu', firstName: 'Priya', lastName: 'Kapoor', studentId: 'CS21046', department: 'Computer Science', semester: '5', section: 'A' },
    { email: 'rahul.verma@campus.edu', firstName: 'Rahul', lastName: 'Verma', studentId: 'CS21047', department: 'Computer Science', semester: '5', section: 'A' },
    { email: 'ananya.singh@campus.edu', firstName: 'Ananya', lastName: 'Singh', studentId: 'CS21048', department: 'Computer Science', semester: '5', section: 'A' },
    { email: 'karan.mehta@campus.edu', firstName: 'Karan', lastName: 'Mehta', studentId: 'CS21049', department: 'Computer Science', semester: '5', section: 'A' },
    { email: 'sneha.patel@campus.edu', firstName: 'Sneha', lastName: 'Patel', studentId: 'CS21050', department: 'Computer Science', semester: '5', section: 'A' },
    { email: 'dev.chauhan@campus.edu', firstName: 'Dev', lastName: 'Chauhan', studentId: 'CS21051', department: 'Computer Science', semester: '5', section: 'A' },
    { email: 'riya.sharma@campus.edu', firstName: 'Riya', lastName: 'Sharma', studentId: 'CS21052', department: 'Computer Science', semester: '5', section: 'A' },
    { email: 'amit.kumar@campus.edu', firstName: 'Amit', lastName: 'Kumar', studentId: 'CS21053', department: 'Computer Science', semester: '5', section: 'A' },
    { email: 'pooja.nair@campus.edu', firstName: 'Pooja', lastName: 'Nair', studentId: 'CS21054', department: 'Computer Science', semester: '5', section: 'A' },
  ];

  const students: any[] = [];
  for (const s of studentData) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: 'hashed_password', // For simplicity
        firstName: s.firstName,
        lastName: s.lastName,
        role: 'student',
        studentProfile: {
          create: {
            studentId: s.studentId,
            department: s.department,
            semester: s.semester,
            section: s.section
          }
        }
      },
      include: {
        studentProfile: true
      }
    });
    students.push(user.studentProfile);
  }

  // Faculty Members
  const facultyData = [
    { email: 'prof.mehta@campus.edu', firstName: 'Rajesh', lastName: 'Mehta', employeeId: 'EMP001', department: 'Computer Science' },
    { email: 'prof.sharma@campus.edu', firstName: 'Dinesh', lastName: 'Sharma', employeeId: 'EMP002', department: 'Computer Science' },
    { email: 'prof.gupta@campus.edu', firstName: 'Sunita', lastName: 'Gupta', employeeId: 'EMP003', department: 'Computer Science' },
    { email: 'prof.verma@campus.edu', firstName: 'Anil', lastName: 'Verma', employeeId: 'EMP004', department: 'Computer Science' },
    { email: 'prof.joshi@campus.edu', firstName: 'Kavita', lastName: 'Joshi', employeeId: 'EMP005', department: 'Computer Science' },
  ];

  const faculties: any[] = [];
  for (const f of facultyData) {
    const user = await prisma.user.create({
      data: {
        email: f.email,
        passwordHash: 'hashed_password',
        firstName: f.firstName,
        lastName: f.lastName,
        role: 'faculty',
        facultyProfile: {
          create: {
            employeeId: f.employeeId,
            department: f.department
          }
        }
      },
      include: {
        facultyProfile: true
      }
    });
    faculties.push(user.facultyProfile);
  }

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@campus.edu',
      passwordHash: 'hashed_password',
      firstName: 'System',
      lastName: 'Admin',
      role: 'admin'
    }
  });

  // 2. Create Courses
  const courseData = [
    { courseCode: 'CS301', courseName: 'Data Structures', credits: 4, department: 'Computer Science', semester: '5' },
    { courseCode: 'CS302', courseName: 'Operating Systems', credits: 4, department: 'Computer Science', semester: '5' },
    { courseCode: 'CS303', courseName: 'Database Management', credits: 3, department: 'Computer Science', semester: '5' },
    { courseCode: 'CS304', courseName: 'Computer Networks', credits: 4, department: 'Computer Science', semester: '5' },
    { courseCode: 'CS305', courseName: 'Software Engineering', credits: 3, department: 'Computer Science', semester: '5' },
  ];

  const courses: any[] = [];
  for (const c of courseData) {
    const course = await prisma.course.create({
      data: c
    });
    courses.push(course);
  }

  // 3. Create Classes (Link Courses to Faculty)
  // Class mapping:
  // CS301 (DS) -> Prof. Mehta (faculties[0])
  // CS302 (OS) -> Prof. Sharma (faculties[1])
  // CS303 (DBMS) -> Prof. Gupta (faculties[2])
  // CS304 (Networks) -> Prof. Verma (faculties[3])
  // CS305 (Software Eng) -> Prof. Joshi (faculties[4])
  const classes: any[] = [];
  for (let i = 0; i < courses.length; i++) {
    const classRecord = await prisma.class.create({
      data: {
        courseId: courses[i].id,
        facultyId: faculties[i].id,
        section: 'A'
      }
    });
    classes.push(classRecord);
  }

  // 4. Enroll Students in Classes
  // Enroll all students in all classes
  const enrollments: any[] = [];
  for (const student of students) {
    for (const classObj of classes) {
      // For Arjun Sharma (students[0]), set some realistic grades on enrollment
      let grade = null;
      if (student.id === students[0].id) {
        if (classObj.courseId === courses[0].id) grade = 8.5;
        if (classObj.courseId === courses[2].id) grade = 9.0;
        if (classObj.courseId === courses[3].id) grade = 7.8;
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          status: 'active',
          grade: grade
        }
      });
      enrollments.push(enrollment);
    }
  }

  // 5. Create Historical Attendance (for ALL students)
  const today = new Date();

  // Attendance patterns per student (index) per class (subject index)
  // Format: [overall_rate, per-subject modifier]
  const studentAttendancePatterns = [
    // Arjun: ~82% overall, OS is weak
    [0.82, [0.85, 0.66, 1.0, 0.80, 0.85]],
    // Priya: ~97% overall, excellent student
    [0.97, [0.97, 0.95, 1.0, 0.97, 0.97]],
    // Rahul: ~72% overall, struggling
    [0.72, [0.75, 0.60, 0.80, 0.70, 0.75]],
    // Ananya: ~95% overall
    [0.95, [0.95, 0.93, 1.0, 0.95, 0.95]],
    // Karan: ~92% overall
    [0.92, [0.92, 0.90, 0.95, 0.90, 0.92]],
    // Sneha: ~88% overall
    [0.88, [0.88, 0.85, 0.92, 0.88, 0.88]],
    // Dev: ~68% overall, poor attendance
    [0.68, [0.70, 0.55, 0.72, 0.68, 0.70]],
    // Riya: ~79% overall
    [0.79, [0.80, 0.72, 0.85, 0.78, 0.80]],
    // Amit: ~85% overall
    [0.85, [0.85, 0.80, 0.90, 0.85, 0.87]],
    // Pooja: ~90% overall
    [0.90, [0.90, 0.88, 0.95, 0.90, 0.90]],
  ];

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];
    const [, subjectRates] = studentAttendancePatterns[sIdx] as [number, number[]];

    for (let d = 0; d < 15; d++) {
      const attendanceDate = new Date();
      attendanceDate.setDate(today.getDate() - d);

      for (let i = 0; i < classes.length; i++) {
        const enrollment = enrollments.find(e => e.studentId === student.id && e.classId === classes[i].id);
        if (!enrollment) continue;

        const rate = subjectRates[i];
        // Deterministic pseudo-random based on student+day+subject
        const seed = (sIdx * 100 + d * 7 + i * 13) % 100;
        let status: string;
        if (seed < rate * 85) {
          status = 'present';
        } else if (seed < rate * 95) {
          status = 'late';
        } else {
          status = 'absent';
        }

        await prisma.attendance.create({
          data: {
            enrollmentId: enrollment.id,
            classId: classes[i].id,
            attendanceDate: attendanceDate,
            status: status
          }
        });
      }
    }
  }

  // 6. Create Assignments
  const assignmentsData = [
    { title: 'Binary Trees & Heap Implementation', desc: 'Implement AVL trees, heaps and compare time complexities with analysis.', dueDaysOffset: 1, maxMarks: 100, classIndex: 0 },
    { title: 'Process Scheduling Algorithms', desc: 'Compare FCFS, SJF, Round Robin and Priority scheduling with simulations.', dueDaysOffset: 5, maxMarks: 50, classIndex: 1 },
    { title: 'ER Diagram & Normalization', desc: 'Design a complete ER diagram for a hospital management system up to 3NF.', dueDaysOffset: 8, maxMarks: 100, classIndex: 2 },
    { title: 'Socket Programming Lab', desc: 'Implement a client-server chat application using TCP/UDP sockets.', dueDaysOffset: -4, maxMarks: 100, classIndex: 3 },
    { title: 'UML Diagrams & SRS Document', desc: 'Prepare complete SRS document with all UML diagrams for your project.', dueDaysOffset: 12, maxMarks: 100, classIndex: 4 },
  ];

  const createdAssignments: any[] = [];
  for (const a of assignmentsData) {
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + a.dueDaysOffset);
    
    const assignment = await prisma.assignment.create({
      data: {
        classId: classes[a.classIndex].id,
        title: a.title,
        description: a.desc,
        dueDate: dueDate,
        maxMarks: a.maxMarks
      }
    });
    createdAssignments.push(assignment);
  }

  // 7. Seed Submissions for ALL students with realistic grades
  // Marks patterns: [DS, OS, DBMS, Networks, SE] per student
  const studentMarksPatterns = [
    [87, null, 76, 82, null],   // Arjun: DS graded, OS pending, DBMS graded
    [92, 88, 94, null, 85],     // Priya: top performer
    [65, null, 72, 70, null],   // Rahul: average
    [90, 86, 91, 88, 89],      // Ananya: excellent
    [85, 80, 88, 82, 84],      // Karan: good
    [78, 70, 82, 75, 79],      // Sneha: decent
    [55, null, 60, 58, null],   // Dev: struggling
    [72, 68, 75, 70, 73],      // Riya: average
    [82, 78, 85, 80, 83],      // Amit: good
    [88, 84, 90, 86, 87],      // Pooja: very good
  ];

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];
    const marks = studentMarksPatterns[sIdx];

    for (let aIdx = 0; aIdx < createdAssignments.length; aIdx++) {
      const m = marks[aIdx];
      if (m === null) continue; // Skip — not submitted or pending

      // Avoid duplicate: Arjun already has submissions seeded above
      if (sIdx === 0) continue;

      await prisma.submission.create({
        data: {
          assignmentId: createdAssignments[aIdx].id,
          studentId: student.id,
          status: 'graded',
          marks: m,
          content: 'The solution contains the source code, design decisions, and unit test logs for verification. Handled all edge cases successfully.',
          submittedAt: new Date(today.getTime() - (aIdx + 1) * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  // Keep Arjun's specific submissions seeded manually
  await prisma.submission.create({
    data: {
      assignmentId: createdAssignments[3].id, // Socket programming (overdue/past)
      studentId: students[0].id,
      status: 'graded',
      marks: 87,
      feedback: 'Excellent work on TCP implementation. UDP section needs improvement.',
      content: 'Here is my complete source code for the TCP and UDP socket server/client. Tested on local interface. Handled concurrent clients via thread pool.'
    }
  });
  await prisma.submission.create({
    data: {
      assignmentId: createdAssignments[1].id, // Process scheduling
      studentId: students[0].id,
      status: 'submitted',
      content: 'Completed SJF, FCFS and Round Robin simulator code. Included visual bar graphs for execution timelines. Output matches theoretical computations.',
      submittedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000)
    }
  });
  await prisma.submission.create({
    data: {
      assignmentId: createdAssignments[0].id,
      studentId: students[0].id,
      status: 'submitted',
      content: 'AVL tree balance implementation with LL, RR, LR and RL rotations. Included performance comparisons under sorted insertions.',
      submittedAt: new Date(today.getTime() - 2 * 60 * 60 * 1000)
    }
  });

  // 8. Create Notices
  const notices = [
    { title: 'Mid-Semester Examination Schedule Released', content: 'The mid-semester examinations are scheduled from November 20–30, 2026. All students must carry their admit cards. No entry without ID. Practical exams will be held in respective labs as per timetable. Students are advised to report 15 minutes before their scheduled exam time.', priority: 'urgent', category: 'Examination' },
    { title: 'Annual Cultural Fest — TechNova 2026 Registration Open', content: 'Registrations for TechNova 2026 are now open. Events include hackathon, coding competition, robotics, and cultural performances. Register at technovafest.campus.edu before November 18. Cash prizes worth ₹5,00,000 to be won!', priority: 'high', category: 'Events' },
    { title: 'Library Working Hours Extended for Exam Season', content: 'The central library will remain open till 11:00 PM from November 15 to December 10, 2026. Digital library resources accessible 24/7. Additional reading rooms have been opened in Block C. Silent zone strictly enforced.', priority: 'medium', category: 'Facilities' },
    { title: 'Placement Drive — Google India Campus Visit', content: 'Google India will conduct on-campus recruitment on November 25, 2026. Roles: SWE, SRE, PM. Eligibility: 7.5+ CGPA, no backlogs, CS/IT branches only. Registration mandatory on placement portal by November 18.', priority: 'high', category: 'Placements' },
    { title: 'Campus Maintenance: Water Supply Interruption', content: 'Water supply will be interrupted in hostels A, B, C on November 13, 2026 from 9 AM to 2 PM due to pipeline maintenance. Students are advised to store sufficient water beforehand.', priority: 'medium', category: 'Facilities' },
  ];

  for (const n of notices) {
    await prisma.notice.create({
      data: {
        createdBy: adminUser.id,
        title: n.title,
        content: n.content,
        priority: n.priority,
        category: n.category
      }
    });
  }

  // 9. Seed Notes
  const notesData = [
    {
      title: 'Binary Trees & AVL — Complete Notes',
      subject: 'Data Structures',
      tags: JSON.stringify(['trees', 'AVL', 'algorithms']),
      shared: true,
      views: 234,
      content: `# Binary Trees\n\n## Introduction\nA binary tree is a hierarchical data structure where each node has at most two children.\n\n## AVL Trees\nSelf-balancing BST where difference between heights of left and right subtrees ≤ 1.\n\n### Rotations: LL, RR, LR, RL\n\n## Time Complexities\n| Operation | BST Avg | AVL |\n|-----------|---------|-----|\n| Search | O(log n) | O(log n) |\n| Insert | O(log n) | O(log n) |\n| Delete | O(log n) | O(log n) |`
    },
    {
      title: 'Process Scheduling — All Algorithms',
      subject: 'Operating Systems',
      tags: JSON.stringify(['scheduling', 'FCFS', 'SJF', 'CPU']),
      shared: true,
      views: 156,
      content: `# CPU Scheduling Algorithms\n\n## FCFS — First Come First Served\n- Non-preemptive, simple, convoy effect problem\n\n## SJF — Shortest Job First\n- Optimal for avg wait time, preemptive version: SRTF\n\n## Round Robin\n- Preemptive with time quantum, fair to all processes`
    },
    {
      title: 'ER Diagrams — Normalization Guide',
      subject: 'DBMS',
      tags: JSON.stringify(['ER', 'normalization', '3NF', 'BCNF']),
      shared: false,
      views: 89,
      content: `# Database Normalization\n\n## 1NF — Atomic values, no repeating groups\n## 2NF — 1NF + no partial dependencies\n## 3NF — 2NF + no transitive dependencies\n## BCNF — Stronger version of 3NF`
    },
    {
      title: 'TCP/IP Protocol Stack Explained',
      subject: 'Computer Networks',
      tags: JSON.stringify(['TCP', 'IP', 'OSI', 'protocols']),
      shared: true,
      views: 312,
      content: `# TCP/IP Model\n\n## Layers (Bottom to Top)\n1. Physical Layer — Bits\n2. Data Link — Frames, MAC\n3. Network — Packets, IP, routing\n4. Transport — TCP/UDP, ports\n5. Application — HTTP, DNS, SMTP`
    },
    {
      title: 'Software Design Patterns — GoF Patterns',
      subject: 'Software Engineering',
      tags: JSON.stringify(['design-patterns', 'GoF', 'singleton', 'factory']),
      shared: true,
      views: 67,
      content: `# GoF Design Patterns\n\n## Creational: Singleton, Factory, Builder\n## Structural: Adapter, Decorator, Facade\n## Behavioral: Observer, Strategy, Command`
    },
  ];

  // Assign notes to different users
  const noteAuthors = [adminUser.id, students[0].userId, students[1].userId, faculties[0].userId, students[2].userId];
  for (let i = 0; i < notesData.length; i++) {
    const n = notesData[i];
    await prisma.note.create({
      data: {
        createdBy: noteAuthors[i],
        title: n.title,
        subject: n.subject,
        tags: n.tags,
        shared: n.shared,
        views: n.views,
        content: n.content
      }
    });
  }

  console.log('MySQL Database successfully seeded with rich mock data!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
