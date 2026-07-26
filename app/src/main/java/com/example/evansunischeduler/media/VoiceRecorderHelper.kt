package com.example.evansunischeduler.media

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import java.io.File
import java.io.IOException

object VoiceRecorderHelper {
    private var recorder: MediaRecorder? = null
    private var currentFilePath: String? = null

    fun startRecording(context: Context): String? {
        val fileName = "voice_reminder_${System.currentTimeMillis()}.3gp"
        val dir = File(context.filesDir, "voice_memos")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        val file = File(dir, fileName)
        currentFilePath = file.absolutePath

        recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP)
            setOutputFile(currentFilePath)
            setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB)

            try {
                prepare()
                start()
                return currentFilePath
            } catch (e: IOException) {
                Log.e("VoiceRecorder", "prepare() failed", e)
                return null
            }
        }
        return currentFilePath
    }

    fun stopRecording(): String? {
        try {
            recorder?.apply {
                stop()
                release()
            }
        } catch (e: Exception) {
            Log.e("VoiceRecorder", "stop() failed", e)
        }
        recorder = null
        val path = currentFilePath
        currentFilePath = null
        return path
    }
}
