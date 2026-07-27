package com.example.evansunischeduler.ui.home

import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.evansunischeduler.data.ScheduleItem
import com.example.evansunischeduler.theme.*
import com.example.evansunischeduler.ui.components.PremiumCard
import com.example.evansunischeduler.ui.components.AdaptivePremiumCard
import java.util.Calendar

@Composable
fun HomeScreen(
    userName: String,
    profileImagePath: String?,
    todaySchedule: List<ScheduleItem>,
    upcomingExams: List<com.example.evansunischeduler.data.Exam> = emptyList(),
    totalStudyMinutes: Int,
    weeklyGoalHours: Float,
    completedSessionsCount: Int,
    currentTime: Long,
    onProfileClick: () -> Unit,
    onShowTutorial: () -> Unit,
    onNewSessionClick: () -> Unit,
    onAskEvansClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val dayNames = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    var todayName by remember { mutableStateOf(dayNames[Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1]) }
    var dayOfWeek by remember { mutableIntStateOf(Calendar.getInstance().get(Calendar.DAY_OF_WEEK)) }
    var dayOfYear by remember { mutableIntStateOf(Calendar.getInstance().get(Calendar.DAY_OF_YEAR)) }
    
    LaunchedEffect(Unit) {
        while (true) {
            val calendar = Calendar.getInstance()
            todayName = dayNames[calendar.get(Calendar.DAY_OF_WEEK) - 1]
            dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
            dayOfYear = calendar.get(Calendar.DAY_OF_YEAR)
            kotlinx.coroutines.delay(60000)
        }
    }
    
    val dynamicGreeting = remember(todayName, upcomingExams, currentTime) {
        
        var greeting: String? = null
        val nextExam = upcomingExams.minByOrNull { it.timestampMillis }
        if (nextExam != null) {
            val daysLeft = ((nextExam.timestampMillis - currentTime) / (1000 * 60 * 60 * 24)).toInt()
            val examsSameDayCount = upcomingExams.count { 
                ((it.timestampMillis - currentTime) / (1000 * 60 * 60 * 24)).toInt() == daysLeft 
            }
            
            if (examsSameDayCount > 1) {
                if (daysLeft == 0) {
                    val multiTodayMessages = listOf(
                        "Good luck! You have $examsSameDayCount exams today! You got this! 🌟",
                        "It's a big day! Crush your $examsSameDayCount exams today! 🚀",
                        "Deep breaths. You are totally ready for your $examsSameDayCount exams today! 💪"
                    )
                    greeting = multiTodayMessages.random()
                } else if (daysLeft == 1) {
                    val multiTomorrowMessages = listOf(
                        "Only 1 day left until your $examsSameDayCount exams! Time to focus! ⏳",
                        "Tomorrow is a big day with $examsSameDayCount exams! Get some good rest tonight! 💤",
                        "The countdown is on! 1 day until your $examsSameDayCount exams. Final review time! 📚"
                    )
                    greeting = multiTomorrowMessages.random()
                } else if (daysLeft <= 14) {
                    val multiThisWeekMessages = listOf(
                        "Only $daysLeft days left until your $examsSameDayCount exams! 🎯",
                        "Just $daysLeft days to master your material for $examsSameDayCount exams! Let's make every study session count. 📈",
                        "You have $examsSameDayCount exams creeping up in $daysLeft days. You're doing great! ✨"
                    )
                    greeting = multiThisWeekMessages.random()
                } else {
                    greeting = "You have $examsSameDayCount exams coming up in $daysLeft days. Keep studying steadily! 🚀"
                }
            } else {
                val todayMessages = listOf(
                    "Good luck on your ${nextExam.examTitle} today! You got this! 🌟",
                    "It's game day! Crush your ${nextExam.courseName} exam today! 🚀",
                    "Deep breaths. You are totally ready for your ${nextExam.examTitle} today! 💪"
                )
                val tomorrowMessages = listOf(
                    "Only 1 day left until your ${nextExam.examTitle}! Time to focus! ⏳",
                    "Tomorrow is the big day for ${nextExam.courseName}! Get some good rest tonight! 💤",
                    "The countdown is on! 1 day until ${nextExam.examTitle}. Final review time! 📚"
                )
                val thisWeekMessages = listOf(
                    "Only $daysLeft days left until your ${nextExam.courseName} ${nextExam.examTitle}! 🎯",
                    "Just $daysLeft days to master ${nextExam.courseName}! Let's make every study session count. 📈",
                    "${nextExam.examTitle} is creeping up in $daysLeft days. You're doing great! ✨"
                )
                val farAwayMessages = listOf(
                    "Plenty of time! Your ${nextExam.examTitle} is $daysLeft days away. Slow and steady wins the race! 🐢",
                    "Look at you planning ahead! $daysLeft days until ${nextExam.courseName}. 🧠",
                    "$daysLeft days until your ${nextExam.examTitle}. Let's get ahead of the curve! 🚀"
                )

                if (daysLeft == 0) {
                    greeting = todayMessages.random()
                } else if (daysLeft == 1) {
                    greeting = tomorrowMessages.random()
                } else if (daysLeft <= 14) {
                    greeting = thisWeekMessages.random()
                } else {
                    greeting = farAwayMessages.random()
                }
            }
        }
        
        if (greeting == null) {
            val dailyQuotes = mapOf(
                Calendar.MONDAY to listOf("Let's crush this\nMonday! 🚀", "New week,\nnew goals! 💪", "Monday momentum\nstarts now!"),
                Calendar.TUESDAY to listOf("Terrific\nTuesday awaits! ✨", "Keep the\nmomentum going! 🔥", "Tackle those\ntasks today!"),
                Calendar.WEDNESDAY to listOf("Happy\nHump Day! 🐪", "Halfway through\nthe week! 🎯", "Keep pushing,\nit's Wednesday!"),
                Calendar.THURSDAY to listOf("Thrilling\nThursday! ⚡", "Almost Friday!\nStay focused! 📚", "Finish strong\ntoday!"),
                Calendar.FRIDAY to listOf("TGIF! Let's finish\nthe week strong! 🎉", "Friday focus\nmode activated! 🔋", "One last push\nfor the week!"),
                Calendar.SATURDAY to listOf("Happy\nSaturday! Make it count! 🌟", "Weekend grind\nor unwind? ☕", "Super\nSaturday!"),
                Calendar.SUNDAY to listOf("Ready to conquer\nSunday? 👑", "Sunday reset\nand prep! 📅", "Easy like\nSunday morning! ☕")
            )
            val quotesForDay = dailyQuotes[dayOfWeek] ?: listOf("Ready to conquer\n$todayName?")
            greeting = quotesForDay[dayOfYear % quotesForDay.size]
        }
        
        greeting
    }

    val haptic = LocalHapticFeedback.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // --- Header Section ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                val greetingName = if (userName.isNotBlank()) userName else "Student"
                Text(
                    text = "Good morning, $greetingName",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(4.dp))
                val annotatedGreeting = buildAnnotatedString {
                    val words = dynamicGreeting.split(" ")
                    words.forEachIndexed { index, word ->
                        if (word.contains(todayName) || word.contains(todayName.lowercase()) || word.contains(todayName.uppercase())) {
                            withStyle(style = SpanStyle(color = PrimaryAccent)) {
                                append(word)
                            }
                        } else {
                            append(word)
                        }
                        if (index < words.size - 1) append(" ")
                    }
                }
                Text(
                    text = annotatedGreeting,
                    style = MaterialTheme.typography.headlineLarge,
                    color = MaterialTheme.colorScheme.onBackground,
                    fontWeight = FontWeight.Bold,
                    lineHeight = 40.sp
                )
            }
            IconButton(onClick = { 
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                onProfileClick() 
            }) {
                Box(
                    modifier = Modifier.size(48.dp).clip(CircleShape).background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    if (profileImagePath != null) {
                        coil.compose.AsyncImage(
                            model = profileImagePath,
                            contentDescription = "Profile Picture",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = androidx.compose.ui.layout.ContentScale.Crop
                        )
                    } else {
                        Icon(imageVector = Icons.Filled.Person, contentDescription = "Profile", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(24.dp))
                    }
                }
            }
        }

        // --- Quick Stats Section ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            StatCard(
                icon = Icons.Filled.Schedule,
                label = "Classes",
                value = remember(todaySchedule) { todaySchedule.count { it is ScheduleItem.ClassItem }.toString() },
                color = PrimaryAccent,
                modifier = Modifier.weight(1f)
            )
            StatCard(
                icon = Icons.Filled.Book,
                label = "Study",
                value = remember(todaySchedule) { todaySchedule.count { it is ScheduleItem.StudyItem }.toString() },
                color = BlueAccent,
                modifier = Modifier.weight(1f)
            )
            StatCard(
                icon = Icons.AutoMirrored.Filled.TrendingUp,
                label = "Completed",
                value = completedSessionsCount.toString(),
                color = WarningOrange,
                modifier = Modifier.weight(1f)
            )
        }

        // --- Weekly Progress Section ---
        AdaptivePremiumCard {
            WeeklyProgressCard(studiedMinutes = totalStudyMinutes, goalHours = weeklyGoalHours)
        }

        // --- Quick Actions ---
        Text(
            text = "Quick Actions",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground,
            fontWeight = FontWeight.Bold
        )
        
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            QuickActionItem(icon = Icons.Filled.Add, label = "New Session", color = BlueAccent, onClick = onNewSessionClick, modifier = Modifier.weight(1f))
            QuickActionItem(icon = Icons.Filled.ChatBubbleOutline, label = "Ask Evans", color = PrimaryAccent, onClick = onAskEvansClick, modifier = Modifier.weight(1f))
        }

        // --- Today's Schedule ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Today's Schedule",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onBackground,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "See All",
                style = MaterialTheme.typography.labelMedium,
                color = PrimaryAccent,
                modifier = Modifier.padding(4.dp)
            )
        }

        if (todaySchedule.isEmpty()) {
            AdaptivePremiumCard(backgroundColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)) {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                                .background(Color.White),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.CheckCircleOutline, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(40.dp))
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "You're all caught up!",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "No more classes or sessions today.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            todaySchedule.forEach { item ->
                ScheduleItemCard(item)
            }
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}

