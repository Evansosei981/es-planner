package com.example.evansunischeduler.ui.timer

import android.media.MediaPlayer
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.evansunischeduler.R
import com.example.evansunischeduler.data.StudySession
import com.example.evansunischeduler.theme.*
import com.example.evansunischeduler.ui.components.PremiumCard
import com.example.evansunischeduler.ui.components.AdaptivePremiumCard
import kotlinx.coroutines.delay

@Composable
fun TimerScreen(
    session: StudySession?,
    onNavigateBack: () -> Unit,
    onSessionCompleted: (StudySession, String, String?) -> Unit,
    onStartVideoRecording: () -> Unit,
    recordedVideoUri: String?,
    modifier: Modifier = Modifier
) {
    if (session == null) {
        Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("No session selected.", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onBackground)
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = onNavigateBack, colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)) {
                    Text("Go Back")
                }
            }
        }
        return
    }

    val context = LocalContext.current
    val haptic = LocalHapticFeedback.current
    
    val totalSeconds = session.durationMinutes * 60
    var remainingSeconds by remember { mutableIntStateOf(totalSeconds) }
    var isRunning by remember { mutableStateOf(false) }
    var isFinished by remember { mutableStateOf(false) }
    var reflectionText by remember { mutableStateOf("") }
    
    val startPlayer = remember { MediaPlayer.create(context, R.raw.study_starting) }
    val breakPlayer = remember { MediaPlayer.create(context, R.raw.study_break) }

    LaunchedEffect(isRunning, remainingSeconds) {
        if (isRunning && remainingSeconds > 0) {
            delay(1000L)
            remainingSeconds -= 1
        } else if (isRunning && remainingSeconds == 0) {
            isRunning = false
            isFinished = true
            breakPlayer?.start()
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            startPlayer?.release()
            breakPlayer?.release()
        }
    }

    val color = CourseColors.getOrElse(session.colorIndex) { CourseColors[0] }
    
    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(modifier = Modifier.fillMaxWidth().padding(top = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = onNavigateBack,
                    modifier = Modifier.size(48.dp).clip(CircleShape).background(MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "Focus Timer", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                    Text(text = session.courseName, style = MaterialTheme.typography.bodyMedium, color = color, fontWeight = FontWeight.SemiBold)
                }
            }
            
            Spacer(modifier = Modifier.height(48.dp))
            
            val progress = if (totalSeconds > 0) remainingSeconds.toFloat() / totalSeconds else 0f
            val animatedProgress by animateFloatAsState(
                targetValue = progress,
                animationSpec = tween(durationMillis = 1000, easing = LinearEasing),
                label = "timer_progress"
            )
            
            Box(modifier = Modifier.size(280.dp), contentAlignment = Alignment.Center) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val strokeWidth = 20.dp.toPx()
                    val radius = (size.minDimension - strokeWidth) / 2
                    val topLeft = Offset((size.width - radius * 2) / 2, (size.height - radius * 2) / 2)
                    val arcSize = Size(radius * 2, radius * 2)
                    
                    drawArc(
                        color = color.copy(alpha = 0.1f), startAngle = 0f, sweepAngle = 360f,
                        useCenter = false, topLeft = topLeft, size = arcSize,
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                    )
                    drawArc(
                        color = color, startAngle = -90f, sweepAngle = 360f * animatedProgress,
                        useCenter = false, topLeft = topLeft, size = arcSize,
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                    )
                }
                
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    val mins = remainingSeconds / 60
                    val secs = remainingSeconds % 60
                    Text(
                        text = "${String.format("%02d", mins)}:${String.format("%02d", secs)}",
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 64.sp),
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    if (isFinished) {
                        Text(text = "Session Complete! 🎉", style = MaterialTheme.typography.titleMedium, color = SuccessGreen, fontWeight = FontWeight.Bold)
                    } else {
                        Text(text = "Stay focused", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            if (isFinished) {
                AdaptivePremiumCard(elevation = 2.dp) {
                    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                        OutlinedTextField(
                            value = reflectionText,
                            onValueChange = { reflectionText = it },
                            label = { Text("What did you learn?") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            maxLines = 4
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = {
                                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                onStartVideoRecording()
                            },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant, contentColor = MaterialTheme.colorScheme.onSurfaceVariant),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Filled.Videocam, contentDescription = "Video")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(if (recordedVideoUri != null) "Video Attached!" else "Record 3-Min Reflection", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            } else {
                Spacer(modifier = Modifier.weight(1f))
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        isRunning = false
                        remainingSeconds = totalSeconds
                    },
                    modifier = Modifier.size(64.dp).clip(CircleShape).background(MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Icon(Icons.Filled.Stop, contentDescription = "Stop", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(32.dp))
                }
                
                FloatingActionButton(
                    onClick = {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        if (!isRunning && remainingSeconds == totalSeconds) {
                            startPlayer?.start()
                        }
                        isRunning = !isRunning
                    },
                    modifier = Modifier.size(80.dp),
                    containerColor = color,
                    contentColor = Color.White,
                    shape = CircleShape,
                    elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 4.dp)
                ) {
                    Icon(
                        imageVector = if (isRunning) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                        contentDescription = if (isRunning) "Pause" else "Play",
                        modifier = Modifier.size(40.dp)
                    )
                }
                
                Button(
                    onClick = {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        if (isFinished) {
                            onSessionCompleted(session, reflectionText, recordedVideoUri)
                            onNavigateBack()
                        } else {
                            isRunning = false
                            remainingSeconds = 0
                            isFinished = true
                            startPlayer?.stop()
                            breakPlayer?.start()
                        }
                    },
                    modifier = Modifier.height(64.dp),
                    shape = RoundedCornerShape(32.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isFinished) SuccessGreen else MaterialTheme.colorScheme.surfaceVariant, 
                        contentColor = if (isFinished) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                ) {
                    Text(if (isFinished) "Complete" else "End Early", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

