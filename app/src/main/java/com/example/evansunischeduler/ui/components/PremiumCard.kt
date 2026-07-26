package com.example.evansunischeduler.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.graphics.graphicsLayer
import com.example.evansunischeduler.ui.components.glassCard
@Composable
fun PremiumCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(24.dp),
    backgroundColor: Color = MaterialTheme.colorScheme.surface,
    elevation: Dp = 8.dp,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit
) {
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = tween(durationMillis = 150),
        label = "PremiumCardScale"
    )

    val bgBrush = androidx.compose.ui.graphics.Brush.linearGradient(
        colors = listOf(
            Color.White.copy(alpha = 0.95f),
            Color.White.copy(alpha = 0.80f)
        )
    )
    val borderBrush = androidx.compose.ui.graphics.Brush.linearGradient(
        colors = listOf(
            Color.White,
            Color.White.copy(alpha = 0.5f)
        )
    )

    val baseModifier = modifier
        .fillMaxWidth()
        .graphicsLayer {
            scaleX = scale
            scaleY = scale
        }
        .shadow(
            elevation = 16.dp,
            shape = shape,
            spotColor = Color.Black.copy(alpha = 0.08f),
            ambientColor = Color.Black.copy(alpha = 0.02f)
        )
        .clip(shape)
        .background(bgBrush)
        .border(1.dp, borderBrush, shape)
        
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
