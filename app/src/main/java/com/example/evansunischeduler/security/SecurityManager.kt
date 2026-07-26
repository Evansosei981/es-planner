package com.example.evansunischeduler.security

import android.content.Context
import androidx.core.content.edit
import android.provider.Settings
import java.security.MessageDigest

object SecurityManager {
    private const val PREFS_NAME = "es_planner_security"
    private const val KEY_ACTIVATED = "is_activated"
    private const val SECRET_SALT = "EvansSuperSecretSalt2026!@#"

    fun isAppActivated(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_ACTIVATED, false)
    }

    fun setAppActivated(context: Context, activated: Boolean) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit { putBoolean(KEY_ACTIVATED, activated) }
    }

    fun getHardwareId(context: Context): String {
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "UNKNOWN_DEVICE"
        val hash = hashString(androidId + "HW_SALT")
        return formatCode(hash.take(6).uppercase()) // e.g. A7B-9X2
    }

    fun generateActivationCode(hardwareId: String): String {
        val cleanHwId = hardwareId.replace("-", "").uppercase()
        val hash = hashString(cleanHwId + SECRET_SALT)
        // Take 9 characters for the activation code
        val codeChars = hash.take(9).uppercase()
        return "${codeChars.substring(0, 3)}-${codeChars.substring(3, 6)}-${codeChars.substring(6, 9)}" // e.g. QW8-12M-PL0
    }

    fun verifyActivationCode(hardwareId: String, codeInput: String): Boolean {
        val expectedCode = generateActivationCode(hardwareId).replace("-", "")
        val cleanInput = codeInput.replace("-", "").uppercase().trim()
        return expectedCode == cleanInput
    }

    private fun formatCode(raw: String): String {
        if (raw.length < 6) return raw
        return "${raw.substring(0, 3)}-${raw.substring(3, 6)}"
    }

    private fun hashString(input: String): String {
        val bytes = input.toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        return digest.fold("") { str, it -> str + "%02x".format(it) }
    }
}
