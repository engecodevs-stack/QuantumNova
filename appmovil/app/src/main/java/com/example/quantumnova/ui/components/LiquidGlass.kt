package com.example.quantumnova.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import com.example.quantumnova.ui.theme.isAppInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.quantumnova.ui.theme.QNAIBlue
import com.example.quantumnova.ui.theme.QNBrandGradient
import com.example.quantumnova.ui.theme.QNDarkBorder
import com.example.quantumnova.ui.theme.QNDarkGlassBorder
import com.example.quantumnova.ui.theme.QNDarkGlassSurface
import com.example.quantumnova.ui.theme.QNLightBorder
import com.example.quantumnova.ui.theme.QNLightGlassBorder
import com.example.quantumnova.ui.theme.QNLightGlassSurface
import com.example.quantumnova.ui.theme.QNTechPurple

/**
 * Premium Liquid Glass Card
 * Lightweight, high performance container with subtle gradient transparency
 * and crisp specular edge reflection.
 */
@Composable
fun LiquidGlassCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(22.dp),
    isHighlighted: Boolean = false,
    onClick: (() -> Unit)? = null,
    content: @Composable () -> Unit
) {
    val isDark = isAppInDarkTheme()
    val bgColor = if (isDark) QNDarkGlassSurface else QNLightGlassSurface
    val borderColor = if (isHighlighted) {
        QNAIBlue.copy(alpha = 0.6f)
    } else {
        if (isDark) QNDarkGlassBorder else QNLightGlassBorder
    }

    val cardModifier = modifier
        .clip(shape)
        .then(
            if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
        )
        .background(
            brush = Brush.verticalGradient(
                colors = listOf(
                    bgColor,
                    if (isDark) Color(0xF0101018) else Color(0xF2F5F4FA)
                )
            )
        )
        .border(
            width = if (isHighlighted) 1.5.dp else 1.dp,
            color = borderColor,
            shape = shape
        )

    Box(modifier = cardModifier) {
        content()
    }
}

/**
 * Premium Liquid Glass Action Button
 * Uses official Quantum Nova gradient (#5865F2 -> #A947E8)
 * with tactile scale micro-animation on press.
 */
@Composable
fun LiquidGlassButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    isLoading: Boolean = false,
    enabled: Boolean = true,
    isSecondary: Boolean = false
) {
    val isDark = isAppInDarkTheme()
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(if (isPressed) 0.97f else 1f, label = "buttonScale")

    val shape = RoundedCornerShape(16.dp)

    val backgroundModifier = if (isSecondary) {
        Modifier
            .background(
                color = if (isDark) Color(0x33FFFFFF) else Color(0x1A5865F2),
                shape = shape
            )
            .border(
                width = 1.dp,
                color = if (isDark) QNDarkBorder else QNLightBorder,
                shape = shape
            )
    } else {
        Modifier
            .background(
                brush = QNBrandGradient,
                shape = shape
            )
            .border(
                width = 1.dp,
                color = Color.White.copy(alpha = 0.25f),
                shape = shape
            )
    }

    Box(
        modifier = modifier
            .scale(scale)
            .defaultMinSize(minHeight = 50.dp)
            .clip(shape)
            .then(backgroundModifier)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                enabled = enabled && !isLoading,
                onClick = onClick
            )
            .padding(horizontal = 24.dp, vertical = 13.dp),
        contentAlignment = Alignment.Center
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                color = Color.White,
                modifier = Modifier
                    .height(22.dp)
                    .width(22.dp),
                strokeWidth = 2.5.dp
            )
        } else {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (icon != null) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = if (isSecondary && !isDark) QNAIBlue else Color.White,
                        modifier = Modifier.padding(end = 8.dp)
                    )
                }
                Text(
                    text = text,
                    color = if (isSecondary && !isDark) QNAIBlue else Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.3.sp
                )
            }
        }
    }
}

/**
 * Status Badge for Attendance, Exams, Active States
 */
@Composable
fun LiquidGlassBadge(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = QNAIBlue,
    icon: ImageVector? = null
) {
    Surface(
        modifier = modifier,
        color = color.copy(alpha = 0.15f),
        shape = RoundedCornerShape(10.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.35f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.height(14.dp).width(14.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
            }
            Text(
                text = text,
                color = color,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}
