import type { TeacherDashboardSummary } from "./teacher-dashboard.types";

/**
 * NOTE: This currently returns mock data since the backend endpoint
 * `/teacher/dashboard` does not exist yet.
 * When the backend endpoint is available, replace the mock implementation
 * with a real API call.
 */
async function getTeacherDashboardSummary(): Promise<TeacherDashboardSummary> {
  // TODO: Replace with real API call when backend endpoint is ready
  // const response = await clientApi.get<GetTeacherDashboardResponse>(
  //   "/teacher/dashboard",
  // );
  // return response.data.data;

  // Mock data for development
  return getMockTeacherDashboardSummary();
}

function getMockTeacherDashboardSummary(): TeacherDashboardSummary {
  const now = new Date();
  const currentHour = now.getHours();
  const upcomingStart = new Date(now);
  upcomingStart.setMinutes(now.getMinutes() + 10);
  const upcomingEnd = new Date(upcomingStart);
  upcomingEnd.setMinutes(upcomingStart.getMinutes() + 70);
  const completedStart = new Date(now);
  completedStart.setMinutes(now.getMinutes() - 120);
  const completedEnd = new Date(completedStart);
  completedEnd.setMinutes(completedStart.getMinutes() + 60);
  const formatTime = (date: Date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes(),
    ).padStart(2, "0")}`;

  return {
    todaySchedule: [
      {
        id: "schedule-completed",
        classId: "class-4",
        className: "X IPA 2",
        classSubjectId: "cs-4",
        subjectId: "subject-2",
        subjectName: "Kimia",
        dayOfWeek: now.getDay() === 0 ? 1 : now.getDay(),
        startTime: formatTime(completedStart),
        endTime: formatTime(completedEnd),
        sessionId: "session-completed",
        sessionStatus: "completed",
      },
      {
        id: "schedule-0",
        classId: "class-0",
        className: "X IPA 3",
        classSubjectId: "cs-0",
        subjectId: "subject-0",
        subjectName: "Fisika",
        dayOfWeek: now.getDay() === 0 ? 1 : now.getDay(),
        startTime: formatTime(upcomingStart),
        endTime: formatTime(upcomingEnd),
        sessionId: null,
        sessionStatus: null,
      },
      {
        id: "schedule-1",
        classId: "class-1",
        className: "XI IPA 1",
        classSubjectId: "cs-1",
        subjectId: "subject-1",
        subjectName: "Matematika",
        dayOfWeek: now.getDay() === 0 ? 1 : now.getDay(),
        startTime: "06:50",
        endTime: "09:00",
        sessionId: currentHour >= 9 ? "session-1" : null,
        sessionStatus: currentHour >= 9 ? "completed" : null,
      },
      {
        id: "schedule-2",
        classId: "class-2",
        className: "XI IPA 2",
        classSubjectId: "cs-2",
        subjectId: "subject-1",
        subjectName: "Matematika",
        dayOfWeek: now.getDay() === 0 ? 1 : now.getDay(),
        startTime: "09:15",
        endTime: "10:45",
        sessionId: currentHour >= 9 && currentHour < 11 ? "session-2" : null,
        sessionStatus:
          currentHour >= 9 && currentHour < 11 ? "in_progress" : null,
      },
      {
        id: "schedule-3",
        classId: "class-3",
        className: "XII IPA 1",
        classSubjectId: "cs-3",
        subjectId: "subject-1",
        subjectName: "Matematika",
        dayOfWeek: now.getDay() === 0 ? 1 : now.getDay(),
        startTime: "13:00",
        endTime: "14:30",
        sessionId: null,
        sessionStatus: null,
      },
    ],
    attendanceSummary: {
      present: 87,
      excused: 5,
      sick: 3,
      absent: 2,
      total: 97,
    },
    gradingProgress: [
      {
        classSubjectId: "cs-1",
        classId: "class-1",
        className: "XI IPA 1",
        subjectId: "subject-1",
        subjectName: "Matematika",
        totalComponents: 4,
        completedComponents: 3,
        percentComplete: 75,
        isLocked: false,
      },
      {
        classSubjectId: "cs-2",
        classId: "class-2",
        className: "XI IPA 2",
        subjectId: "subject-1",
        subjectName: "Matematika",
        totalComponents: 4,
        completedComponents: 2,
        percentComplete: 50,
        isLocked: false,
      },
      {
        classSubjectId: "cs-3",
        classId: "class-3",
        className: "XII IPA 1",
        subjectId: "subject-1",
        subjectName: "Matematika",
        totalComponents: 4,
        completedComponents: 4,
        percentComplete: 100,
        isLocked: true,
      },
    ],
    pendingTasks: [
      {
        id: "task-1",
        type: "missing_attendance",
        title: "Absensi belum diisi",
        description: "Sesi 15 Januari 2026 belum memiliki data kehadiran",
        classId: "class-2",
        className: "XI IPA 2",
        subjectId: "subject-1",
        subjectName: "Matematika",
        dueDate: null,
        link: "/dashboard/teacher/classes/attendance",
      },
      {
        id: "task-2",
        type: "ungraded_component",
        title: "Nilai UTS belum diinput",
        description: "Komponen UTS untuk kelas XI IPA 1 belum lengkap",
        classId: "class-1",
        className: "XI IPA 1",
        subjectId: "subject-1",
        subjectName: "Matematika",
        dueDate: "2026-01-25",
        link: "/dashboard/teacher/assessments",
      },
      {
        id: "task-3",
        type: "draft_description",
        title: "Deskripsi rapor belum selesai",
        description: "2 siswa belum memiliki deskripsi naratif",
        classId: "class-1",
        className: "XI IPA 1",
        subjectId: "subject-1",
        subjectName: "Matematika",
        dueDate: "2026-01-31",
        link: "/dashboard/teacher/assessments/recap",
      },
    ],
    academicPeriod: {
      id: "period-1",
      name: "Semester 1",
      academicYearLabel: "2025/2026",
    },
  };
}

export { getTeacherDashboardSummary };
