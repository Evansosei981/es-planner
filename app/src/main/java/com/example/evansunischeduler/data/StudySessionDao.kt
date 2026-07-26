package com.example.evansunischeduler.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface StudySessionDao {
    @Query("SELECT * FROM study_sessions ORDER BY dayOfWeek, startHour, startMinute")
    fun getAllSessions(): Flow<List<StudySession>>

    @Query("SELECT * FROM study_sessions WHERE dayOfWeek = :dayOfWeek ORDER BY startHour, startMinute")
    fun getSessionsByDay(dayOfWeek: Int): Flow<List<StudySession>>

    @Query("SELECT * FROM study_sessions WHERE completed = 1")
    fun getCompletedSessions(): Flow<List<StudySession>>

    @Query("SELECT SUM(durationMinutes) FROM study_sessions WHERE completed = 1")
    fun getTotalStudyMinutes(): Flow<Int?>

    @Query("SELECT SUM(durationMinutes) FROM study_sessions WHERE completed = 1 AND courseId = :courseId")
    fun getStudyMinutesForCourse(courseId: Long): Flow<Int?>

    @Query("""
        SELECT c.name as courseName, c.id as courseId, c.colorIndex, COALESCE(SUM(s.durationMinutes), 0) as totalMinutes 
        FROM courses c 
        INNER JOIN study_sessions s ON c.id = s.courseId 
        WHERE s.completed = 1 
        GROUP BY c.id
    """)
    fun getStudyMinutesPerCourse(): Flow<List<CourseStudyStats>>

    @Insert
    suspend fun insertSession(session: StudySession): Long

    @Update
    suspend fun updateSession(session: StudySession)

    @Delete
    suspend fun deleteSession(session: StudySession)
}

data class CourseStudyStats(
    val courseName: String,
    val courseId: Long,
    val colorIndex: Int,
    val totalMinutes: Int
)
