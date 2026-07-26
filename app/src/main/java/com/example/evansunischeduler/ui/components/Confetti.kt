package com.example.evansunischeduler.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import kotlin.random.Random
import kotlinx.coroutines.isActive

data class Particle(
    var x: Float,
    var y: Float,
    var vx: Float,
    var vy: Float,
    var radius: Float,
    val color: Color,
    var rotation: Float,
    var rotationSpeed: Float
)

@Composable
fun ConfettiScreen(
    isTriggered: Boolean,
    colors: List<Color> = listOf(
        Color(0xFF7C4DFF), Color(0xFF448AFF), Color(0xFF00BFA5),
        Color(0xFFFF4081), Color(0xFFFFD600)
    ),
    modifier: Modifier = Modifier
) {
    if (!isTriggered) return

    val particles = remember { mutableStateListOf<Particle>() }
    
    LaunchedEffect(isTriggered) {
        if (isTriggered) {
            particles.clear()
            // Create initial burst
            for (i in 0..150) {
                particles.add(
                    Particle(
                        x = 500f, // Will be updated to center screen
                        y = 1500f, // Will be updated to bottom screen
                        vx = Random.nextFloat() * 1200f - 600f,
                        vy = -(Random.nextFloat() * 1500f + 800f),
                        radius = Random.nextFloat() * 15f + 10f,
                        color = colors.random(),
                        rotation = Random.nextFloat() * 360f,
                        rotationSpeed = Random.nextFloat() * 10f - 5f
                    )
                )
            }
            
            var lastFrameTime = withFrameNanos { it }
            while (isActive && particles.isNotEmpty()) {
                val frameTime = withFrameNanos { it }
                val dt = (frameTime - lastFrameTime) / 1_000_000_000f // Delta time in seconds
                lastFrameTime = frameTime
                
                particles.forEach { p ->
                    p.vy += 1200f * dt // Gravity
                    p.x += p.vx * dt
                    p.y += p.vy * dt
                    p.rotation += p.rotationSpeed * dt * 60f
                }
                
                // Remove particles that fall off screen
                particles.removeAll { it.y > 3000f } // Arbitrary off-screen bounds
            }
        }
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        val centerWidth = size.width / 2f
        val bottomHeight = size.height + 100f

        // Initial set for positioning if they just spawned at 500/1500 default
        particles.filter { it.y == 1500f }.forEach { 
            it.x = centerWidth
            it.y = bottomHeight
        }

        particles.forEach { p ->
            rotate(degrees = p.rotation, pivot = Offset(p.x, p.y)) {
                drawRect(
                    color = p.color,
                    topLeft = Offset(p.x - p.radius, p.y - p.radius),
                    size = androidx.compose.ui.geometry.Size(p.radius * 2, p.radius * 2)
                )
            }
        }
    }
}
