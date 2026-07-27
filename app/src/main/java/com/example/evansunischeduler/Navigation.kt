package com.example.evansunischeduler

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.foundation.border
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.evansunischeduler.theme.PrimaryAccent
import com.example.evansunischeduler.ui.AppViewModel
import com.example.evansunischeduler.ui.home.HomeScreen
import com.example.evansunischeduler.ui.schedule.ScheduleScreen
import com.example.evansunischeduler.ui.classes.ClassesScreen
import com.example.evansunischeduler.ui.study.StudyScreen
import com.example.evansunischeduler.ui.progress.ProgressScreen
import com.example.evansunischeduler.ui.timer.TimerScreen
import com.example.evansunischeduler.data.StudySession
import com.example.evansunischeduler.data.Course
import com.example.evansunischeduler.ui.profile.ProfileScreen
import com.example.evansunischeduler.ui.ai.GeminiViewModel
import com.example.evansunischeduler.ui.components.glassCard

import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val index: Int
)

@Composable
fun MainNavigation(
    viewModel: AppViewModel = viewModel()
) {
    val navController = rememberNavController()
    val hasCompletedOnboarding by viewModel.hasCompletedOnboarding.collectAsStateWithLifecycle()

    if (hasCompletedOnboarding == null) {
        return
    }

    val isActivated = com.example.evansunischeduler.security.SecurityManager.isAppActivated(androidx.compose.ui.platform.LocalContext.current)

    NavHost(
        navController = navController,
        startDestination = if (!isActivated) ActivationScreen else if (hasCompletedOnboarding == true) MainScreen else OnboardingFlow
    ) {
        composable<ActivationScreen> {
            com.example.evansunischeduler.ui.security.ActivationScreen(
                onActivated = {
                    navController.navigate(if (hasCompletedOnboarding == true) MainScreen else OnboardingFlow) {
                        popUpTo(ActivationScreen) { inclusive = true }
                    }
                },
                onAdminLogin = {
                    navController.navigate(AdminScreen)
                }
            )
        }
        
        composable<AdminScreen> {
            com.example.evansunischeduler.ui.security.AdminScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<OnboardingFlow> {
            var onboardingStep by remember { mutableIntStateOf(0) }
            if (onboardingStep == 0) {
                com.example.evansunischeduler.ui.onboarding.OnboardingScreen(
                    onFinishOnboarding = { onboardingStep = 1 }
                )
            } else {
                com.example.evansunischeduler.ui.onboarding.ProfileSetupScreen(
                    onCompleteSetup = { name, major, mins ->
                        viewModel.completeOnboarding(name, major, mins)
                        navController.navigate(MainScreen) {
                            popUpTo(OnboardingFlow) { inclusive = true }
                        }
                    }
                )
            }
        }

        composable<MainScreen> {
            MainAppScreen(viewModel, navController)
        }

        composable<ProfileScreen> {
            val userName by viewModel.userName.collectAsStateWithLifecycle()
            val notificationMinutes by viewModel.notificationMinutes.collectAsStateWithLifecycle()
            val themePreference by viewModel.themePreference.collectAsStateWithLifecycle()
            val voiceReminderType by viewModel.voiceReminderType.collectAsStateWithLifecycle()
            val customVoiceFilePath by viewModel.customVoiceFilePath.collectAsStateWithLifecycle()
            val profileImagePath by viewModel.profileImagePath.collectAsStateWithLifecycle()

            ProfileScreen(
                currentName = userName,
                currentNotificationMinutes = notificationMinutes,
                currentTheme = themePreference,
                currentVoiceType = voiceReminderType,
                currentCustomVoicePath = customVoiceFilePath,
                currentProfileImagePath = profileImagePath,
                onSaveProfile = { name, mins ->
                    viewModel.setUserName(name)
                    viewModel.setNotificationMinutes(mins)
                },
                onThemeChange = { theme -> viewModel.setThemePreference(theme) },
                onVoiceTypeChange = { type -> viewModel.setVoiceReminderType(type) },
                onCustomVoiceRecorded = { path -> viewModel.setCustomVoiceFilePath(path) },
                onProfileImageSelected = { path -> viewModel.setProfileImagePath(path) },
                onNavigateBack = { navController.popBackStack() },
                onAdminLogin = { navController.navigate(AdminScreen) }
            )
        }

        composable<ClassesScreen> {
            val courses by viewModel.allCourses.collectAsStateWithLifecycle()
            ClassesScreen(
                courses = courses,
                onAddCourse = { viewModel.addCourse(it) },
                onDeleteCourse = { viewModel.deleteCourse(it) }
            )
            // Add a back button overlay
            Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                FloatingActionButton(
                    onClick = { navController.popBackStack() },
                    modifier = Modifier.align(Alignment.TopEnd).padding(top = 16.dp),
                    containerColor = PrimaryAccent
                ) {
                    Text(stringResource(R.string.action_done), modifier = Modifier.padding(horizontal = 16.dp), color = Color.White, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                }
            }
        }

        composable<TimerScreen> { backStackEntry ->
            val timerRoute = backStackEntry.toRoute<TimerScreen>()
            val sessions by viewModel.allSessions.collectAsStateWithLifecycle()
            val session = sessions.find { it.id == timerRoute.sessionId }
            
            var isRecordingVideo by remember { mutableStateOf(false) }
            var activeTimerVideoUri by remember { mutableStateOf<String?>(null) }

            if (isRecordingVideo) {
                com.example.evansunischeduler.ui.journal.VideoRecordingScreen(
                    onVideoRecorded = { uri ->
                        activeTimerVideoUri = uri.toString()
                        isRecordingVideo = false
                    },
                    onCancel = { isRecordingVideo = false }
                )
            } else if (session != null) {
                TimerScreen(
                    session = session,
                    onNavigateBack = { navController.popBackStack() },
                    onSessionCompleted = { completedSession, notes, videoUri ->
                        viewModel.toggleSessionComplete(completedSession)
                        if (notes.isNotBlank() || videoUri != null) {
                            viewModel.addLearningNote(
                                com.example.evansunischeduler.data.LearningNote(
                                    relatedId = completedSession.id,
                                    type = "STUDY_SESSION",
                                    title = completedSession.courseName,
                                    content = notes,
                                    videoUri = videoUri
                                )
                            )
                        }
                    },
                    onStartVideoRecording = { isRecordingVideo = true },
                    recordedVideoUri = activeTimerVideoUri
                )
            } else {
                // Session not found or deleted
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            }
        }
    }
}

@Composable
fun MainAppScreen(
    viewModel: AppViewModel,
    rootNavController: androidx.navigation.NavController,
    geminiViewModel: GeminiViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
) {
    val navItems = listOf(
        BottomNavItem(stringResource(R.string.nav_home), Icons.Filled.Home, 0),
        BottomNavItem(stringResource(R.string.nav_schedule), Icons.Filled.DateRange, 1),
        BottomNavItem(stringResource(R.string.nav_journal), Icons.Filled.Book, 2),
        BottomNavItem(stringResource(R.string.nav_study), Icons.Filled.School, 3),
        BottomNavItem(stringResource(R.string.nav_progress), Icons.AutoMirrored.Filled.TrendingUp, 4)
    )

    var selectedIndex by remember { mutableIntStateOf(0) }
    var activeClassNote by remember { mutableStateOf<Course?>(null) }
    var classNoteText by remember { mutableStateOf("") }
    var activeTimerVideoUri by remember { mutableStateOf<String?>(null) }
    var isRecordingVideo by remember { mutableStateOf(false) }
    val context = androidx.compose.ui.platform.LocalContext.current
    val prefs = remember { context.getSharedPreferences("evans_prefs", android.content.Context.MODE_PRIVATE) }
    var showTutorial by remember { mutableStateOf(!prefs.getBoolean("has_seen_tutorial", false)) }
    var showEvansAi by remember { mutableStateOf(false) }

    val userName by viewModel.userName.collectAsStateWithLifecycle()
    val courses by viewModel.allCourses.collectAsStateWithLifecycle()
    val sessions by viewModel.allSessions.collectAsStateWithLifecycle()
    val upcomingExams by viewModel.upcomingExams.collectAsStateWithLifecycle()
    val totalStudyMinutes by viewModel.totalStudyMinutes.collectAsStateWithLifecycle()
    val weeklyGoalHours by viewModel.weeklyGoalHours.collectAsStateWithLifecycle()
    val completedCount by viewModel.completedSessionsCount.collectAsStateWithLifecycle()
    val todaySchedule by viewModel.todaySchedule.collectAsStateWithLifecycle()
    val courseStats by viewModel.courseStats.collectAsStateWithLifecycle()
    val allNotes by viewModel.allNotes.collectAsStateWithLifecycle()
    val profileImagePath by viewModel.profileImagePath.collectAsStateWithLifecycle()
    val currentTime by viewModel.currentTimeFlow.collectAsStateWithLifecycle()
    val haptic = LocalHapticFeedback.current


    if (isRecordingVideo) {
        com.example.evansunischeduler.ui.journal.VideoRecordingScreen(
            onVideoRecorded = { uri ->
                activeTimerVideoUri = uri.toString()
                isRecordingVideo = false
            },
            onCancel = { isRecordingVideo = false }
        )
        return
    }

    if (activeClassNote != null) {
        val course = activeClassNote!!
        AlertDialog(
            onDismissRequest = {
                activeClassNote = null
                classNoteText = ""
                activeTimerVideoUri = null
            },
            title = { Text(stringResource(R.string.log_note_title, course.name)) },
            text = {
                Column {
                    OutlinedTextField(
                        value = classNoteText,
                        onValueChange = { classNoteText = it },
                        label = { Text(stringResource(R.string.log_note_label)) },
                        maxLines = 5,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { isRecordingVideo = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Filled.Videocam, contentDescription = "Video")
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (activeTimerVideoUri != null) stringResource(R.string.video_attached) else stringResource(R.string.record_video))
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    if (classNoteText.isNotBlank() || activeTimerVideoUri != null) {
                        viewModel.addLearningNote(
                            com.example.evansunischeduler.data.LearningNote(
                                relatedId = course.id,
                                type = "COURSE",
                                title = course.name,
                                content = classNoteText,
                                videoUri = activeTimerVideoUri
                            )
                        )
                    }
                    activeClassNote = null
                    classNoteText = ""
                    activeTimerVideoUri = null
                }) {
                    Text(stringResource(R.string.save_note))
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    activeClassNote = null
                    classNoteText = ""
                    activeTimerVideoUri = null
                }) {
                    Text(stringResource(R.string.action_cancel))
                }
            }
        )
    }

    val themePreference by viewModel.themePreference.collectAsStateWithLifecycle()
    val isDark = when(themePreference) {
        "DARK" -> true
        "LIGHT" -> false
        else -> androidx.compose.foundation.isSystemInDarkTheme()
    }
    val gradientBrush = remember(isDark) {
        Brush.linearGradient(
            colors = if (isDark) {
                listOf(com.example.evansunischeduler.theme.GlassGradientDarkStart, com.example.evansunischeduler.theme.GlassGradientDarkEnd)
            } else {
                listOf(com.example.evansunischeduler.theme.GlassGradientStart, com.example.evansunischeduler.theme.GlassGradientEnd)
            }
        )
    }

    Box(modifier = Modifier.fillMaxSize().background(gradientBrush)) {
        Scaffold(
            containerColor = Color.Transparent,
            modifier = Modifier.fillMaxSize(),
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { showEvansAi = true },
                    containerColor = PrimaryAccent,
                    contentColor = Color.White
                ) {
                    Image(
                        painter = androidx.compose.ui.res.painterResource(id = R.drawable.assistant_avatar),
                        contentDescription = "Ask Evans",
                        modifier = Modifier.size(24.dp).clip(androidx.compose.foundation.shape.CircleShape)
                    )
                }
            },
            bottomBar = {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 16.dp)
                ) {
                    NavigationBar(
                        modifier = Modifier
                            .fillMaxWidth()
                            .then(
                                if (isDark) {
                                    Modifier
                                        .shadow(16.dp, RoundedCornerShape(32.dp), spotColor = Color.Black.copy(alpha=0.45f))
                                        .clip(RoundedCornerShape(32.dp))
                                        .background(Color(0xFF121218).copy(alpha = 0.80f))
                                        .border(1.dp, Color.White.copy(alpha = 0.10f), RoundedCornerShape(32.dp))
                                } else {
                                    Modifier.clip(RoundedCornerShape(32.dp)).background(Color.White.copy(alpha = 0.8f))
                                }
                            ),
                        containerColor = Color.Transparent,
                        tonalElevation = 0.dp
                    ) {
                    navItems.forEach { item ->
                        NavigationBarItem(
                            icon = { Icon(imageVector = item.icon, contentDescription = item.label) },
                            label = { Text(item.label) },
                            selected = selectedIndex == item.index,
                            onClick = {
                                if (selectedIndex != item.index) {
                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                    selectedIndex = item.index
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = PrimaryAccent,
                                selectedTextColor = Color.White,
                                indicatorColor = PrimaryAccent.copy(alpha = 0.1f),
                                unselectedIconColor = if (isDark) Color(0xFF8A8FA5) else Color.Gray,
                                unselectedTextColor = if (isDark) Color(0xFF8A8FA5) else Color.Gray
                            )
                        )
                    }
                }
                }
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Top))
            ) {
                AnimatedContent(
                    targetState = selectedIndex,
                    transitionSpec = {
                        fadeIn(animationSpec = tween(300)) togetherWith fadeOut(animationSpec = tween(300))
                    },
                    label = "navigation_animation"
                ) { targetIndex ->
                    when (targetIndex) {
                        0 -> com.example.evansunischeduler.ui.home.HomeScreen(
                            userName = userName,
                            profileImagePath = profileImagePath,
                            todaySchedule = todaySchedule,
                            upcomingExams = upcomingExams,
                            totalStudyMinutes = totalStudyMinutes,
                            weeklyGoalHours = weeklyGoalHours,
                            completedSessionsCount = completedCount,
                            currentTime = currentTime,
                            onProfileClick = { rootNavController.navigate(ProfileScreen) },
                            onShowTutorial = { showTutorial = true },
                            onNewSessionClick = { selectedIndex = 3 },
                            onAskEvansClick = { showEvansAi = true }
                        )
                        1 -> com.example.evansunischeduler.ui.schedule.ScheduleScreen(
                            courses = courses,
                            studySessions = sessions,
                            upcomingExams = upcomingExams,
                            currentTime = currentTime,
                            onAddExam = { viewModel.addExam(it) },
                            onDeleteExam = { viewModel.deleteExam(it) },
                            onClassNoteClick = { activeClassNote = it },
                            onManageClassesClick = { rootNavController.navigate(ClassesScreen) }
                        )
                        2 -> com.example.evansunischeduler.ui.journal.JournalScreen(
                            notes = allNotes
                        )
                        3 -> StudyScreen(
                            courses = courses,
                            studySessions = sessions,
                            onAddSession = { viewModel.addStudySession(it) },
                            onToggleComplete = { viewModel.toggleSessionComplete(it) },
                            onDeleteSession = { viewModel.deleteStudySession(it) },
                            onSessionClick = { rootNavController.navigate(TimerScreen(it.id)) }
                        )
                        4 -> ProgressScreen(
                            totalStudyMinutes = totalStudyMinutes,
                            weeklyGoalHours = weeklyGoalHours,
                            courseStats = courseStats,
                            completedSessionsCount = completedCount
                        )
                    }
                }
                
                if (showTutorial) {
                    com.example.evansunischeduler.ui.onboarding.TutorialScreen(
                        onDismiss = { 
                            prefs.edit().putBoolean("has_seen_tutorial", true).apply()
                            showTutorial = false 
                        },
                        onStepChange = { step ->
                            when(step) {
                                0 -> { selectedIndex = 0; showEvansAi = false } // Home
                                1 -> selectedIndex = 1 // Schedule
                                2 -> selectedIndex = 3 // Focus/Study
                                3 -> selectedIndex = 4 // Progress
                                4 -> selectedIndex = 2 // Journal
                                5 -> selectedIndex = 0 // Profile settings mentioned
                                6 -> selectedIndex = 0 // Custom voice mentioned
                                7 -> {
                                    selectedIndex = 0
                                }
                            }
                        }
                    )
                }
            }

            if (showEvansAi) {
                com.example.evansunischeduler.ui.components.EvansAiBottomSheet(
                    viewModel = geminiViewModel,
                    onDismissRequest = { showEvansAi = false }
                )
            }
        }
    }
}
