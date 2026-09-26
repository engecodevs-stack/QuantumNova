package com.example.quantumnova.ui.screens

import androidx.compose.foundation.background
import com.example.quantumnova.ui.theme.isAppInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.quantumnova.data.ApiClient
import com.example.quantumnova.data.AppPreferences
import com.example.quantumnova.data.AttendanceRecord
import com.example.quantumnova.data.User
import com.example.quantumnova.ui.components.LiquidGlassBadge
import com.example.quantumnova.ui.components.LiquidGlassButton
import com.example.quantumnova.ui.components.LiquidGlassCard
import com.example.quantumnova.ui.theme.QNAIBlue
import com.example.quantumnova.ui.theme.QNBrandGradient
import com.example.quantumnova.ui.theme.QNDarkBorder
import com.example.quantumnova.ui.theme.QNDarkTextPrimary
import com.example.quantumnova.ui.theme.QNDarkTextSecondary
import com.example.quantumnova.ui.theme.QNError
import com.example.quantumnova.ui.theme.QNLightBorder
import com.example.quantumnova.ui.theme.QNLightTextPrimary
import com.example.quantumnova.ui.theme.QNLightTextSecondary
import com.example.quantumnova.ui.theme.QNSuccess
import com.example.quantumnova.ui.theme.QNTechPurple
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(
    user: User,
    preferences: AppPreferences,
    apiClient: ApiClient,
    totalNotesCount: Int,
    attendanceList: List<AttendanceRecord>,
    onToggleDarkMode: (Boolean) -> Unit,
    onLogout: () -> Unit
) {
    val isDark = isAppInDarkTheme()
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var serverUrlInput by remember { mutableStateOf(preferences.serverUrl) }
    var pingStatus by remember { mutableStateOf<String?>(null) }
    var isPinging by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp)
            .padding(top = 16.dp, bottom = 90.dp)
    ) {
        Text(
            text = "Perfil y Ajustes",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Student Card
        LiquidGlassCard(
            modifier = Modifier.fillMaxWidth(),
            isHighlighted = true
        ) {
            Row(
                modifier = Modifier.padding(20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .clip(CircleShape)
                        .background(QNBrandGradient),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = user.fullname.take(1).uppercase(),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = user.fullname,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                    )
                    Text(
                        text = user.email,
                        fontSize = 13.sp,
                        color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    LiquidGlassBadge(
                        text = "Rol: Estudiante",
                        color = QNAIBlue
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Academic Summary Stats
        Text(
            text = "Resumen Académico",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
        )

        Spacer(modifier = Modifier.height(10.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            LiquidGlassCard(
                modifier = Modifier.weight(1f)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "Notas", fontSize = 12.sp, color = QNTechPurple)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "$totalNotesCount",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                    )
                }
            }

            LiquidGlassCard(
                modifier = Modifier.weight(1f)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "Asistencias", fontSize = 12.sp, color = QNSuccess)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${attendanceList.size}",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                    )
                }
            }

            LiquidGlassCard(
                modifier = Modifier.weight(1f)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "Tutor IA", fontSize = 12.sp, color = QNAIBlue)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Activo",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Appearance & Preferences
        Text(
            text = "Preferencias",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
        )

        Spacer(modifier = Modifier.height(10.dp))

        LiquidGlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Modo Oscuro Cósmico",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                        )
                        Text(
                            text = "Estética espacial con Liquid Glass",
                            fontSize = 12.sp,
                            color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                        )
                    }

                    Switch(
                        checked = preferences.isDarkMode,
                        onCheckedChange = {
                            preferences.isDarkMode = it
                            onToggleDarkMode(it)
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = QNAIBlue
                        )
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Backend Server Host Configuration
        Text(
            text = "Conexión con Quantum Nova",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
        )

        Spacer(modifier = Modifier.height(10.dp))

        LiquidGlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "Dirección del Servidor (Backend)",
                    fontSize = 13.sp,
                    color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                )
                Spacer(modifier = Modifier.height(6.dp))

                OutlinedTextField(
                    value = serverUrlInput,
                    onValueChange = { serverUrlInput = it },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = QNAIBlue,
                        unfocusedBorderColor = if (isDark) QNDarkBorder else QNLightBorder
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    LiquidGlassButton(
                        text = "Guardar y Probar",
                        icon = Icons.Default.Refresh,
                        isLoading = isPinging,
                        isSecondary = true,
                        modifier = Modifier.height(42.dp),
                        onClick = {
                            preferences.serverUrl = serverUrlInput
                            scope.launch {
                                isPinging = true
                                val reachable = apiClient.testConnection()
                                isPinging = false
                                pingStatus = if (reachable) "Conexión exitosa con Quantum Nova" else "Servidor sin conexión (Modo offline activo)"
                            }
                        }
                    )

                    if (pingStatus != null) {
                        Text(
                            text = pingStatus ?: "",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (pingStatus?.contains("exitosa") == true) QNSuccess else QNTechPurple,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(30.dp))

        // Logout Button
        LiquidGlassButton(
            text = "CERRAR SESIÓN",
            isSecondary = true,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                preferences.clearSession()
                onLogout()
            }
        )
    }
}
