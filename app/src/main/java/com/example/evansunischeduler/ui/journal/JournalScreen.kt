package com.example.evansunischeduler.ui.journal

import android.net.Uri
import androidx.core.net.toUri
import androidx.annotation.OptIn
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.example.evansunischeduler.data.LearningNote
import com.example.evansunischeduler.theme.CourseColors
import com.example.evansunischeduler.ui.components.glassCard
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun JournalScreen(
    notes: List<LearningNote>,
    modifier: Modifier = Modifier
) {
    if (notes.isEmpty()) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("📝", style = MaterialTheme.typography.displayLarge)
                Spacer(modifier = Modifier.height(16.dp))
                Text("Your journal is empty.", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Log notes after class or study sessions!", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        return
    }

    LazyColumn(
        modifier = modifier.fillMaxSize().padding(16.dp),
        contentPadding = PaddingValues(bottom = 80.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Learning Journal", style = MaterialTheme.typography.displayMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
        }

        items(notes, key = { it.id }) { note ->
            val context = LocalContext.current
            JournalCard(
                note = note
            )
        }
    }
}

@OptIn(UnstableApi::class)
@Composable
fun JournalCard(note: LearningNote) {
    val isClass = note.type == "COURSE"
    val color = if (isClass) CourseColors[1] else CourseColors[2]
    val dateFormat = remember { SimpleDateFormat("MMM dd, yyyy • hh:mm a", Locale.US) }
    val dateStr = remember(note.dateMillis) { dateFormat.format(Date(note.dateMillis)) }

    var isVideoPlaying by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier.fillMaxWidth().glassCard(),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(40.dp).clip(RoundedCornerShape(8.dp)).background(color.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(if (isClass) Icons.Filled.School else Icons.Filled.Book, contentDescription = if (isClass) "Class Note" else "Study Note", tint = color)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(text = note.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(text = dateStr, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (note.content.isNotBlank()) {
                Text(text = note.content, style = MaterialTheme.typography.bodyLarge)
            }

            if (note.videoUri != null) {
                Spacer(modifier = Modifier.height(16.dp))
                
                if (isVideoPlaying) {
                    val context = LocalContext.current
                    val exoPlayer = remember {
                        ExoPlayer.Builder(context).build().apply {
                            setMediaItem(MediaItem.fromUri(note.videoUri.toUri()))
                            prepare()
                            playWhenReady = true
                        }
                    }

                    DisposableEffect(Unit) {
                        onDispose {
                            exoPlayer.release()
                        }
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(androidx.compose.ui.graphics.Color.Black)
                    ) {
                        AndroidView(
                            factory = { ctx ->
                                PlayerView(ctx).apply {
                                    player = exoPlayer
                                    useController = true
                                }
                            },
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(100.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(color.copy(alpha = 0.1f))
                            .clickable { isVideoPlaying = true },
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.PlayArrow, contentDescription = "Play Video", tint = color, modifier = Modifier.size(32.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Play Reflection Video", color = color, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }

        }
    }
}
