package com.example.evansunischeduler.ui.study

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.evansunischeduler.data.Course
import com.example.evansunischeduler.data.StudySession
import com.example.evansunischeduler.theme.*
import com.example.evansunischeduler.ui.components.PremiumCard
import com.example.evansunischeduler.ui.components.AdaptivePremiumCard

@Composable
fun StudyScreen(
    studySessions: List<StudySession>,
    courses: List<Course>,
    onAddSession: (StudySession) -> Unit,
    onToggleComplete: (StudySession) -> Unit,
    onDeleteSession: (StudySession) -> Unit,
    onSessionClick: (StudySession) -> Unit,
    modifier: Modifier = Modifier
) {
    var showDialog by remember { mutableStateOf(false) }
    val dayNames = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    val grouped = remember(studySessions) { studySessions.groupBy { it.dayOfWeek } }
    val completedCount = remember(studySessions) { studySessions.count { it.completed } }
    val haptic = LocalHapticFeedback.current

    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Column(modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp)) {
            Spacer(modifier = Modifier.height(20.dp))
            Text(text = "Study Planner", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "$completedCount of ${studySessions.size} sessions completed", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(24.dp))
            
            if (studySessions.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(120.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null, modifier = Modifier.size(60.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(text = "No study sessions planned", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = "Tap + to plan your study time", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.weight(1f)) {
                    (1..7).forEach { day ->
                        val daySessions = grouped[day]
                        if (!daySessions.isNullOrEmpty()) {
                            item {
                                Text(
                                    text = dayNames.getOrElse(day - 1) { "" }, 
                                    style = MaterialTheme.typography.titleMedium, 
                                    fontWeight = FontWeight.Bold, 
                                    color = MaterialTheme.colorScheme.onBackground, 
                                    modifier = Modifier.padding(top = 16.dp, bottom = 4.dp)
                                )
                            }
                            items(daySessions, key = { it.id }) { session ->
                                StudySessionCard(
                                    session = session, 
                                    onToggleComplete = { onToggleComplete(session) }, 
                                    onDelete = { onDeleteSession(session) },
                                    onClick = { onSessionClick(session) }
                                )
                            }
                        }
                    }
                    item { Spacer(modifier = Modifier.height(100.dp)) }
                }
            }
        }

        FloatingActionButton(
            onClick = { 
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                showDialog = true 
            },
            modifier = Modifier.align(Alignment.BottomEnd).padding(24.dp).padding(bottom = 72.dp),
            containerColor = SecondaryAccent, contentColor = Color.White, shape = RoundedCornerShape(16.dp)
        ) { Icon(Icons.Filled.Add, contentDescription = "Add Study Session") }
    }

    if (showDialog) {
        AddStudySessionDialog(courses = courses, onDismiss = { showDialog = false }, onConfirm = { session -> onAddSession(session); showDialog = false })
    }
}

