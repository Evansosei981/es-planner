package com.example.evansunischeduler.ui.components

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.evansunischeduler.ui.AppViewModel

@Composable
fun AdaptivePremiumCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(24.dp),
    backgroundColor: Color = MaterialTheme.colorScheme.surface,
    elevation: Dp = 8.dp,
    onClick: (() -> Unit)? = null,
    viewModel: AppViewModel = viewModel(),
    content: @Composable BoxScope.() -> Unit
) {
    val themePreference by viewModel.themePreference.collectAsState(initial = "SYSTEM")
    val isDark = when(themePreference) {
        "DARK" -> true
        "LIGHT" -> false
        else -> isSystemInDarkTheme()
    }

    if (isDark) {
        DarkGlassCard(
            modifier = modifier,
            shape = shape,
            elevation = 12.dp,
            onClick = onClick,
            content = content
        )
    } else {
        PremiumCard(
            modifier = modifier,
            shape = shape,
            backgroundColor = backgroundColor,
            elevation = elevation,
            onClick = onClick,
            content = content
        )
    }
}
