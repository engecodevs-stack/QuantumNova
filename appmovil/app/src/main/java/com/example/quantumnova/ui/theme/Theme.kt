package com.example.quantumnova.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = QNAIBlue,
    onPrimary = Color.White,
    secondary = QNTechPurple,
    onSecondary = Color.White,
    tertiary = QNSuccess,
    background = QNDarkBgPrimary,
    onBackground = QNDarkTextPrimary,
    surface = QNDarkPanel,
    onSurface = QNDarkTextPrimary,
    surfaceVariant = QNDarkPanelSecondary,
    onSurfaceVariant = QNDarkTextSecondary,
    outline = QNDarkBorder
)

private val LightColorScheme = lightColorScheme(
    primary = QNAIBlue,
    onPrimary = Color.White,
    secondary = QNTechPurple,
    onSecondary = Color.White,
    tertiary = QNSuccess,
    background = QNLightBgPrimary,
    onBackground = QNLightTextPrimary,
    surface = QNLightPanel,
    onSurface = QNLightTextPrimary,
    surfaceVariant = QNLightPanelSecondary,
    onSurfaceVariant = QNLightTextSecondary,
    outline = QNLightBorder
)

val LocalIsDarkMode = compositionLocalOf { false }

@Composable
fun isAppInDarkTheme(): Boolean = LocalIsDarkMode.current

@Composable
fun QuantumNovaTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            val insetsController = WindowCompat.getInsetsController(window, view)
            insetsController.isAppearanceLightStatusBars = !darkTheme
            insetsController.isAppearanceLightNavigationBars = !darkTheme
        }
    }

    CompositionLocalProvider(LocalIsDarkMode provides darkTheme) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}