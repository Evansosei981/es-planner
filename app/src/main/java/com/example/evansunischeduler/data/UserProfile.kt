package com.example.evansunischeduler.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_profile")
data class UserProfile(
    @PrimaryKey val id: Int = 1,
    val name: String = "",
    val major: String = "",
    val notificationMinutes: Int = 10,
    val themePreference: String = "SYSTEM",
    val hasCompletedOnboarding: Boolean = false,
    val voiceReminderType: String = "STANDARD",
    val customVoiceFilePath: String? = null,
    val profileImagePath: String? = null
)
