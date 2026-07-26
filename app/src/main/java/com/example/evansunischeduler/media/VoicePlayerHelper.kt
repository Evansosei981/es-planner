package com.example.evansunischeduler.media

import android.content.Context
import android.media.MediaPlayer
import android.util.Log

object VoicePlayerHelper {
    private var mediaPlayer: MediaPlayer? = null

    fun play(context: Context, filePath: String, onComplete: (() -> Unit)? = null) {
        stop() // Stop any existing playback
        try {
            mediaPlayer = MediaPlayer().apply {
                setDataSource(filePath)
                prepare()
                start()
                setOnCompletionListener {
                    stop()
                    onComplete?.invoke()
                }
                setOnErrorListener { _, _, _ ->
                    stop()
                    onComplete?.invoke()
                    true
                }
            }
        } catch (e: Exception) {
            Log.e("VoicePlayer", "play() failed", e)
            onComplete?.invoke()
        }
    }

    fun stop() {
        try {
            mediaPlayer?.apply {
                if (isPlaying) {
                    stop()
                }
                release()
            }
        } catch (e: Exception) {
            Log.e("VoicePlayer", "stop() failed", e)
        }
        mediaPlayer = null
    }
}
