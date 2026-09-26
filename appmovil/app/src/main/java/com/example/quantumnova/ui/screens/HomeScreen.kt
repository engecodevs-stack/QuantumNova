package com.example.quantumnova.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.quantumnova.data.AttendanceRecord
import com.example.quantumnova.data.Community
import com.example.quantumnova.data.Note
import com.example.quantumnova.data.User
import com.example.quantumnova.ui.components.LiquidGlassBadge
import com.example.quantumnova.ui.components.LiquidGlassButton
import com.example.quantumnova.ui.components.LiquidGlassCard
import com.example.quantumnova.ui.theme.QNAIBlue
import com.example.quantumnova.ui.theme.QNBrandGradient
import com.example.quantumnova.ui.theme.QNDarkBorder
import com.example.quantumnova.ui.theme.QNDarkTextPrimary
import com.example.quantumnova.ui.theme.QNDarkTextSecondary
import com.example.quantumnova.ui.theme.QNLightBorder
import com.example.quantumnova.ui.theme.QNLightTextPrimary
import com.example.quantumnova.ui.theme.QNLightTextSecondary
import com.example.quantumnova.ui.theme.QNSuccess
import com.example.quantumnova.ui.theme.QNTechPurple
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HomeScreen(
    user: User,
    notes: List<Note>,
    communities: List<Community>,
    attendanceList: List<AttendanceRecord>,
    onRegisterAttendance: (AttendanceRecord) -> Unit,
    onNavigateToStudy: (selectedNote: Note?) -> Unit,
    onNavigateToChat: (initialPrompt: String?) -> Unit,
    onNavigateToAula: () -> Unit
) {
    val isDark = isAppInDarkTheme()
    val scrollState = rememberScrollState()

    val topNote = notes.firstOrNull()
    val activeCommunity = communities.firstOrNull()
    val isCheckedIn = activeCommunity != null && attendanceList.any { it.communityId == activeCommunity.id }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp)
            .padding(top = 16.dp, bottom = 90.dp)
    ) {
        // Student Greeting Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Hola, ${user.fullname.split(" ").firstOrNull() ?: "Estudiante"}",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                )
                Text(
                    text = "Compañero de Estudio Quantum",
                    fontSize = 13.sp,
                    color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                )
            }

            // Student Avatar Badge
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(QNBrandGradient),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = user.fullname.take(1).uppercase(),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Hero Card: "¿Continuamos estudiando?"
        LiquidGlassCard(
            modifier = Modifier.fillMaxWidth(),
            isHighlighted = true
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SESIÓN ACTIVA",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        color = QNTechPurple
                    )
                    LiquidGlassBadge(
                        text = "En Progreso",
                        color = QNAIBlue
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = if (topNote != null) topNote.title else "¿Continuamos estudiando?",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = if (topNote != null) {
                        topNote.content.take(90).replace("\n", " ") + "..."
                    } else {
                        "Retoma tus apuntes interconectados o consulta tus dudas con tu tutor Quantum."
                    },
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                )

                Spacer(modifier = Modifier.height(18.dp))

                LiquidGlassButton(
                    text = "CONTINUAR",
                    icon = Icons.Default.PlayArrow,
                    modifier = Modifier.fillMaxWidth(),
                    onClick = {
                        onNavigateToStudy(topNote)
                    }
                )
            }
        }

        Spacer(modifier = Modifier.height(22.dp))

        // Section: Próxima Clase / Asistencia
        Text(
            text = "Próxima Clase",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
        )

        Spacer(modifier = Modifier.height(10.dp))

        if (activeCommunity != null) {
            LiquidGlassCard(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = activeCommunity.name,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                        )
                        if (isCheckedIn) {
                            LiquidGlassBadge(
                                text = "PRESENTE",
                                color = QNSuccess,
                                icon = Icons.Default.Check
                            )
                        } else {
                            LiquidGlassBadge(
                                text = "Pendiente",
                                color = QNAIBlue
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Docente: ${activeCommunity.teacherName}",
                        fontSize = 13.sp,
                        color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.DateRange,
                            contentDescription = null,
                            tint = QNAIBlue,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Hoy, 09:00 - 11:00 AM",
                            fontSize = 12.sp,
                            color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    if (!isCheckedIn) {
                        LiquidGlassButton(
                            text = "REGISTRAR ASISTENCIA",
                            icon = Icons.Default.Check,
                            modifier = Modifier.fillMaxWidth(),
                            onClick = {
                                val timeString = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())
                                onRegisterAttendance(
                                    AttendanceRecord(
                                        communityId = activeCommunity.id,
                                        className = activeCommunity.name,
                                        teacherName = activeCommunity.teacherName,
                                        timestamp = timeString,
                                        status = "PRESENTE"
                                    )
                                )
                            }
                        )
                    } else {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(QNSuccess.copy(alpha = 0.12f))
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = QNSuccess,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Asistencia confirmada para hoy",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = QNSuccess
                            )
                        }
                    }
                }
            }
        } else {
            LiquidGlassCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateToAula() }
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "No tienes clases registradas hoy",
                        fontSize = 14.sp,
                        color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Toca para explorar Aula o unirte con código",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = QNAIBlue
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(22.dp))

        // Quick IA Tutor Ask Bar
        LiquidGlassCard(
            modifier = Modifier
                .fillMaxWidth()
                .clickable {
                    onNavigateToChat(null)
                }
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = null,
                    tint = QNTechPurple,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "Pregúntale a Quantum IA...",
                    fontSize = 14.sp,
                    color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary,
                    modifier = Modifier.weight(1f)
                )
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    tint = QNAIBlue,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(22.dp))

        // Section: Últimas Notas
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Últimas Notas",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
            )
            Text(
                text = "Ver todas",
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = QNAIBlue,
                modifier = Modifier.clickable { onNavigateToStudy(null) }
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        notes.take(2).forEach { note ->
            LiquidGlassCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 10.dp)
                    .clickable { onNavigateToStudy(note) }
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = null,
                        tint = QNAIBlue,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = note.title,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                        )
                        if (note.tags.isNotEmpty()) {
                            Text(
                                text = note.tags.joinToString(", ") { "#$it" },
                                fontSize = 12.sp,
                                color = QNTechPurple
                            )
                        }
                    }
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = if (isDark) QNDarkBorder else QNLightBorder,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}
