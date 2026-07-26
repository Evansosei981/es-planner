package com.example.evansunischeduler.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.evansunischeduler.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.ExperimentalCoroutinesApi
import java.util.Calendar
import android.content.Context

class AppViewModel(application: Application) : AndroidViewModel(application) {
    private val db = AppDatabase.getInstance(application)
    private val repository = ScheduleRepository(
        db.courseDao(),
        db.studySessionDao(),
        db.weeklyGoalDao(),
        db.userProfileDao(),
        db.learningNoteDao(),
        db.examDao()
    )

    val allCourses: StateFlow<List<Course>> = repository.allCourses
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allSessions: StateFlow<List<StudySession>> = repository.allSessions
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allNotes: StateFlow<List<LearningNote>> = repository.allNotes
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val currentTimeFlow = flow {
        while (true) {
            emit(System.currentTimeMillis())
            kotlinx.coroutines.delay(60000) // Update every minute
        }
    }

    val upcomingExams: StateFlow<List<Exam>> = combine(repository.allExams, currentTimeFlow) { exams, time ->
        exams.filter { it.timestampMillis >= time - 86400000 }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val totalStudyMinutes: StateFlow<Int> = repository.totalStudyMinutes
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val courseStats: StateFlow<List<CourseStudyStats>> = repository.studyStatsPerCourse
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val weeklyGoalHours: StateFlow<Float> = repository.weeklyGoal
        .map { it?.targetHoursPerWeek ?: 20f }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 20f)

    val completedSessionsCount: StateFlow<Int> = repository.getCompletedSessions()
        .map { it.size }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    private val currentDayOfWeekFlow = flow {
        while (true) {
            val cal = Calendar.getInstance()
            val javaDow = cal.get(Calendar.DAY_OF_WEEK)
            val dow = if (javaDow == Calendar.SUNDAY) 7 else javaDow - 1
            emit(dow)
            kotlinx.coroutines.delay(60000)
        }
    }.distinctUntilChanged()

    @OptIn(ExperimentalCoroutinesApi::class)
    val todaySchedule: StateFlow<List<ScheduleItem>> = currentDayOfWeekFlow
        .flatMapLatest { dow -> repository.getScheduleForDay(dow) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val notificationScheduler = com.example.evansunischeduler.notifications.NotificationScheduler(application)

    fun addCourse(course: Course) {
        viewModelScope.launch { 
            val id = repository.insertCourse(course) 
            notificationScheduler.scheduleCourseNotification(course.copy(id = id), notificationMinutes.value)
        }
    }

    fun deleteCourse(course: Course) {
        viewModelScope.launch { 
            repository.deleteCourse(course) 
            notificationScheduler.cancelCourseNotification(course)
        }
    }

    fun addStudySession(session: StudySession) {
        viewModelScope.launch { 
            val id = repository.insertSession(session) 
            notificationScheduler.scheduleStudySessionNotification(session.copy(id = id), notificationMinutes.value)
        }
    }

    fun toggleSessionComplete(session: StudySession) {
        viewModelScope.launch { repository.updateSession(session.copy(completed = !session.completed)) }
    }

    fun deleteStudySession(session: StudySession) {
        viewModelScope.launch { 
            repository.deleteSession(session) 
            notificationScheduler.cancelStudySessionNotification(session)
        }
    }

    fun addLearningNote(note: LearningNote) {
        viewModelScope.launch { repository.insertNote(note) }
    }

    fun deleteLearningNote(note: LearningNote) {
        viewModelScope.launch { repository.deleteNote(note) }
    }

    fun addExam(exam: Exam) {
        viewModelScope.launch { 
            val id = repository.insertExam(exam) 
            notificationScheduler.scheduleExamNotification(exam.copy(id = id), notificationMinutes.value)
        }
    }

    fun deleteExam(exam: Exam) {
        viewModelScope.launch { 
            repository.deleteExam(exam) 
            notificationScheduler.cancelExamNotification(exam)
        }
    }

    fun setWeeklyGoal(hours: Float) {
        viewModelScope.launch { repository.setWeeklyGoal(WeeklyGoal(targetHoursPerWeek = hours)) }
    }

    val userName: StateFlow<String> = repository.userProfile
        .map { it?.name ?: "" }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")

    val userMajor: StateFlow<String> = repository.userProfile
        .map { it?.major ?: "" }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")

    val notificationMinutes: StateFlow<Int> = repository.userProfile
        .map { it?.notificationMinutes ?: 10 }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 10)

    val hasCompletedOnboarding: StateFlow<Boolean?> = repository.userProfile
        .map { it?.hasCompletedOnboarding ?: false }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val themePreference: StateFlow<String> = repository.userProfile
        .map { it?.themePreference ?: "SYSTEM" }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "SYSTEM")

    val voiceReminderType: StateFlow<String> = repository.userProfile
        .map { it?.voiceReminderType ?: "STANDARD" }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "STANDARD")

    val customVoiceFilePath: StateFlow<String?> = repository.userProfile
        .map { it?.customVoiceFilePath }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val profileImagePath: StateFlow<String?> = repository.userProfile
        .map { it?.profileImagePath }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    fun setUserName(name: String) {
        viewModelScope.launch { 
            val current = repository.userProfile.firstOrNull() ?: UserProfile()
            repository.setProfile(current.copy(name = name)) 
        }
    }

    fun setNotificationMinutes(minutes: Int) {
        viewModelScope.launch { 
            val current = repository.userProfile.firstOrNull() ?: UserProfile()
            repository.setProfile(current.copy(notificationMinutes = minutes)) 
            
            // Reschedule existing events with new timing
            repository.allCourses.firstOrNull()?.forEach { course ->
                notificationScheduler.scheduleCourseNotification(course, minutes)
            }
            repository.allSessions.firstOrNull()?.forEach { session ->
                notificationScheduler.scheduleStudySessionNotification(session, minutes)
            }
            repository.allExams.firstOrNull()?.forEach { exam ->
                notificationScheduler.scheduleExamNotification(exam, minutes)
            }
        }
    }

    fun completeOnboarding(name: String, major: String, notificationMins: Int) {
        viewModelScope.launch {
            val current = repository.userProfile.firstOrNull() ?: UserProfile()
            repository.setProfile(
                current.copy(
                    name = name,
                    major = major,
                    notificationMinutes = notificationMins,
                    hasCompletedOnboarding = true
                )
            )
        }
    }

    fun setThemePreference(theme: String) {
        viewModelScope.launch {
            val current = repository.userProfile.firstOrNull() ?: UserProfile()
            repository.setProfile(current.copy(themePreference = theme))
        }
    }

    fun setVoiceReminderType(type: String) {
        viewModelScope.launch {
            val current = repository.userProfile.firstOrNull() ?: UserProfile()
            repository.setProfile(current.copy(voiceReminderType = type))
            val prefs = getApplication<Application>().getSharedPreferences("evans_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("voice_type", type).apply()
        }
    }

    fun setCustomVoiceFilePath(path: String?) {
        viewModelScope.launch {
            val current = repository.userProfile.firstOrNull() ?: UserProfile()
            repository.setProfile(current.copy(customVoiceFilePath = path))
            val prefs = getApplication<Application>().getSharedPreferences("evans_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("custom_voice_path", path).apply()
        }
    }

    fun setProfileImagePath(path: String?) {
        viewModelScope.launch {
            val current = repository.userProfile.firstOrNull() ?: UserProfile()
            repository.setProfile(current.copy(profileImagePath = path))
        }
    }
}
