package com.example.evansunischeduler.ui.progress

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.evansunischeduler.data.CourseStudyStats
import com.example.evansunischeduler.theme.*
import com.example.evansunischeduler.ui.components.PremiumCard
import com.example.evansunischeduler.ui.components.AdaptivePremiumCard
import com.example.evansunischeduler.ui.components.ConfettiScreen

@Composable
fun ProgressScreen(
    totalStudyMinutes: Int,
    weeklyGoalHours: Float,
    courseStats: List<CourseStudyStats>,
    completedSessionsCount: Int,
    modifier: Modifier = Modifier
) {
    val totalHours = totalStudyMinutes / 60f
    val progress = if (weeklyGoalHours > 0) (totalHours / weeklyGoalHours).coerceIn(0f, 1f) else 0f
    val animatedProgress by animateFloatAsState(targetValue = progress, animationSpec = spring(stiffness = Spring.StiffnessLow), label = "progress")

    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            Spacer(modifier = Modifier.height(20.dp))
            Text(text = "My Progress", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            
            // Main progress ring
            AdaptivePremiumCard {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(modifier = Modifier.size(160.dp), contentAlignment = Alignment.Center) {
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val strokeWidth = 16.dp.toPx()
                                val radius = (size.minDimension - strokeWidth) / 2
                                val topLeft = Offset((size.width - radius * 2) / 2, (size.height - radius * 2) / 2)
                                val arcSize = Size(radius * 2, radius * 2)
                                drawArc(color = PrimaryAccent.copy(alpha = 0.1f), startAngle = 0f, sweepAngle = 360f, useCenter = false, topLeft = topLeft, size = arcSize, style = Stroke(width = strokeWidth, cap = StrokeCap.Round))
                                drawArc(brush = Brush.sweepGradient(colors = listOf(PrimaryAccent, SecondaryAccent, PrimaryAccent, PrimaryAccent)), startAngle = -90f, sweepAngle = 360f * animatedProgress, useCenter = false, topLeft = topLeft, size = arcSize, style = Stroke(width = strokeWidth, cap = StrokeCap.Round))
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(text = String.format("%.1f", totalHours), style = MaterialTheme.typography.displayMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                                Text(text = "of ${String.format("%.0f", weeklyGoalHours)}h goal", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (progress >= 1f) {
                                Icon(Icons.Filled.EmojiEvents, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(24.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                            }
                            Text(
                                text = if (progress >= 1f) "Weekly Goal Achieved!" else "${(progress * 100).toInt()}% of weekly goal",
                                style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold,
                                color = if (progress >= 1f) SuccessGreen else PrimaryAccent
                            )
                        }
                    }
                }
            }

            // Stats row
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                ProgressStatCard(label = "Total Hours", value = String.format("%.1f", totalHours), color = PrimaryAccent, modifier = Modifier.weight(1f))
                ProgressStatCard(label = "Sessions", value = completedSessionsCount.toString(), color = SecondaryAccent, modifier = Modifier.weight(1f))
                ProgressStatCard(label = "Courses", value = courseStats.size.toString(), color = DangerRed, modifier = Modifier.weight(1f))
            }

            // Per-course breakdown
            Text(text = "Hours by Course", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            
            if (courseStats.isNotEmpty()) {
                val maxMinutes = remember(courseStats) { courseStats.maxOfOrNull { it.totalMinutes } ?: 1 }
                AdaptivePremiumCard(elevation = 1.dp) {
                    Column(modifier = Modifier.fillMaxWidth().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        courseStats.forEach { stat ->
                            val color = CourseColors.getOrElse(stat.colorIndex) { CourseColors[0] }
                            val barProgress = stat.totalMinutes.toFloat() / maxMinutes
                            val animatedBarProgress by animateFloatAsState(targetValue = barProgress, animationSpec = spring(stiffness = Spring.StiffnessLow), label = "bar_${stat.courseId}")
                            Column(modifier = Modifier.fillMaxWidth()) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(text = stat.courseName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)
                                    Text(text = "${String.format("%.1f", stat.totalMinutes / 60f)}h", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = color)
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Box(modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)).background(color.copy(alpha = 0.1f))) {
                                    Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(fraction = animatedBarProgress).clip(RoundedCornerShape(4.dp)).background(color))
                                }
                            }
                        }
                    }
                }
            } else {
                AdaptivePremiumCard(backgroundColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), elevation = 0.dp) {
                    Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = "Complete study sessions to see\nyour progress here! \uD83D\uDCCA", 
                            style = MaterialTheme.typography.bodyLarge, 
                            color = MaterialTheme.colorScheme.onSurfaceVariant, 
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(100.dp))
        }
        
        ConfettiScreen(
            isTriggered = progress >= 1f,
            modifier = Modifier.fillMaxSize()
        )
    }
}

@Composable
private fun ProgressStatCard(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    AdaptivePremiumCard(modifier = modifier, elevation = 2.dp) {
        Column(modifier = Modifier.padding(vertical = 20.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = value, style = MaterialTheme.typography.headlineMedium, color = color, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}


