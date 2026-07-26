package com.example.evansunischeduler.ui.ai

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import android.widget.TextView
import io.noties.markwon.Markwon

import kotlinx.coroutines.launch
import com.example.evansunischeduler.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NativeAiChatScreen(viewModel: GeminiViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val messages by viewModel.messages.collectAsState()
    val isGenerating by viewModel.isGenerating.collectAsState()
    val sessions by viewModel.allSessions.collectAsState()
    val currentSessionId by viewModel.currentSessionId.collectAsState()
    
    val context = androidx.compose.ui.platform.LocalContext.current
    val markwon = remember {
        Markwon.builder(context).build()
    }
    
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)

    // Auto-scroll to bottom when messages change
    LaunchedEffect(messages.size, isGenerating) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                modifier = Modifier.width(300.dp),
                drawerContainerColor = Color(0xFF1E1E1E)
            ) {
                Spacer(Modifier.height(16.dp))
                Text(
                    "Evans AI History",
                    modifier = Modifier.padding(16.dp),
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                HorizontalDivider(color = Color.DarkGray)
                
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    items(sessions) { session ->
                        NavigationDrawerItem(
                            label = { 
                                Text(
                                    session.title, 
                                    maxLines = 1, 
                                    overflow = TextOverflow.Ellipsis,
                                    color = Color.White
                                ) 
                            },
                            selected = session.id == currentSessionId,
                            onClick = {
                                viewModel.loadSession(session.id)
                                coroutineScope.launch { drawerState.close() }
                            },
                            badge = {
                                IconButton(onClick = { viewModel.deleteSession(session.id) }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.Gray)
                                }
                            },
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            colors = NavigationDrawerItemDefaults.colors(
                                unselectedContainerColor = Color.Transparent,
                                selectedContainerColor = Color(0xFF2F2F2F)
                            )
                        )
                    }
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            "Evans AI",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { coroutineScope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu", tint = Color.White)
                        }
                    },
                    actions = {
                        IconButton(onClick = { viewModel.createNewSession() }) {
                            Icon(Icons.Default.Add, contentDescription = "New Chat", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFF1E1E1E)
                    )
                )
            },
            containerColor = Color(0xFF1E1E1E)
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Chat Area
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    if (messages.isEmpty()) {
                        item {
                            Box(modifier = Modifier.fillParentMaxSize(), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.assistant_avatar),
                                        contentDescription = "Evans AI",
                                        modifier = Modifier
                                            .size(80.dp)
                                            .clip(CircleShape)
                                            .background(Color(0xFF10a37f)),
                                        tint = Color.Unspecified
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    Text(
                                        text = "Evans AI",
                                        color = Color.White.copy(alpha = 0.5f),
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    items(messages) { message ->
                        ChatBubble(message = message, markwon = markwon)
                    }
                }

                // Input Area
                Surface(
                    color = Color(0xFF212121),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .background(Color(0xFF2F2F2F), RoundedCornerShape(24.dp))
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            placeholder = { Text("Message Evans...", color = Color(0xFF9B9B9B)) },
                            modifier = Modifier.weight(1f),
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = Color.Transparent,
                                unfocusedContainerColor = Color.Transparent,
                                disabledContainerColor = Color.Transparent,
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            ),
                            maxLines = 4
                        )
                        
                        IconButton(
                            onClick = {
                                if (inputText.isNotBlank() && !isGenerating) {
                                    viewModel.sendMessage(inputText)
                                    inputText = ""
                                }
                            },
                            enabled = inputText.isNotBlank() && !isGenerating,
                            modifier = Modifier
                                .size(40.dp)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Send,
                                contentDescription = "Send",
                                tint = if (inputText.isNotBlank() && !isGenerating) Color.White else Color.Gray,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ChatBubble(message: ChatMessage, markwon: Markwon) {
    val isUser = message.isUser
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        if (!isUser) {
            Icon(
                painter = painterResource(id = R.drawable.assistant_avatar),
                contentDescription = "Evans",
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF10a37f)),
                tint = Color.Unspecified
            )
            Spacer(modifier = Modifier.width(12.dp))
        }
        
        Box(
            modifier = Modifier
                .weight(1f, fill = false)
                .background(
                    color = if (isUser) Color(0xFF2F2F2F) else Color.Transparent,
                    shape = RoundedCornerShape(20.dp)
                )
                .padding(if (isUser) 16.dp else 0.dp)
        ) {
            if (message.isLoading) {
                // Typing Indicator
                com.example.evansunischeduler.ui.components.TypingIndicator(modifier = Modifier.padding(top = 4.dp))
            } else if (message.isStreaming && !isUser) {
                // Fast path for streaming to prevent Markdown parsing UI thread stutters
                Text(
                    text = message.text,
                    color = Color(0xFFECECF1),
                    fontSize = 16.sp,
                    modifier = Modifier.padding(4.dp)
                )
            } else {
                AndroidView(
                    factory = { ctx ->
                        TextView(ctx).apply {
                            setTextColor(android.graphics.Color.parseColor("#ECECF1"))
                            textSize = 16f
                        }
                    },
                    update = { view ->
                        try {
                            markwon.setMarkdown(view, message.text)
                        } catch (t: Throwable) {
                            view.text = "Error rendering markdown: ${t.message}"
                        }
                    }
                )
            }
        }
    }
}
