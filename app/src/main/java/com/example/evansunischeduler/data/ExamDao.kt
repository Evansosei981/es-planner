package com.example.evansunischeduler.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ExamDao {
    @Query("SELECT * FROM exams ORDER BY timestampMillis ASC")
    fun getAllExams(): Flow<List<Exam>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExam(exam: Exam): Long

    @Delete
    suspend fun deleteExam(exam: Exam)
}
