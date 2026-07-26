package com.example.evansunischeduler.data

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "study_sessions",
    foreignKeys = [
        ForeignKey(
            entity = Course::class,
            parentColumns = ["id"],
            childColumns = ["courseId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("courseId"),
        Index("dayOfWeek")
    ]
)
data class StudySession(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val courseId: Long,
    val courseName: String,
    val colorIndex: Int = 0,
    val dayOfWeek: Int,
    val startHour: Int,
    val startMinute: Int,
    val durationMinutes: Int,
    val completed: Boolean = false,
    val dateMillis: Long = System.currentTimeMillis()
)
