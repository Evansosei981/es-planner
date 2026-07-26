package com.example.evansunischeduler.ui.journal

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Recording
import androidx.camera.video.VideoRecordEvent
import androidx.camera.view.CameraController
import androidx.camera.view.LifecycleCameraController
import androidx.camera.view.PreviewView
import androidx.camera.view.video.AudioConfig
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun VideoRecordingScreen(
    onVideoRecorded: (Uri) -> Unit,
    onCancel: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var hasPermissions by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasPermissions = permissions[Manifest.permission.CAMERA] == true &&
                permissions[Manifest.permission.RECORD_AUDIO] == true
    }

    LaunchedEffect(Unit) {
        if (!hasPermissions) {
            permissionLauncher.launch(
                arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
            )
        }
    }

    if (!hasPermissions) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
                Text(
                    "Camera and Audio permissions are required to record reflections.",
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = {
                    permissionLauncher.launch(
                        arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
                    )
                }) {
                    Text("Grant Permissions")
                }
                Spacer(modifier = Modifier.height(8.dp))
                TextButton(onClick = onCancel) {
                    Text("Go Back")
                }
            }
        }
        return
    }

    var cameraError by remember { mutableStateOf<String?>(null) }
    val cameraController = remember {
        try {
            LifecycleCameraController(context).apply {
                setEnabledUseCases(CameraController.VIDEO_CAPTURE)
                cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA
            }
        } catch (e: Exception) {
            e.printStackTrace()
            cameraError = "Failed to initialize camera: ${e.message}"
            null
        }
    }

    if (cameraError != null || cameraController == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
                Text(
                    "Camera Error: ${cameraError ?: "Unknown Error"}\n\nYour device might not support video capture or the camera is in use.",
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    color = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.height(16.dp))
                TextButton(onClick = onCancel) {
                    Text("Go Back")
                }
            }
        }
        return
    }

    var isRecording by remember { mutableStateOf(false) }
    var recording by remember { mutableStateOf<Recording?>(null) }
    var recordedTimeText by remember { mutableStateOf("00:00") }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).apply {
                    controller = cameraController
                    try {
                        cameraController.bindToLifecycle(lifecycleOwner)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Close button
        IconButton(
            onClick = onCancel,
            modifier = Modifier
                .padding(16.dp)
                .align(Alignment.TopStart)
                .background(Color.Black.copy(alpha = 0.5f), CircleShape)
        ) {
            Icon(Icons.Filled.Close, contentDescription = "Close", tint = Color.White)
        }
        
        // Timer
        if (isRecording) {
            Text(
                text = recordedTimeText,
                color = Color.White,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(32.dp)
                    .background(Color.Red.copy(alpha = 0.8f), CircleShape)
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            )
        }

        // Record Button
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 64.dp)
        ) {
            IconButton(
                onClick = {
                    if (isRecording) {
                        // Stop recording
                        recording?.stop()
                        recording = null
                        isRecording = false
                    } else {
                        // Start recording
                        val name = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
                        val videoFile = File(context.filesDir, "Reflection_$name.mp4")
                        val outputOptions = FileOutputOptions.Builder(videoFile).build()
                        
                        try {
                            recording = cameraController.startRecording(
                                outputOptions,
                                AudioConfig.create(true),
                                ContextCompat.getMainExecutor(context)
                            ) { event ->
                                when (event) {
                                    is VideoRecordEvent.Start -> {
                                        isRecording = true
                                    }
                                    is VideoRecordEvent.Status -> {
                                        val durationSeconds = event.recordingStats.recordedDurationNanos / 1_000_000_000
                                        val mins = durationSeconds / 60
                                        val secs = durationSeconds % 60
                                        recordedTimeText = String.format("%02d:%02d", mins, secs)
                                        
                                        // Auto-stop after 5 minutes (300 seconds)
                                        if (durationSeconds >= 300) {
                                            recording?.stop()
                                        }
                                    }
                                    is VideoRecordEvent.Finalize -> {
                                        isRecording = false
                                        if (!event.hasError()) {
                                            onVideoRecorded(Uri.fromFile(videoFile))
                                        } else {
                                            Log.e("VideoRecording", "Video capture failed: ${event.error}")
                                        }
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            Log.e("VideoRecording", "Exception starting camera", e)
                            android.widget.Toast.makeText(context, "Failed to start recording. Microphone might be in use.", android.widget.Toast.LENGTH_LONG).show()
                        }
                    }
                },
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(if (isRecording) Color.White else Color.Red)
            ) {
                Icon(
                    imageVector = if (isRecording) Icons.Filled.Stop else Icons.Filled.Videocam,
                    contentDescription = if (isRecording) "Stop" else "Record",
                    tint = if (isRecording) Color.Red else Color.White,
                    modifier = Modifier.size(40.dp)
                )
            }
        }
    }
}
