package com.example.evansunischeduler.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "exams")
data class Exam(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val courseName: String,
    val examTitle: String, // e.g., "Mid Sem", "Final", "Quiz 1"
    val timestampMillis: Long, // exact date and time of the exam
    val colorIndex: Int = 0
)
