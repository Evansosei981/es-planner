package com.example.evansunischeduler.ui.schedule

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Warning
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.evansunischeduler.data.Course
import com.example.evansunischeduler.data.StudySession
import com.example.evansunischeduler.data.Exam
import com.example.evansunischeduler.theme.CourseColors
import com.example.evansunischeduler.theme.PrimaryAccent
import com.example.evansunischeduler.ui.components.PremiumCard
import com.example.evansunischeduler.ui.components.AdaptivePremiumCard
import java.util.Calendar
import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleScreen(
    courses: List<Course>,
    studySessions: List<StudySession>,
    upcomingExams: List<Exam> = emptyList(),
    currentTime: Long,
    onAddExam: ((Exam) -> Unit)? = null,
    onDeleteExam: ((Exam) -> Unit)? = null,
    onClassNoteClick: (Course) -> Unit,
    onManageClassesClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("Weekly Schedule", "Upcoming Exams")

    Column(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(horizontal = 20.dp)) {
        Spacer(modifier = Modifier.height(20.dp))
        Text(text = "My Schedule", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
        Spacer(modifier = Modifier.height(16.dp))

        SecondaryTabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = Color.Transparent,
            indicator = {
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(selectedTabIndex),
                    color = PrimaryAccent
                )
            },
            divider = {}
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = { 
                        Text(
                            title, 
                            fontWeight = if (selectedTabIndex == index) FontWeight.Bold else FontWeight.Normal,
                            color = if (selectedTabIndex == index) PrimaryAccent else MaterialTheme.colorScheme.onSurfaceVariant
                        ) 
                    }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))

        if (selectedTabIndex == 0) {
            WeeklyScheduleContent(
                courses = courses,
                studySessions = studySessions,
                onClassNoteClick = onClassNoteClick,
                onManageClassesClick = onManageClassesClick
            )
        } else {
            ExamsContent(
                exams = upcomingExams,
                currentTime = currentTime,
                onAddExam = onAddExam,
                onDeleteExam = onDeleteExam
            )
        }
    }
}

