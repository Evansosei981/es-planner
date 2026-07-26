package com.example.evansunischeduler.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import android.os.Build
import androidx.compose.ui.platform.LocalContext

private val LightColorScheme = lightColorScheme(
    primary = PrimaryAccent,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE0E7FF),
    onPrimaryContainer = Color(0xFF312E81),
    secondary = SecondaryAccent,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFCCFBF1),
    onSecondaryContainer = Color(0xFF134E4A),
    tertiary = PrimaryBlack,
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFE5E7EB),
    onTertiaryContainer = Color(0xFF111827),
    error = DangerRed,
    onError = Color.White,
    background = BackgroundLight,
    onBackground = TextPrimaryLight,
    surface = SurfaceLight,
    onSurface = TextPrimaryLight,
    surfaceVariant = Color(0xFFF3F4F6),
    onSurfaceVariant = TextSecondaryLight,
    outline = Color(0xFFD1D5DB),
    outlineVariant = Color(0xFFE5E7EB),
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryAccent,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF3730A3),
    onPrimaryContainer = Color(0xFFE0E7FF),
    secondary = SecondaryAccent,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFF0F766E),
    onSecondaryContainer = Color(0xFFCCFBF1),
    tertiary = PrimaryWhite,
    onTertiary = Color.Black,
    tertiaryContainer = Color(0xFF374151),
    onTertiaryContainer = Color(0xFFF9FAFB),
    error = Color(0xFFF87171),
    onError = Color(0xFF450A0A),
    background = BackgroundDark,
    onBackground = TextPrimaryDark,
    surface = SurfaceDark,
    onSurface = TextPrimaryDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = TextSecondaryDark,
    outline = Color(0xFF6B7280),
    outlineVariant = Color(0xFF4B5563),
)

@Composable
fun EvansUniSchedulerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Set dynamicColor to false by default for a consistent premium brand experience
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
