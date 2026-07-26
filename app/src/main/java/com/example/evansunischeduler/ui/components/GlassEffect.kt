package com.example.evansunischeduler.ui.components

import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.graphics.luminance
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.draw.shadow
import com.example.evansunischeduler.theme.PrimaryAccent
import com.example.evansunischeduler.theme.SecondaryAccent

fun Modifier.glassCard(
    shape: Shape = RoundedCornerShape(24.dp), // Matched to design spec
    borderWidth: Dp = 1.dp,
    darkTheme: Boolean? = null
): Modifier = composed {
    val isDark = darkTheme ?: isSystemInDarkTheme()
    
    // Premium translucent backgrounds
    val backgroundBrush = if (isDark) {
        SolidColor(Color(0xFF181820).copy(alpha = 0.72f)) // approximately rgba(24,24,32,0.72)
    } else {
        androidx.compose.ui.graphics.Brush.linearGradient(
            colors = listOf(
                Color.White.copy(alpha = 0.85f),
                Color.White.copy(alpha = 0.65f)
            )
        )
    }
    
    // Glowing inner border
    val borderBrush = if (isDark) {
        SolidColor(Color.White.copy(alpha = 0.10f))
    } else {
        androidx.compose.ui.graphics.Brush.linearGradient(
            colors = listOf(
                Color.White,
                Color.White.copy(alpha = 0.4f),
                Color.White.copy(alpha = 0.8f)
            )
        )
    }

    val shadowModifier = if (isDark) {
        Modifier.shadow(
            elevation = 16.dp, 
            shape = shape, 
            ambientColor = PrimaryAccent.copy(alpha = 0.1f), 
            spotColor = Color.Black.copy(alpha = 0.5f)
        )
    } else {
        Modifier
    }

    this
        .then(shadowModifier)
        .clip(shape)
        .background(backgroundBrush)
        .border(width = borderWidth, brush = borderBrush, shape = shape)
}