@Composable
private fun QuickActionItem(icon: ImageVector, label: String, color: Color, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val isDark = androidx.compose.foundation.isSystemInDarkTheme()
    AdaptivePremiumCard(modifier = modifier, elevation = 0.dp, onClick = onClick) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .shadow(
                        elevation = if (isDark) 8.dp else 12.dp, 
                        shape = CircleShape, 
                        ambientColor = if (isDark) color else color.copy(alpha = 0.3f), 
                        spotColor = if (isDark) color else color.copy(alpha = 0.5f)
                    )
                    .clip(CircleShape)
                    .background(if (isDark) Color(0xFF181824) else Color.White),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = label, tint = color, modifier = Modifier.size(24.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onBackground, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun StatCard(
    icon: ImageVector, label: String, value: String, color: Color, modifier: Modifier = Modifier
) {
    val isDark = androidx.compose.foundation.isSystemInDarkTheme()
    AdaptivePremiumCard(
        modifier = modifier.animateContentSize(animationSpec = spring(stiffness = Spring.StiffnessLow)),
        elevation = 2.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .shadow(
                        elevation = if (isDark) 6.dp else 8.dp, 
                        shape = CircleShape, 
                        ambientColor = if (isDark) color else color.copy(alpha = 0.3f), 
                        spotColor = if (isDark) color else color.copy(alpha = 0.5f)
                    )
                    .clip(CircleShape)
                    .background(if (isDark) Color(0xFF181824) else Color.White),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = label, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = value, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground, fontWeight = FontWeight.Bold)
            Text(text = label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun WeeklyProgressCard(studiedMinutes: Int, goalHours: Float) {
    val studiedHours = studiedMinutes / 60f
    val progress = if (goalHours > 0f) (studiedHours / goalHours).coerceIn(0f, 1f) else 0f
    val animatedProgress by animateFloatAsState(
        targetValue = progress, animationSpec = spring(stiffness = Spring.StiffnessLow), label = "progress"
    )

    Row(
        modifier = Modifier.fillMaxWidth().padding(24.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Box(modifier = Modifier.size(100.dp), contentAlignment = Alignment.Center) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val strokeWidth = 12.dp.toPx()
                val radius = (size.minDimension - strokeWidth) / 2
                val topLeft = Offset((size.width - radius * 2) / 2, (size.height - radius * 2) / 2)
                val arcSize = Size(radius * 2, radius * 2)
                drawArc(
                    color = Color.White.copy(alpha = 0.05f), startAngle = 0f, sweepAngle = 360f,
                    useCenter = false, topLeft = topLeft, size = arcSize,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )
                drawArc(
                    color = PrimaryAccent,
                    startAngle = -90f, sweepAngle = 360f * animatedProgress,
                    useCenter = false, topLeft = topLeft, size = arcSize,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = String.format("%.1f", studiedHours), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Text(text = "hrs", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Column(modifier = Modifier.weight(1f)) {
            val titleColor = if (androidx.compose.foundation.isSystemInDarkTheme()) Color.White else MaterialTheme.colorScheme.onBackground
            Text(text = "Weekly Progress", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, color = titleColor)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "${String.format("%.1f", studiedHours)} of ${String.format("%.0f", goalHours)} hours", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(12.dp))
            LinearProgressIndicator(
                progress = { animatedProgress },
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                color = PrimaryAccent, trackColor = PrimaryAccent.copy(alpha = 0.1f),
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = "0%", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(text = "${(progress * 100).toInt()}%", style = MaterialTheme.typography.labelSmall, color = PrimaryAccent, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun ScheduleItemCard(item: ScheduleItem) {
    val isDark = androidx.compose.foundation.isSystemInDarkTheme()
    val title: String
    val subtitle: String
    val colorIdx: Int
    val timeText: String
    val isStudy: Boolean

    when (item) {
        is ScheduleItem.ClassItem -> {
            val c = item.course
            title = c.name
            subtitle = "${c.lecturer} \u2022 ${c.room}"
            colorIdx = c.colorIndex
            timeText = "${String.format("%02d", c.startHour)}:${String.format("%02d", c.startMinute)} - ${String.format("%02d", c.endHour)}:${String.format("%02d", c.endMinute)}"
            isStudy = false
        }
        is ScheduleItem.StudyItem -> {
            val s = item.session
            title = s.courseName
            val endMin = s.startHour * 60 + s.startMinute + s.durationMinutes
            subtitle = "Study Session \u2022 ${s.durationMinutes} min"
            colorIdx = s.colorIndex
            timeText = "${String.format("%02d", s.startHour)}:${String.format("%02d", s.startMinute)} - ${String.format("%02d", endMin / 60)}:${String.format("%02d", endMin % 60)}"
            isStudy = true
        }
    }

    val color = CourseColors.getOrElse(colorIdx) { CourseColors[0] }

    AdaptivePremiumCard(elevation = 1.dp) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .shadow(
                        elevation = if (isDark) 8.dp else 12.dp, 
                        shape = RoundedCornerShape(12.dp), 
                        ambientColor = if (isDark) color else color.copy(alpha = 0.3f), 
                        spotColor = if (isDark) color else color.copy(alpha = 0.5f)
                    )
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (isDark) Color(0xFF181824) else Color.White),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isStudy) Icons.Filled.Book else Icons.Filled.School,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)
                Text(text = subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(text = timeText, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onBackground, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(color))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (isStudy) "Study" else "Class",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}



