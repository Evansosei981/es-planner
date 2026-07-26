package com.example.evansunischeduler.ui.profile

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.evansunischeduler.theme.*
import com.example.evansunischeduler.ui.components.glassCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    currentName: String,
    currentNotificationMinutes: Int,
    currentTheme: String,
    currentVoiceType: String,
    currentCustomVoicePath: String?,
    currentProfileImagePath: String?,
    onSaveProfile: (String, Int) -> Unit,
    onThemeChange: (String) -> Unit,
    onVoiceTypeChange: (String) -> Unit,
    onCustomVoiceRecorded: (String) -> Unit,
    onProfileImageSelected: (String) -> Unit,
    onNavigateBack: () -> Unit,
    onAdminLogin: () -> Unit,
    modifier: Modifier = Modifier
) {
    var name by remember { mutableStateOf(currentName) }
    var notificationMins by remember { mutableFloatStateOf(currentNotificationMinutes.toFloat()) }
    
    LaunchedEffect(currentName, currentNotificationMinutes) {
        if (name.isBlank() && currentName.isNotBlank()) name = currentName
        // If it's still the default 10, and DB loaded a different value, sync it
        if (notificationMins == 10f && currentNotificationMinutes != 10) notificationMins = currentNotificationMinutes.toFloat()
    }
    var showTutorialState by remember { mutableStateOf(false) }
    var adminTaps by remember { mutableIntStateOf(0) }

    val currentNameState by rememberUpdatedState(name)
    val currentMinsState by rememberUpdatedState(notificationMins)

    DisposableEffect(Unit) {
        onDispose {
            onSaveProfile(currentNameState, currentMinsState.toInt())
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Scaffold(
            topBar = {
            TopAppBar(
                title = { Text("Profile & Settings", fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = {
                        onNavigateBack()
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        },
        modifier = Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing),
        containerColor = Color.Transparent
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(padding)
                .padding(bottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding() + 24.dp)
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(24.dp))
            
            val context = androidx.compose.ui.platform.LocalContext.current
            val imagePickerLauncher = rememberLauncherForActivityResult(
                contract = androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia()
            ) { uri ->
                if (uri != null) {
                    val path = com.example.evansunischeduler.media.ImageHelper.copyImageToLocalStorage(context, uri)
                    if (path != null) {
                        onProfileImageSelected(path)
                    }
                }
            }

            // Premium Avatar Header
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(PrimaryAccent, SecondaryAccent, PrimaryAccent)
                        )
                    )
                    .clickable {
                        imagePickerLauncher.launch(
                            androidx.activity.result.PickVisualMediaRequest(
                                androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia.ImageOnly
                            )
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                if (currentProfileImagePath != null) {
                    coil.compose.AsyncImage(
                        model = currentProfileImagePath,
                        contentDescription = "Profile Picture",
                        modifier = Modifier.fillMaxSize().clip(CircleShape),
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop
                    )
                } else {
                    Text(
                        text = name.take(1).uppercase().ifEmpty { "🎓" },
                        fontSize = 56.sp,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                // Camera Icon overlay
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp),
                    contentAlignment = Alignment.BottomEnd
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF1E1E1E).copy(alpha = 0.8f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.CameraAlt, contentDescription = "Edit Image", tint = Color.White, modifier = Modifier.size(18.dp))
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Box(
                modifier = Modifier.fillMaxWidth().glassCard(),
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("Personal Info", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = PrimaryAccent)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    OutlinedTextField(
                        value = name,
                        onValueChange = { 
                            name = it
                            onSaveProfile(it, notificationMins.toInt())
                        },
                        label = { Text("Your Name") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color.Transparent,
                            unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                            focusedContainerColor = MaterialTheme.colorScheme.surface
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Notifications Section
            Box(
                modifier = Modifier.fillMaxWidth().glassCard(),
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Notifications, contentDescription = "Notifications", tint = PrimaryAccent)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Notifications", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Text(
                        text = "Remind me ${notificationMins.toInt()} mins before class",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    
                    Slider(
                        value = notificationMins,
                        onValueChange = { 
                            notificationMins = it 
                            onSaveProfile(name, it.toInt())
                        },
                        valueRange = 0f..60f,
                        steps = 11,
                        modifier = Modifier.fillMaxWidth(),
                        colors = SliderDefaults.colors(
                            thumbColor = PrimaryAccent,
                            activeTrackColor = PrimaryAccent,
                            inactiveTrackColor = PrimaryAccent.copy(alpha = 0.2f)
                        )
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))

            // Appearance Section
            Box(
                modifier = Modifier.fillMaxWidth().glassCard(),
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Palette, contentDescription = "Appearance", tint = SecondaryAccent)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Appearance", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ThemeOption(
                            label = "System",
                            icon = Icons.Filled.Settings,
                            isSelected = currentTheme == "SYSTEM",
                            onClick = { onThemeChange("SYSTEM") },
                            modifier = Modifier.weight(1f)
                        )
                        ThemeOption(
                            label = "Light",
                            icon = Icons.Filled.LightMode,
                            isSelected = currentTheme == "LIGHT",
                            onClick = { onThemeChange("LIGHT") },
                            modifier = Modifier.weight(1f)
                        )
                        ThemeOption(
                            label = "Dark",
                            icon = Icons.Filled.DarkMode,
                            isSelected = currentTheme == "DARK",
                            onClick = { onThemeChange("DARK") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Voice Reminders Section
            Box(
                modifier = Modifier.fillMaxWidth().glassCard(),
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Mic, contentDescription = "Voice Reminders", tint = PrimaryAccent)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Voice Reminders", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Customize how Evans reminds you",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    var isRecording by remember { mutableStateOf(false) }
                    var isPlaying by remember { mutableStateOf(false) }
                    val context = androidx.compose.ui.platform.LocalContext.current
                    
                    val permissionLauncher = rememberLauncherForActivityResult(
                        androidx.activity.result.contract.ActivityResultContracts.RequestPermission()
                    ) { isGranted ->
                        if (isGranted) {
                            if (!isRecording) {
                                // Start Recording
                                com.example.evansunischeduler.media.VoiceRecorderHelper.startRecording(context)
                                isRecording = true
                            }
                        } else {
                            android.widget.Toast.makeText(context, "Audio permission required", android.widget.Toast.LENGTH_SHORT).show()
                        }
                    }
                    
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        VoiceOptionRow(
                            title = "Standard Beep",
                            description = "System default notification sound",
                            isSelected = currentVoiceType == "STANDARD",
                            onClick = { onVoiceTypeChange("STANDARD") }
                        )
                        VoiceOptionRow(
                            title = "Text-to-Speech",
                            description = "Evans reads your task aloud",
                            isSelected = currentVoiceType == "TTS",
                            onClick = { onVoiceTypeChange("TTS") }
                        )
                        VoiceOptionRow(
                            title = "Custom Recording",
                            description = if (currentCustomVoicePath != null) "Custom audio saved" else "Record your own reminder audio",
                            isSelected = currentVoiceType == "CUSTOM",
                            onClick = { onVoiceTypeChange("CUSTOM") }
                        )
                    }
                    
                    if (currentVoiceType == "CUSTOM") {
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        if (currentCustomVoicePath != null && !isRecording) {
                            Button(
                                onClick = { 
                                    if (isPlaying) {
                                        com.example.evansunischeduler.media.VoicePlayerHelper.stop()
                                        isPlaying = false
                                    } else {
                                        isPlaying = true
                                        com.example.evansunischeduler.media.VoicePlayerHelper.play(context, currentCustomVoicePath) {
                                            isPlaying = false
                                        }
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = if (isPlaying) SecondaryAccent else PrimaryAccent)
                            ) {
                                Icon(
                                    if (isPlaying) Icons.Filled.Stop else Icons.Filled.PlayArrow, 
                                    contentDescription = if (isPlaying) "Stop" else "Play"
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(if (isPlaying) "Stop Playing..." else "Play Saved Recording")
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        
                        Button(
                            onClick = {
                                if (isRecording) {
                                    // Stop Recording
                                    val path = com.example.evansunischeduler.media.VoiceRecorderHelper.stopRecording()
                                    if (path != null) {
                                        onCustomVoiceRecorded(path)
                                    }
                                    isRecording = false
                                } else {
                                    if (isPlaying) {
                                        com.example.evansunischeduler.media.VoicePlayerHelper.stop()
                                        isPlaying = false
                                    }
                                    if (androidx.core.content.ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                                        com.example.evansunischeduler.media.VoiceRecorderHelper.startRecording(context)
                                        isRecording = true
                                    } else {
                                        permissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO)
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isRecording) MaterialTheme.colorScheme.surfaceVariant else DangerRed,
                                contentColor = if (isRecording) MaterialTheme.colorScheme.onSurfaceVariant else Color.White
                            )
                        ) {
                            Icon(if (isRecording) Icons.Filled.Stop else Icons.Filled.Mic, contentDescription = "Record")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(if (isRecording) "Stop Recording..." else if (currentCustomVoicePath != null) "Re-record Audio" else "Record Custom Audio")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
            
            OutlinedButton(
                onClick = { showTutorialState = true },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryAccent)
            ) {
                Text("Show App Tutorial", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
            
            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = { 
                    onNavigateBack()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
            ) {
                Text(
                    text = "Save & Close",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(32.dp))

            // Secret Admin Trigger
            TextButton(onClick = {
                adminTaps++
                if (adminTaps >= 7) {
                    adminTaps = 0
                    onAdminLogin()
                }
            }) {
                Text("App Version 2.0", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelSmall)
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
    }
    
    // We use a separate state to show tutorial on top of the scaffold
    if (showTutorialState) {
        com.example.evansunischeduler.ui.onboarding.TutorialScreen(onDismiss = { showTutorialState = false })
    }
}

@Composable
private fun ThemeOption(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val containerColor = if (isSelected) PrimaryAccent else MaterialTheme.colorScheme.surface
    val contentColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(containerColor.copy(alpha = if (isSelected) 1f else 0.5f))
            .clickable(onClick = onClick)
            .padding(vertical = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, contentDescription = label, tint = contentColor)
            Spacer(modifier = Modifier.height(4.dp))
            Text(label, style = MaterialTheme.typography.labelMedium, color = contentColor, fontWeight = FontWeight.SemiBold)
        }
    }
}
@Composable
private fun VoiceOptionRow(
    title: String,
    description: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (isSelected) PrimaryAccent.copy(alpha = 0.1f) else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RadioButton(
            selected = isSelected,
            onClick = onClick,
            colors = RadioButtonDefaults.colors(selectedColor = PrimaryAccent)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
            Text(description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
