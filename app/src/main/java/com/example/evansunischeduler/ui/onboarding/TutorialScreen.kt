package com.example.evansunischeduler.ui.onboarding

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.evansunischeduler.R
import com.example.evansunischeduler.theme.*
import com.example.evansunischeduler.ui.components.glassCard
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*

@Composable
fun TutorialScreen(
    onDismiss: () -> Unit,
    onStepChange: (Int) -> Unit = {}
) {
    var step by remember { mutableIntStateOf(0) }
    
    LaunchedEffect(Unit) {
        onStepChange(0)
    }

    val tutorialData = listOf(
        Pair("Welcome to ES Planner! I'm Evans, your personal scheduling assistant. Let me show you around!", Icons.Filled.Person),
        Pair("First, add your university classes to your schedule. You can set up custom colors and locations.", Icons.Filled.DateRange),
        Pair("Next, plan your study sessions! I'll remind you when to start and when to take a break.", Icons.Filled.Timer),
        Pair("Don't forget to track your progress and hit your weekly study goals!", Icons.Filled.CheckCircle),
        Pair("Log what you learned in your Journal. You can even record quick video reflections!", Icons.AutoMirrored.Filled.MenuBook),
        Pair("Check out your Profile & Settings! You can upload a custom profile picture and switch to our stunning Dark Mode.", Icons.Filled.Palette),
        Pair("Custom Voice Reminders! You can record your own voice to play when it's time to study.", Icons.Filled.Mic),
        Pair("And remember, if you ever need help, just tap my face in the bottom corner to chat with Evans AI!", Icons.Filled.Star)
    )

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
    } // Empty box for overlay base
    
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        com.example.evansunischeduler.ui.components.AdaptivePremiumCard(
            modifier = Modifier.fillMaxWidth(0.9f),
            elevation = 16.dp
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(PrimaryAccent.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.assistant_avatar),
                    contentDescription = "Evans Assistant",
                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            
            AnimatedContent(
                targetState = step,
                transitionSpec = {
                    (fadeIn(animationSpec = tween(220, delayMillis = 90)) +
                            slideInHorizontally(initialOffsetX = { fullWidth -> if (targetState > initialState) fullWidth else -fullWidth }))
                        .togetherWith(fadeOut(animationSpec = tween(90)) +
                            slideOutHorizontally(targetOffsetX = { fullWidth -> if (targetState > initialState) -fullWidth else fullWidth }))
                },
                label = "tutorial_animation"
            ) { currentStep ->
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = tutorialData[currentStep].second,
                        contentDescription = null,
                        tint = PrimaryAccent,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = tutorialData[currentStep].first,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.height(100.dp) // Fixed height to prevent jumping
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Progress Dots
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                tutorialData.indices.forEach { index ->
                    val isSelected = index == step
                    Box(
                        modifier = Modifier
                            .size(if (isSelected) 10.dp else 8.dp)
                            .clip(CircleShape)
                            .background(if (isSelected) PrimaryAccent else Color.Gray.copy(alpha = 0.3f))
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                TextButton(onClick = {
                    if (step > 0) {
                        step--
                        onStepChange(step)
                    } else {
                        onDismiss()
                    }
                }) {
                    Text(if (step > 0) "Back" else "Skip", color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold)
                }
                
                Button(
                    onClick = {
                        if (step < tutorialData.size - 1) {
                            step++
                            onStepChange(step)
                        } else {
                            onDismiss()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
                ) {
                    Text(if (step < tutorialData.size - 1) "Next" else "Let's Go!", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
}
