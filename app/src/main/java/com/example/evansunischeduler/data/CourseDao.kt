package com.example.evansunischeduler.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface CourseDao {
    @Query("SELECT * FROM courses ORDER BY dayOfWeek, startHour, startMinute")
    fun getAllCourses(): Flow<List<Course>>

    @Query("SELECT * FROM courses WHERE dayOfWeek = :dayOfWeek ORDER BY startHour, startMinute")
    fun getCoursesByDay(dayOfWeek: Int): Flow<List<Course>>

    @Query("SELECT * FROM courses WHERE id = :id")
    suspend fun getCourseById(id: Long): Course?

    @Insert
    suspend fun insertCourse(course: Course): Long

    @Update
    suspend fun updateCourse(course: Course)

    @Delete
    suspend fun deleteCourse(course: Course)

    @Query("DELETE FROM courses WHERE id = :id")
    suspend fun deleteCourseById(id: Long)
}
