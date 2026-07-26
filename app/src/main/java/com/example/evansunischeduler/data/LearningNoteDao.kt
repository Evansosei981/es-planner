package com.example.evansunischeduler.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface LearningNoteDao {
    @Query("SELECT * FROM learning_notes ORDER BY dateMillis DESC")
    fun getAllNotes(): Flow<List<LearningNote>>

    @Insert
    suspend fun insertNote(note: LearningNote): Long

    @Delete
    suspend fun deleteNote(note: LearningNote)
}
