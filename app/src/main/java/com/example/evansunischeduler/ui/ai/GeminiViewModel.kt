package com.example.evansunischeduler.ui.ai

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.evansunischeduler.BuildConfig
import com.example.evansunischeduler.data.AiChatDao
import com.example.evansunischeduler.data.AiChatMessage
import com.example.evansunischeduler.data.AiChatSession
import com.example.evansunischeduler.data.AppDatabase
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class ChatMessage(
    val text: String,
    val isUser: Boolean,
    val isError: Boolean = false,
    val isLoading: Boolean = false,
    val isStreaming: Boolean = false
)

class GeminiViewModel(application: Application) : AndroidViewModel(application) {

    private val chatDao: AiChatDao = AppDatabase.getInstance(application).aiChatDao()
    
    val allSessions: StateFlow<List<AiChatSession>> = chatDao.getAllSessions()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    private val _currentSessionId = MutableStateFlow<Long?>(null)
    val currentSessionId: StateFlow<Long?> = _currentSessionId.asStateFlow()

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _isGenerating = MutableStateFlow(false)
    val isGenerating: StateFlow<Boolean> = _isGenerating.asStateFlow()

    private val generativeModel = GenerativeModel(
        modelName = "gemini-flash-latest",
        apiKey = BuildConfig.GEMINI_API_KEY,
        systemInstruction = content {
            text("You are Evans, a highly intelligent, friendly, and professional personal assistant. You are world-class at mathematics and logic. When solving math problems, ALWAYS break them down step-by-step. CRITICAL RULES: Never break character. Never say 'As an AI language model'. Never apologize for your limitations. Always be confident and helpful. IMPORTANT MATH RULE: Do NOT use LaTeX for math. Android native UI does not support LaTeX. Use standard Unicode characters (like x², √, ∑, ÷, ≈) and standard Markdown for all math equations.")
        }
    )

    private var chat = generativeModel.startChat()
    private var loadJob: Job? = null
    private var isInitialized = false

    init {
        // Sequentially initialize the database session to avoid race conditions
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val sessions = chatDao.getAllSessions().first()
                if (sessions.isEmpty()) {
                    val newSession = AiChatSession(title = "New Chat")
                    val id = chatDao.insertSession(newSession)
                    loadSessionInternal(id)
                } else {
                    loadSessionInternal(sessions.first().id)
                }
                isInitialized = true
            } catch (t: Throwable) {
                // If database completely fails to read, fallback to empty in-memory state
                isInitialized = true
                _messages.value = listOf(ChatMessage(text = "Database error: ${t.message}", isUser = false, isError = true))
            }
        }
    }
    
    fun createNewSession() {
        if (!isInitialized || _isGenerating.value) return
        loadJob?.cancel()
        loadJob = viewModelScope.launch(Dispatchers.IO) {
            val newSession = AiChatSession(title = "New Chat")
            val id = chatDao.insertSession(newSession)
            loadSessionInternal(id)
        }
    }

    fun loadSession(sessionId: Long) {
        if (!isInitialized) return
        loadSessionInternal(sessionId)
    }

    private fun loadSessionInternal(sessionId: Long) {
        // Cancel any pending load operation to prevent overlapping State updates
        loadJob?.cancel()
        loadJob = viewModelScope.launch(Dispatchers.IO) {
          try {
            _currentSessionId.value = sessionId
            val dbMsgs = chatDao.getMessagesForSession(sessionId).first()
            
            // Reconstruct Google AI Chat History
            val history = dbMsgs.map { 
                content(if (it.isUser) "user" else "model") { text(it.text) }
            }
            
            try {
                // Ensure history is completely valid (no trailing user messages)
                var validHistory = history
                while (validHistory.isNotEmpty() && validHistory.last().role == "user") {
                    validHistory = validHistory.dropLast(1)
                }
                chat = generativeModel.startChat(validHistory)
            } catch (e: Exception) {
                // If history is still corrupted (e.g. multiple consecutive user messages), fallback to empty
                chat = generativeModel.startChat()
            }
            
            // Update UI state after history is parsed
            _messages.value = dbMsgs.map { ChatMessage(text = it.text, isUser = it.isUser) }
        } catch (t: Throwable) {
            _messages.value = listOf(ChatMessage(text = "Failed to load session: ${t.message}", isUser = false, isError = true))
        }
        }
    }

    fun deleteSession(sessionId: Long) {
        viewModelScope.launch(Dispatchers.IO) {
            chatDao.deleteMessagesForSession(sessionId)
            chatDao.deleteSession(sessionId)
            if (_currentSessionId.value == sessionId) {
                // Load another session if available, otherwise clear
                val remaining = chatDao.getAllSessions().first()
                if (remaining.isNotEmpty()) {
                    loadSessionInternal(remaining.first().id)
                } else {
                    _currentSessionId.value = null
                    _messages.value = emptyList()
                    chat = generativeModel.startChat()
                }
            }
        }
    }

    fun sendMessage(prompt: String) {
        val sessionId = _currentSessionId.value ?: return

        viewModelScope.launch(Dispatchers.IO) {
            try {
                // Add user message to UI immediately
                val userMsg = ChatMessage(text = prompt, isUser = true)
                _messages.value = _messages.value + userMsg
                _isGenerating.value = true
                
                // Save user message to DB
                chatDao.insertMessage(AiChatMessage(sessionId = sessionId, text = prompt, isUser = true))

                // Add loading indicator
                val loadingMsg = ChatMessage(text = "...", isUser = false, isLoading = true)
                _messages.value = _messages.value + loadingMsg

                var responseText = ""
                var lastUpdateTime = System.currentTimeMillis()
                
                chat.sendMessageStream(prompt).collect { chunk ->
                    responseText += chunk.text ?: ""
                    
                    // DEBOUNCE UI UPDATES: Only update the UI every 150ms to prevent heavy Markdown rendering stutters
                    val currentTime = System.currentTimeMillis()
                    if (currentTime - lastUpdateTime > 150) {
                        _messages.value = _messages.value.dropLast(1) + ChatMessage(text = responseText, isUser = false, isStreaming = true)
                        lastUpdateTime = currentTime
                    }
                }
                
                // Ensure the final complete response is flushed to the UI
                _messages.value = _messages.value.dropLast(1) + ChatMessage(text = responseText, isUser = false)
                
                // Save model message to DB
                chatDao.insertMessage(AiChatMessage(sessionId = sessionId, text = responseText, isUser = false))
                
                // Update session title if it's the first message
                val session = chatDao.getAllSessions().first().find { it.id == sessionId }
                if (session != null && session.title == "New Chat") {
                    val title = if (prompt.length > 20) prompt.take(20) + "..." else prompt
                    chatDao.insertSession(session.copy(title = title))
                }
            } catch (t: Throwable) {
                // Remove loading message if present
                if (_messages.value.lastOrNull()?.isLoading == true) {
                    _messages.value = _messages.value.dropLast(1)
                }
                
                _messages.value = _messages.value + ChatMessage(
                    text = "CRASH CAUGHT: ${t.javaClass.simpleName} - ${t.localizedMessage}\n${t.stackTraceToString().take(500)}",
                    isUser = false,
                    isError = true
                )
            } finally {
                _isGenerating.value = false
            }
        }
    }
}
