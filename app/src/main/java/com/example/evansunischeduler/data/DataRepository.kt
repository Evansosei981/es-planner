package com.example.evansunischeduler.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map

class ScheduleRepository(
    private val courseDao: CourseDao,
    private val studySessionDao: StudySessionDao,
    private val weeklyGoalDao: WeeklyGoalDao,
    private val userProfileDao: UserProfileDao,
    private val learningNoteDao: LearningNoteDao,
    private val examDao: ExamDao
) {
    val allNotes: Flow<List<LearningNote>> = learningNoteDao.getAllNotes()
    val allExams: Flow<List<Exam>> = examDao.getAllExams()
    val allCourses: Flow<List<Course>> = courseDao.getAllCourses()
    val allSessions: Flow<List<StudySession>> = studySessionDao.getAllSessions()
    val totalStudyMinutes: Flow<Int> = studySessionDao.getTotalStudyMinutes().map { it ?: 0 }
    val studyStatsPerCourse: Flow<List<CourseStudyStats>> = studySessionDao.getStudyMinutesPerCourse()
    val weeklyGoal: Flow<WeeklyGoal?> = weeklyGoalDao.getGoal()
    val userProfile: Flow<UserProfile?> = userProfileDao.getProfile()

    fun getCoursesByDay(dayOfWeek: Int): Flow<List<Course>> = courseDao.getCoursesByDay(dayOfWeek)
    fun getSessionsByDay(dayOfWeek: Int): Flow<List<StudySession>> = studySessionDao.getSessionsByDay(dayOfWeek)

    fun getScheduleForDay(dayOfWeek: Int): Flow<List<ScheduleItem>> {
        return combine(
            getCoursesByDay(dayOfWeek),
            getSessionsByDay(dayOfWeek)
        ) { courses, sessions ->
            val items = mutableListOf<ScheduleItem>()
            courses.forEach { items.add(ScheduleItem.ClassItem(it)) }
            sessions.forEach { items.add(ScheduleItem.StudyItem(it)) }
            items.sortedBy { it.startHour * 60 + it.startMinute }
        }
    }

    suspend fun insertCourse(course: Course): Long = courseDao.insertCourse(course)
    suspend fun updateCourse(course: Course) = courseDao.updateCourse(course)
    suspend fun deleteCourse(course: Course) = courseDao.deleteCourse(course)
    suspend fun getCourseById(id: Long): Course? = courseDao.getCourseById(id)

    suspend fun insertSession(session: StudySession): Long = studySessionDao.insertSession(session)
    suspend fun updateSession(session: StudySession) = studySessionDao.updateSession(session)
    suspend fun deleteSession(session: StudySession) = studySessionDao.deleteSession(session)

    suspend fun setWeeklyGoal(goal: WeeklyGoal) = weeklyGoalDao.setGoal(goal)
    suspend fun setProfile(profile: UserProfile) = userProfileDao.setProfile(profile)

    suspend fun insertNote(note: LearningNote): Long = learningNoteDao.insertNote(note)
    suspend fun deleteNote(note: LearningNote) = learningNoteDao.deleteNote(note)


    fun getCompletedSessions(): Flow<List<StudySession>> = studySessionDao.getCompletedSessions()
    suspend fun insertExam(exam: Exam): Long = examDao.insertExam(exam)
    suspend fun deleteExam(exam: Exam) = examDao.deleteExam(exam)
}

sealed class ScheduleItem {
    abstract val startHour: Int
    abstract val startMinute: Int

    data class ClassItem(val course: Course) : ScheduleItem() {
        override val startHour: Int = course.startHour
        override val startMinute: Int = course.startMinute
    }

    data class StudyItem(val session: StudySession) : ScheduleItem() {
        override val startHour: Int = session.startHour
        override val startMinute: Int = session.startMinute
    }
}