@Composable
fun WeeklyScheduleContent(
    courses: List<Course>,
    studySessions: List<StudySession>,
    onClassNoteClick: (Course) -> Unit,
    onManageClassesClick: () -> Unit
) {
    var selectedDay by remember {
        val cal = Calendar.getInstance()
        val javaDow = cal.get(Calendar.DAY_OF_WEEK)
        val dow = if (javaDow == Calendar.SUNDAY) 7 else javaDow - 1
        mutableIntStateOf(dow)
    }

    LaunchedEffect(Unit) {
        // Just sync it once a day if they are on the default today view
        // But since the user can manually select, we won't aggressively override.
    }

    val dayNames = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    val dayLetters = listOf("M", "T", "W", "T", "F", "S", "S")
    val filteredCourses = remember(courses, selectedDay) { courses.filter { it.dayOfWeek == selectedDay } }
    val filteredSessions = remember(studySessions, selectedDay) { studySessions.filter { it.dayOfWeek == selectedDay } }
    val haptic = LocalHapticFeedback.current

    Column(modifier = Modifier.fillMaxSize()) {
        AdaptivePremiumCard {
            Row(
                modifier = Modifier.fillMaxWidth().padding(8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                dayNames.forEachIndexed { index, _ ->
                    val dayNumber = index + 1
                    val isSelected = dayNumber == selectedDay
                    val hasItems = courses.any { it.dayOfWeek == dayNumber } || studySessions.any { it.dayOfWeek == dayNumber }

                    Column(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { 
                                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                selectedDay = dayNumber 
                            }
                            .then(if (isSelected) Modifier.background(PrimaryAccent, RoundedCornerShape(12.dp)) else Modifier)
                            .padding(vertical = 12.dp, horizontal = 12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = dayLetters[index],
                            style = MaterialTheme.typography.labelLarge,
                            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold
                        )
                        if (hasItems) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Box(
                                modifier = Modifier.size(6.dp).clip(CircleShape)
                                    .background(if (isSelected) Color.White.copy(alpha = 0.8f) else PrimaryAccent.copy(alpha = 0.5f))
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = dayNames.getOrElse(selectedDay - 1) { "" },
            style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(modifier = Modifier.height(16.dp))

        Column(
            modifier = Modifier.fillMaxWidth().weight(1f).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (filteredCourses.isEmpty() && filteredSessions.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().padding(vertical = 60.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(120.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(text = "😎", fontSize = 56.sp)
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = "A free day!",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "No classes or study sessions scheduled.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            filteredCourses.forEach { c ->
                ScheduleCard(
                    title = c.name,
                    subtitle = "${c.room} • ${c.lecturer}",
                    colorIndex = c.colorIndex,
                    startHour = c.startHour,
                    startMinute = c.startMinute,
                    endHour = c.endHour,
                    endMinute = c.endMinute,
                    icon = Icons.Filled.School,
                    actionIcon = Icons.Filled.Edit,
                    onActionClick = { onClassNoteClick(c) }
                )
            }
            
            filteredSessions.forEach { s ->
                val endMin = s.startHour * 60 + s.startMinute + s.durationMinutes
                ScheduleCard(
                    title = s.courseName,
                    subtitle = "Study Session • ${s.durationMinutes} min",
                    colorIndex = s.colorIndex,
                    startHour = s.startHour,
                    startMinute = s.startMinute,
                    endHour = endMin / 60,
                    endMinute = endMin % 60,
                    icon = Icons.Filled.Book
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = onManageClassesClick,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
            ) {
                Icon(Icons.Filled.School, contentDescription = "Manage Classes")
                Spacer(modifier = Modifier.width(8.dp))
                Text("Manage Classes", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExamsContent(
    exams: List<Exam>,
    currentTime: Long,
    onAddExam: ((Exam) -> Unit)?,
    onDeleteExam: ((Exam) -> Unit)?
) {
    var showAddDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize()) {
        if (exams.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().weight(1f).padding(vertical = 60.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(120.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surfaceVariant),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "🎉", fontSize = 56.sp)
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = "No Exams Upcoming!",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(bottom = 100.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(exams) { exam ->
                    val formatter = SimpleDateFormat("EEE, MMM d, yyyy • h:mm a", Locale.getDefault())
                    val dateString = formatter.format(exam.timestampMillis)
                    val daysLeft = ((exam.timestampMillis - currentTime) / (1000 * 60 * 60 * 24)).toInt()
                    val daysStr = if (daysLeft == 0) "Today" else if (daysLeft == 1) "In 1 day" else "In $daysLeft days"

                    ScheduleCard(
                        title = "${exam.courseName} - ${exam.examTitle}",
                        subtitle = "$dateString\n$daysStr",
                        colorIndex = exam.colorIndex,
                        startHour = 0,
                        startMinute = 0,
                        endHour = 0,
                        endMinute = 0,
                        icon = Icons.Filled.Warning,
                        actionIcon = Icons.Filled.Delete,
                        onActionClick = { onDeleteExam?.invoke(exam) },
                        hideTime = true
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = { showAddDialog = true },
            modifier = Modifier.fillMaxWidth().height(56.dp).padding(bottom = 20.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
        ) {
            Icon(Icons.Filled.Add, contentDescription = "Add Exam")
            Spacer(modifier = Modifier.width(8.dp))
            Text("Add Exam or Mid Sem", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.height(80.dp))
    }

    if (showAddDialog) {
        var courseName by remember { mutableStateOf("") }
        var examTitle by remember { mutableStateOf("") }
        val datePickerState = rememberDatePickerState()
        val timePickerState = rememberTimePickerState()
        var showTimePicker by remember { mutableStateOf(false) }

        if (showTimePicker) {
            AlertDialog(
                onDismissRequest = { showTimePicker = false },
                title = { Text("Select Time") },
                text = { TimePicker(state = timePickerState) },
                confirmButton = {
                    TextButton(onClick = {
                        val cal = Calendar.getInstance()
                        cal.timeInMillis = datePickerState.selectedDateMillis ?: System.currentTimeMillis()
                        cal.set(Calendar.HOUR_OF_DAY, timePickerState.hour)
                        cal.set(Calendar.MINUTE, timePickerState.minute)

                        onAddExam?.invoke(
                            Exam(
                                courseName = courseName,
                                examTitle = examTitle,
                                timestampMillis = cal.timeInMillis,
                                colorIndex = (0..CourseColors.size - 1).random()
                            )
                        )
                        showTimePicker = false
                        showAddDialog = false
                    }) {
                        Text("Save")
                    }
                }
            )
        } else {
            AlertDialog(
                onDismissRequest = { showAddDialog = false },
                title = { Text("Add Exam") },
                text = {
                    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                        OutlinedTextField(
                            value = courseName,
                            onValueChange = { courseName = it },
                            label = { Text("Course Name") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = examTitle,
                            onValueChange = { examTitle = it },
                            label = { Text("Title (e.g. Mid Sem)") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        DatePicker(state = datePickerState)
                    }
                },
                confirmButton = {
                    TextButton(
                        onClick = { showTimePicker = true },
                        enabled = courseName.isNotBlank() && examTitle.isNotBlank() && datePickerState.selectedDateMillis != null
                    ) {
                        Text("Next")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showAddDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun ScheduleCard(
    title: String,
    subtitle: String,
    colorIndex: Int,
    startHour: Int,
    startMinute: Int,
    endHour: Int,
    endMinute: Int,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    actionIcon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    onActionClick: (() -> Unit)? = null,
    hideTime: Boolean = false
) {
    val color = CourseColors.getOrElse(colorIndex) { CourseColors[0] }
    AdaptivePremiumCard(elevation = 2.dp) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            if (!hideTime) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(64.dp)) {
                    Text(
                        text = "${String.format("%02d", startHour)}:${String.format("%02d", startMinute)}",
                        style = MaterialTheme.typography.titleMedium, color = color, fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${String.format("%02d", endHour)}:${String.format("%02d", endMinute)}",
                        style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                Box(modifier = Modifier.width(4.dp).height(48.dp).clip(RoundedCornerShape(2.dp)).background(color))
                Spacer(modifier = Modifier.width(16.dp))
            } else {
                Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(color.copy(alpha = 0.1f)), contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = color)
                }
                Spacer(modifier = Modifier.width(16.dp))
            }
            
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (actionIcon != null && onActionClick != null) {
                IconButton(
                    onClick = onActionClick,
                    modifier = Modifier.size(40.dp).clip(CircleShape).background(MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Icon(actionIcon, contentDescription = "Action", tint = color, modifier = Modifier.size(20.dp))
                }
            }
        }
    }
}