@Composable
private fun StudySessionCard(session: StudySession, onToggleComplete: () -> Unit, onDelete: () -> Unit, onClick: () -> Unit) {
    val color = CourseColors.getOrElse(session.colorIndex) { CourseColors[0] }
    val endMin = session.startHour * 60 + session.startMinute + session.durationMinutes
    val isCompleted = session.completed

    AdaptivePremiumCard(
        modifier = Modifier.fillMaxWidth().animateContentSize(),
        elevation = if (isCompleted) 0.dp else 2.dp,
        backgroundColor = if (isCompleted) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f) else MaterialTheme.colorScheme.surface,
        onClick = onClick
    ) {
        val haptic = LocalHapticFeedback.current
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { 
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                onToggleComplete() 
            }) {
                Icon(
                    if (isCompleted) Icons.Filled.CheckCircle else Icons.Outlined.CheckCircle,
                    contentDescription = "Toggle Complete",
                    tint = if (isCompleted) SuccessGreen else color,
                    modifier = Modifier.size(32.dp)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = session.courseName, 
                    style = MaterialTheme.typography.titleMedium, 
                    fontWeight = FontWeight.Bold,
                    color = if (isCompleted) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onBackground
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${String.format("%02d", session.startHour)}:${String.format("%02d", session.startMinute)} - ${String.format("%02d", endMin / 60)}:${String.format("%02d", endMin % 60)}", 
                        style = MaterialTheme.typography.labelMedium, 
                        color = if (isCompleted) MaterialTheme.colorScheme.onSurfaceVariant else color,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = " \u2022 ${session.durationMinutes} min", 
                        style = MaterialTheme.typography.labelMedium, 
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddStudySessionDialog(courses: List<Course>, onDismiss: () -> Unit, onConfirm: (StudySession) -> Unit) {
    var selectedCourseIndex by remember { mutableIntStateOf(0) }
    var selectedDay by remember { mutableIntStateOf(1) }
    var startHour by remember { mutableIntStateOf(10) }
    var startMinute by remember { mutableIntStateOf(0) }
    var durationMinutes by remember { mutableIntStateOf(60) }
    val dayNames = listOf("M", "T", "W", "T", "F", "S", "S")
    val durations = listOf(30, 45, 60, 90, 120)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = MaterialTheme.colorScheme.surface,
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp).padding(bottom = 24.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Plan Study Session", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            
            if (courses.isEmpty()) {
                Text(text = "Add some classes first to create study sessions!", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                Text("Select Course", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                LazyColumn(modifier = Modifier.height(160.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(courses.size) { index ->
                        val course = courses[index]
                        val color = CourseColors.getOrElse(course.colorIndex) { CourseColors[0] }
                        val isSelected = index == selectedCourseIndex
                        AdaptivePremiumCard(
                            modifier = Modifier.fillMaxWidth(),
                            backgroundColor = if (isSelected) color.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant,
                            elevation = 0.dp,
                            onClick = { selectedCourseIndex = index }
                        ) {
                            Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(16.dp).clip(CircleShape).background(color))
                                Spacer(modifier = Modifier.width(16.dp))
                                Text(text = course.name, style = MaterialTheme.typography.bodyMedium, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal, color = MaterialTheme.colorScheme.onBackground)
                                Spacer(modifier = Modifier.weight(1f))
                                if (isSelected) {
                                    Icon(
                                        imageVector = Icons.Filled.CheckCircle, 
                                        contentDescription = "Selected", 
                                        tint = color,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                Text("Day of Week", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    dayNames.forEachIndexed { index, day ->
                        val isSelected = index + 1 == selectedDay
                        Box(
                            modifier = Modifier.size(40.dp).clip(CircleShape)
                                .background(if (isSelected) SecondaryAccent else MaterialTheme.colorScheme.surfaceVariant)
                                .clickable { selectedDay = index + 1 },
                            contentAlignment = Alignment.Center
                        ) { Text(text = day, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant) }
                    }
                }

                val context = androidx.compose.ui.platform.LocalContext.current
                val formatter = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.getDefault())
                fun formatTime(h: Int, m: Int): String {
                    val cal = java.util.Calendar.getInstance().apply { set(java.util.Calendar.HOUR_OF_DAY, h); set(java.util.Calendar.MINUTE, m) }
                    return formatter.format(cal.time)
                }

                Text("Time & Duration", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                AdaptivePremiumCard(modifier = Modifier.fillMaxWidth(), backgroundColor = MaterialTheme.colorScheme.surfaceVariant, elevation = 0.dp, onClick = {
                    android.app.TimePickerDialog(context, { _, hourOfDay, minute -> startHour = hourOfDay; startMinute = minute }, startHour, startMinute, android.text.format.DateFormat.is24HourFormat(context)).show()
                }) {
                    Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Start Time", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(formatTime(startHour, startMinute), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    durations.forEach { dur ->
                        FilterChip(
                            onClick = { durationMinutes = dur }, 
                            label = { Text("${dur}m") }, 
                            selected = dur == durationMinutes, 
                            colors = FilterChipDefaults.filterChipColors(selectedContainerColor = SecondaryAccent.copy(alpha = 0.2f), selectedLabelColor = SecondaryAccent),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { if (courses.isNotEmpty()) { val course = courses[selectedCourseIndex]; onConfirm(StudySession(courseId = course.id, courseName = course.name, colorIndex = course.colorIndex, dayOfWeek = selectedDay, startHour = startHour, startMinute = startMinute, durationMinutes = durationMinutes)) } },
                    enabled = courses.isNotEmpty(), 
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SecondaryAccent), 
                    shape = RoundedCornerShape(16.dp)
                ) { Text("Plan Session", fontSize = 16.sp, fontWeight = FontWeight.Bold) }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

