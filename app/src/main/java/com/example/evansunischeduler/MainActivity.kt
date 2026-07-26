package com.example.evansunischeduler

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.example.evansunischeduler.theme.EvansUniSchedulerTheme

import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.runtime.getValue

class MainActivity : ComponentActivity() {

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        // Handle permission result if needed
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        setContent {
            val viewModel: com.example.evansunischeduler.ui.AppViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            
            val hasCompletedOnboarding by viewModel.hasCompletedOnboarding.collectAsStateWithLifecycle()
            splashScreen.setKeepOnScreenCondition {
                hasCompletedOnboarding == null
            }

            val themePreference by viewModel.themePreference.collectAsStateWithLifecycle()
            val isDark = when(themePreference) {
                "DARK" -> true
                "LIGHT" -> false
                else -> androidx.compose.foundation.isSystemInDarkTheme()
            }

            EvansUniSchedulerTheme(darkTheme = isDark) {
                val backgroundBrush = if (isDark) {
                    androidx.compose.ui.graphics.Brush.linearGradient(
                        colors = listOf(
                            com.example.evansunischeduler.theme.GlassGradientDarkStart,
                            com.example.evansunischeduler.theme.GlassGradientDarkEnd
                        )
                    )
                } else {
                    androidx.compose.ui.graphics.Brush.linearGradient(
                        colors = listOf(
                            com.example.evansunischeduler.theme.GlassGradientStart,
                            com.example.evansunischeduler.theme.GlassGradientEnd
                        )
                    )
                }

                Surface(
                    modifier = Modifier.fillMaxSize().background(backgroundBrush),
                    color = androidx.compose.ui.graphics.Color.Transparent
                ) {
                    MainNavigation(viewModel = viewModel)
                }
            }
        }
    }
}
