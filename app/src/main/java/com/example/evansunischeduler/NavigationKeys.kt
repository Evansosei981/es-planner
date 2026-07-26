package com.example.evansunischeduler

import kotlinx.serialization.Serializable

@Serializable data object MainScreen // Wrapper for bottom nav area

// Onboarding & Other main screens
@Serializable data object OnboardingFlow
@Serializable data object ProfileScreen

// Sub-screens that overlay or push on top
@Serializable data object ClassesScreen
@Serializable data class TimerScreen(val sessionId: Long)

@Serializable data object ActivationScreen
@Serializable data object AdminScreen

@Serializable data object HomeTab
@Serializable data object ScheduleTab
@Serializable data object JournalTab
@Serializable data object StudyTab
@Serializable data object ProgressTab
