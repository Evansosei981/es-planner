package com.example.evansunischeduler.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "weekly_goals")
data class WeeklyGoal(
    @PrimaryKey val id: Int = 1,
    val targetHoursPerWeek: Float = 20f
)
