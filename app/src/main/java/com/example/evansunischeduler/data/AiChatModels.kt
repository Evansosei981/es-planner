package com.example.evansunischeduler.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "ai_chat_sessions")
data class AiChatSession(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "ai_chat_messages")
data class AiChatMessage(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sessionId: Long,
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)
