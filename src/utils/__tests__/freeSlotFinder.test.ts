import { findFreeSlotsForDate } from '../freeSlotFinder';
import { Course, Exam, StudySession } from '../../types';

export function runFreeSlotFinderTests() {
  console.log("Running Free-Slot Finder Tests...");

  // Test 1: Empty day, full study window is returned
  const dateMonday = new Date(2026, 9, 5); // A Monday
  const slotsEmpty = findFreeSlotsForDate({
    date: dateMonday,
    studyWindow: { startHour: 16, startMinute: 0, endHour: 21, endMinute: 0 }
  });
  console.assert(slotsEmpty.length === 1, `Expected 1 slot, got ${slotsEmpty.length}`);
  console.assert(slotsEmpty[0].durationMinutes === 300, `Expected 300 minutes, got ${slotsEmpty[0].durationMinutes}`);

  // Test 2: Class from 17:00 to 18:30 splits study window into two slots
  const mockClass: Course = {
    id: 1,
    name: "CS101",
    lecturer: "Dr. Smith",
    room: "Room 1",
    colorIndex: 0,
    dayOfWeek: 1, // Monday
    startHour: 17,
    startMinute: 0,
    endHour: 18,
    endMinute: 30
  };

  const slotsWithClass = findFreeSlotsForDate({
    date: dateMonday,
    studyWindow: { startHour: 16, startMinute: 0, endHour: 21, endMinute: 0 },
    classes: [mockClass]
  });

  console.assert(slotsWithClass.length === 2, `Expected 2 slots, got ${slotsWithClass.length}`);
  // Slot 1: 16:00 to 17:00 (60 mins)
  console.assert(slotsWithClass[0].durationMinutes === 60, `Slot 1 expected 60m, got ${slotsWithClass[0].durationMinutes}`);
  // Slot 2: 18:30 to 21:00 (150 mins)
  console.assert(slotsWithClass[1].durationMinutes === 150, `Slot 2 expected 150m, got ${slotsWithClass[1].durationMinutes}`);

  // Test 3: Day off returns empty slots
  const slotsDayOff = findFreeSlotsForDate({
    date: dateMonday,
    studyWindow: { startHour: 16, startMinute: 0, endHour: 21, endMinute: 0 },
    daysOff: [1] // Monday is day off
  });
  console.assert(slotsDayOff.length === 0, `Expected 0 slots for day off, got ${slotsDayOff.length}`);

  // Test 4: Existing study session overlaps and gets subtracted
  const mockSession: StudySession = {
    id: 10,
    courseId: 1,
    courseName: "CS101",
    colorIndex: 0,
    dayOfWeek: 1,
    startHour: 19,
    startMinute: 0,
    durationMinutes: 60,
    completed: false,
    dateMillis: dateMonday.getTime()
  };

  const slotsWithStudy = findFreeSlotsForDate({
    date: dateMonday,
    studyWindow: { startHour: 16, startMinute: 0, endHour: 21, endMinute: 0 },
    classes: [mockClass],
    studySessions: [mockSession]
  });

  // Expected:
  // 16:00 - 17:00 (60m)
  // 18:30 - 19:00 (30m)
  // 20:00 - 21:00 (60m)
  console.assert(slotsWithStudy.length === 3, `Expected 3 slots, got ${slotsWithStudy.length}`);
  console.assert(slotsWithStudy[0].durationMinutes === 60, `Slot 1: expected 60, got ${slotsWithStudy[0].durationMinutes}`);
  console.assert(slotsWithStudy[1].durationMinutes === 30, `Slot 2: expected 30, got ${slotsWithStudy[1].durationMinutes}`);
  console.assert(slotsWithStudy[2].durationMinutes === 60, `Slot 3: expected 60, got ${slotsWithStudy[2].durationMinutes}`);

  console.log("All Free-Slot Finder Tests Passed! ✅");
}
