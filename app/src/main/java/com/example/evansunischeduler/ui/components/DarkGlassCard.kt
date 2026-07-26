package com.example.evansunischeduler.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun DarkGlassCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(24.dp),
    elevation: Dp = 12.dp, // Soft black shadow with purple glow 0 12dp 32dp
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit
) {
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = tween(durationMillis = 150),
        label = "DarkGlassCardScale"
    )

    // Background: rgba(18,18,24,0.72) 
    val bgColor = Color(0xFF121218).copy(alpha = 0.72f)
    
    // Border: 1dp rgba(255,255,255,0.10)
    val borderColor = Color.White.copy(alpha = 0.10f)

    // Shadow: Soft black shadow 0 12dp 32dp rgba(0,0,0,0.45) with purple glow
    val purpleGlow = Color(0xFF7C5CFC).copy(alpha = 0.08f)
    val shadowColor = Color.Black.copy(alpha = 0.45f)

    val baseModifier = modifier
        .fillMaxWidth()
        .graphicsLayer {
            scaleX = scale
            scaleY = scale
        }
        .shadow(
            elevation = elevation,
            shape = shape,
            ambientColor = purpleGlow,
            spotColor = shadowColor
        )
        .clip(shape)
        .background(bgColor)
        .border(1.dp, borderColor, shape)
        
    val clickableModifier = if (onClick != null) {
        baseModifier.pointerInput(Unit) {
            detectTapGestures(
                onPress = {
                    isPressed = true
                    tryAwaitRelease()
                    isPressed = false
                },
                onTap = { onClick() }
            )
        }
    } else {
        baseModifier
    }

    Box(
        modifier = clickableModifier,
        content = content
    )
}
