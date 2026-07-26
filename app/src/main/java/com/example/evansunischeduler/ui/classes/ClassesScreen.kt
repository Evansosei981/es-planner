package com.example.evansunischeduler.ui.classes

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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.School
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
import com.example.evansunischeduler.theme.CourseColors
import com.example.evansunischeduler.theme.PrimaryAccent
import com.example.evansunischeduler.ui.components.PremiumCard
import com.example.evansunischeduler.ui.components.AdaptivePremiumCard

@Composable
fun ClassesScreen(
    courses: List<Course>,
    onAddCourse: (Course) -> Unit,
    onDeleteCourse: (Course) -> Unit,
    modifier: Modifier = Modifier
) {
    var showDialog by remember { mutableStateOf(false) }
    val dayNames = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    val groupedCourses = remember(courses) { courses.groupBy { it.dayOfWeek } }
    val haptic = LocalHapticFeedback.current

    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Column(modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp)) {
            Spacer(modifier = Modifier.height(20.dp))
            Text(text = "My Classes", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "${courses.size} courses scheduled", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(24.dp))

            if (courses.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(120.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.School, contentDescription = null, modifier = Modifier.size(60.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(text = "No classes added yet", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = "Tap + to add your first class", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.weight(1f)) {
                    (1..7).forEach { day ->
                        val dayCourses = groupedCourses[day]
                        if (!dayCourses.isNullOrEmpty()) {
                            item {
                                Text(
                                    text = dayNames.getOrElse(day - 1) { "" },
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.padding(top = 16.dp, bottom = 4.dp)
                                )
                            }
                            items(dayCourses, key = { it.id }) { course ->
                                CourseCard(course = course, onDelete = { onDeleteCourse(course) })
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
            containerColor = PrimaryAccent, contentColor = Color.White, shape = RoundedCornerShape(16.dp)
        ) {
            Icon(Icons.Filled.Add, contentDescription = "Add Class")
        }
    }

    if (showDialog) {
        AddCourseDialog(onDismiss = { showDialog = false }, onConfirm = { course -> onAddCourse(course); showDialog = false })
    }
}

@Composable
private fun CourseCard(course: Course, onDelete: () -> Unit) {
    val color = CourseColors.getOrElse(course.colorIndex) { CourseColors[0] }
    AdaptivePremiumCard(
        modifier = Modifier.fillMaxWidth().animateContentSize(),
        elevation = 2.dp
    ) {
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(text = course.name.take(2).uppercase(), style = MaterialTheme.typography.titleMedium, color = color, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = course.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                if (course.lecturer.isNotBlank()) {
                    Text(text = course.lecturer, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${String.format("%02d", course.startHour)}:${String.format("%02d", course.startMinute)} - ${String.format("%02d", course.endHour)}:${String.format("%02d", course.endMinute)}",
                        style = MaterialTheme.typography.labelMedium, color = color, fontWeight = FontWeight.SemiBold
                    )
                    if (course.room.isNotBlank()) {
                        Text(text = " \u2022 ${course.room}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            val haptic = LocalHapticFeedback.current
            IconButton(onClick = { 
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                onDelete() 
            }) {
                Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddCourseDialog(onDismiss: () -> Unit, onConfirm: (Course) -> Unit) {
    var name by remember { mutableStateOf("") }
    var lecturer by remember { mutableStateOf("") }
    var room by remember { mutableStateOf("") }
    var selectedDay by remember { mutableIntStateOf(1) }
    var startHour by remember { mutableIntStateOf(8) }
    var startMinute by remember { mutableIntStateOf(0) }
    var endHour by remember { mutableIntStateOf(9) }
    var endMinute by remember { mutableIntStateOf(0) }
    var selectedColorIndex by remember { mutableIntStateOf(0) }
    val dayNames = listOf("M", "T", "W", "T", "F", "S", "S")

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
            Text("Add New Class", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            
            OutlinedTextField(
                value = name, onValueChange = { name = it },
                label = { Text("Course Name") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )
            
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedTextField(
                    value = room, onValueChange = { room = it },
                    label = { Text("Room") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    value = lecturer, onValueChange = { lecturer = it },
                    label = { Text("Lecturer") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            Text("Day of Week", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                dayNames.forEachIndexed { index, day ->
                    val isSelected = index + 1 == selectedDay
                    Box(
                        modifier = Modifier.size(40.dp).clip(CircleShape)
                            .background(if (isSelected) PrimaryAccent else MaterialTheme.colorScheme.surfaceVariant)
                            .clickable { selectedDay = index + 1 },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = day, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }

            val context = androidx.compose.ui.platform.LocalContext.current
            val formatter = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.getDefault())
            
            fun formatTime(h: Int, m: Int): String {
                val cal = java.util.Calendar.getInstance().apply { set(java.util.Calendar.HOUR_OF_DAY, h); set(java.util.Calendar.MINUTE, m) }
                return formatter.format(cal.time)
            }

            Text("Time", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                AdaptivePremiumCard(modifier = Modifier.weight(1f), backgroundColor = MaterialTheme.colorScheme.surfaceVariant, elevation = 0.dp, onClick = {
                    android.app.TimePickerDialog(context, { _, hourOfDay, minute -> startHour = hourOfDay; startMinute = minute }, startHour, startMinute, android.text.format.DateFormat.is24HourFormat(context)).show()
                }) {
                    Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Start", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(formatTime(startHour, startMinute), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
                AdaptivePremiumCard(modifier = Modifier.weight(1f), backgroundColor = MaterialTheme.colorScheme.surfaceVariant, elevation = 0.dp, onClick = {
                    android.app.TimePickerDialog(context, { _, hourOfDay, minute -> endHour = hourOfDay; endMinute = minute }, endHour, endMinute, android.text.format.DateFormat.is24HourFormat(context)).show()
                }) {
                    Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("End", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(formatTime(endHour, endMinute), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Text("Color Label", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                CourseColors.take(7).forEachIndexed { index, color ->
                    Box(
                        modifier = Modifier.size(36.dp).clip(CircleShape).background(color).clickable { selectedColorIndex = index },
                        contentAlignment = Alignment.Center
                    ) {
                        if (index == selectedColorIndex) {
                            Box(modifier = Modifier.size(14.dp).clip(CircleShape).background(Color.White))
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = { if (name.isNotBlank()) { onConfirm(Course(name = name, lecturer = lecturer, room = room, colorIndex = selectedColorIndex, dayOfWeek = selectedDay, startHour = startHour, startMinute = startMinute, endHour = endHour, endMinute = endMinute)) } },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent),
                shape = RoundedCornerShape(16.dp)
            ) { 
                Text("Save Class", fontSize = 16.sp, fontWeight = FontWeight.Bold) 
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

