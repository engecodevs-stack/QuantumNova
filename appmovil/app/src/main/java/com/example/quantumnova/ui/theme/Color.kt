package com.example.quantumnova.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Brand Core Accents
val QNAIBlue = Color(0xFF5865F2)
val QNTechPurple = Color(0xFFA947E8)
val QNTechPurpleHover = Color(0xFF9135D0)
val QNSuccess = Color(0xFF00A878)
val QNError = Color(0xFFE5484D)
val QNWarning = Color(0xFFFFB020)

// Official Brand Gradient
val QNBrandGradient = Brush.linearGradient(
    colors = listOf(QNAIBlue, QNTechPurple)
)

val QNBrandGradientSubtle = Brush.linearGradient(
    colors = listOf(QNAIBlue.copy(alpha = 0.15f), QNTechPurple.copy(alpha = 0.15f))
)

// Dark Theme (Space / Cosmic Glass)
val QNDarkBgPrimary = Color(0xFF0B0B12)
val QNDarkBgSecondary = Color(0xFF14141E)
val QNDarkPanel = Color(0xFF12121B)
val QNDarkPanelSecondary = Color(0xFF181824)
val QNDarkBorder = Color(0xFF252535)
val QNDarkTextPrimary = Color(0xFFF5F5F7)
val QNDarkTextSecondary = Color(0xFF9E9EAF)
val QNDarkTextTertiary = Color(0xFF717284)
val QNDarkGlassSurface = Color(0xD912121B)
val QNDarkGlassBorder = Color(0x26FFFFFF)

// Light Theme (Clean Academic)
val QNLightBgPrimary = Color(0xFFF7F7FB)
val QNLightBgSecondary = Color(0xFFF0EFF7)
val QNLightPanel = Color(0xFFFFFFFF)
val QNLightPanelSecondary = Color(0xFFF8F7FC)
val QNLightBorder = Color(0xFFE1E1EA)
val QNLightTextPrimary = Color(0xFF18181F)
val QNLightTextSecondary = Color(0xFF5F6070)
val QNLightTextTertiary = Color(0xFF858696)
val QNLightGlassSurface = Color(0xE6FFFFFF)
val QNLightGlassBorder = Color(0x1A000000)