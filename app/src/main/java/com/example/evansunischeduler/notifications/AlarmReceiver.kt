package com.example.evansunischeduler.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.evansunischeduler.MainActivity
import com.example.evansunischeduler.R
import java.util.Locale

class AlarmReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("EXTRA_TITLE") ?: "Upcoming Event"
        val message = intent.getStringExtra("EXTRA_MESSAGE") ?: "You have a class or study session starting soon!"

        createNotificationChannel(context)

        val mainIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent: PendingIntent = PendingIntent.getActivity(
            context, 0, mainIntent, PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        if (ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            NotificationManagerCompat.from(context).notify(System.currentTimeMillis().toInt(), builder.build())
        }

        // Handle Voice Playback
        val pendingResult = goAsync()
        val prefs = context.getSharedPreferences("evans_prefs", Context.MODE_PRIVATE)
        val voiceType = prefs.getString("voice_type", "STANDARD")
        val customVoicePath = prefs.getString("custom_voice_path", null)
        
        var isFinished = false
        fun finishGracefully() {
            if (!isFinished) {
                isFinished = true
                try { pendingResult.finish() } catch (e: Exception) {}
            }
        }

        when (voiceType) {
            "CUSTOM" -> {
                if (customVoicePath != null) {
                    try {
                        val mediaPlayer = android.media.MediaPlayer().apply {
                            setDataSource(customVoicePath)
                            prepare()
                            setOnCompletionListener {
                                try { release() } catch (e: Exception) {}
                                finishGracefully()
                            }
                        }
                        mediaPlayer.start()
                        
                        Handler(Looper.getMainLooper()).postDelayed({
                            try {
                                if (mediaPlayer.isPlaying) mediaPlayer.stop()
                                mediaPlayer.release()
                            } catch (e: Exception) {}
                            finishGracefully()
                        }, 15000)
                    } catch (e: Exception) {
                        e.printStackTrace()
                        finishGracefully()
                    }
                } else {
                    finishGracefully()
                }
            }
            "TTS" -> {
                var tts: android.speech.tts.TextToSpeech? = null
                tts = android.speech.tts.TextToSpeech(context) { status ->
                    if (status == android.speech.tts.TextToSpeech.SUCCESS) {
                        tts?.setOnUtteranceProgressListener(object : android.speech.tts.UtteranceProgressListener() {
                            override fun onStart(utteranceId: String?) {}
                            override fun onDone(utteranceId: String?) {
                                try { tts?.shutdown() } catch (e: Exception) {}
                                finishGracefully()
                            }
                            @Deprecated("Deprecated in Java")
                            override fun onError(utteranceId: String?) {
                                try { tts?.shutdown() } catch (e: Exception) {}
                                finishGracefully()
                            }
                            override fun onError(utteranceId: String?, errorCode: Int) {
                                try { tts?.shutdown() } catch (e: Exception) {}
                                finishGracefully()
                            }
                        })
                        val params = android.os.Bundle()
                        params.putString(android.speech.tts.TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "tts_reminder")
                        tts?.speak(message, android.speech.tts.TextToSpeech.QUEUE_FLUSH, params, "tts_reminder")
                    } else {
                        finishGracefully()
                    }
                }
                Handler(Looper.getMainLooper()).postDelayed({
                    try { tts.shutdown() } catch (e: Exception) {}
                    finishGracefully()
                }, 15000)
            }
            else -> {
                // STANDARD Beep (Raw resource)
                val audioResId = when (title) {
                    "Next Up!" -> R.raw.class_starting
                    "Class Closed" -> R.raw.class_closed
                    "Study Session" -> R.raw.study_starting
                    "Study Break" -> R.raw.study_break
                    else -> null
                }
        
                if (audioResId != null) {
                    try {
                        val mediaPlayer = android.media.MediaPlayer.create(context, audioResId)
                        mediaPlayer.setOnCompletionListener { mp ->
                            try { mp.release() } catch (e: Exception) {}
                            finishGracefully()
                        }
                        mediaPlayer.start()
                        
                        Handler(Looper.getMainLooper()).postDelayed({
                            try {
                                if (mediaPlayer.isPlaying) mediaPlayer.stop()
                                mediaPlayer.release()
                            } catch (e: Exception) {}
                            finishGracefully()
                        }, 15000)
                    } catch (e: Exception) {
                        e.printStackTrace()
                        finishGracefully()
                    }
                } else {
                    finishGracefully()
                }
            }
        }
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Schedule Reminders"
            val descriptionText = "Reminders for upcoming classes and study sessions"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            val notificationManager: NotificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_ID = "ES_PLANNER_CHANNEL"
    }
}
