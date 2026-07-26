package com.example.evansunischeduler.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "learning_notes")
data class LearningNote(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val relatedId: Long, // Course ID or StudySession ID
    val type: String, // "COURSE" or "STUDY_SESSION"
    val title: String,
    val content: String,
    val videoUri: String? = null,
    val dateMillis: Long = System.currentTimeMillis()
)
