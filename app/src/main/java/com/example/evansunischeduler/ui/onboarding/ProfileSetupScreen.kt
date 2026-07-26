package com.example.evansunischeduler.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.evansunischeduler.theme.*

@Composable
fun ProfileSetupScreen(
    onCompleteSetup: (name: String, major: String, notificationMins: Int) -> Unit,
    modifier: Modifier = Modifier
) {
    var name by remember { mutableStateOf("") }
    var major by remember { mutableStateOf("") }
    var notificationMins by remember { mutableFloatStateOf(10f) }
    val haptic = LocalHapticFeedback.current

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(padding)
                .padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(64.dp))
            
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(PrimaryAccent.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Text("🎓", fontSize = 48.sp)
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "Let's Get Started",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            
            Text(
                text = "Tell Evans a bit about yourself.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(48.dp))
            
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("What's your name?") },
                leadingIcon = { Icon(Icons.Filled.Person, contentDescription = "Name Icon") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            OutlinedTextField(
                value = major,
                onValueChange = { major = it },
                label = { Text("What's your major?") },
                leadingIcon = { Icon(Icons.Filled.School, contentDescription = "Major Icon") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Text(
                text = "Notify me ${notificationMins.toInt()} mins before class",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.align(Alignment.Start)
            )
            
            Slider(
                value = notificationMins,
                onValueChange = { 
                    notificationMins = it
                },
                valueRange = 0f..60f,
                steps = 11,
                colors = SliderDefaults.colors(
                    thumbColor = PrimaryAccent,
                    activeTrackColor = PrimaryAccent,
                    inactiveTrackColor = PrimaryAccent.copy(alpha = 0.2f)
                ),
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = { 
                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                    onCompleteSetup(name, major, notificationMins.toInt()) 
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent),
                shape = RoundedCornerShape(16.dp),
                enabled = name.isNotBlank() && major.isNotBlank()
            ) {
                Text("Complete Setup", style = MaterialTheme.typography.titleMedium, color = Color.White)
                Spacer(modifier = Modifier.width(8.dp))
                Icon(Icons.Filled.Check, contentDescription = "Complete Setup", tint = Color.White)
            }
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
