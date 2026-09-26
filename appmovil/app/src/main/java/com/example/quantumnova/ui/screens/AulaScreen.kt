package com.example.quantumnova.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
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
import androidx.compose.ui.window.Dialog
import com.example.quantumnova.data.ApiClient
import com.example.quantumnova.data.AttendanceRecord
import com.example.quantumnova.data.ClassMaterial
import com.example.quantumnova.data.Community
import com.example.quantumnova.data.CommunityExam
import com.example.quantumnova.data.User
import com.example.quantumnova.ui.components.LiquidGlassBadge
import com.example.quantumnova.ui.components.LiquidGlassButton
import com.example.quantumnova.ui.components.LiquidGlassCard
import com.example.quantumnova.ui.theme.QNAIBlue
import com.example.quantumnova.ui.theme.QNDarkBorder
import com.example.quantumnova.ui.theme.QNDarkTextPrimary
import com.example.quantumnova.ui.theme.QNDarkTextSecondary
import com.example.quantumnova.ui.theme.QNLightBorder
import com.example.quantumnova.ui.theme.QNLightTextPrimary
import com.example.quantumnova.ui.theme.QNLightTextSecondary
import com.example.quantumnova.ui.theme.QNSuccess
import com.example.quantumnova.ui.theme.QNTechPurple
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun AulaScreen(
    user: User,
    communities: List<Community>,
    attendanceList: List<AttendanceRecord>,
    apiClient: ApiClient,
    onRegisterAttendance: (AttendanceRecord) -> Unit,
    onCommunityJoined: (Community) -> Unit
) {
    val isDark = isAppInDarkTheme()
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var showJoinDialog by remember { mutableStateOf(false) }
    var joinCodeInput by remember { mutableStateOf("") }
    var joinError by remember { mutableStateOf<String?>(null) }
    var isJoining by remember { mutableStateOf(false) }

    var selectedExam by remember { mutableStateOf<CommunityExam?>(null) }
    var activeExamCommunityId by remember { mutableStateOf("") }
    var examAnswers by remember { mutableStateOf<Map<Int, Int>>(emptyMap()) }
    var examResultScore by remember { mutableStateOf<Int?>(null) }

    var selectedMaterial by remember { mutableStateOf<ClassMaterial?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp)
            .padding(top = 16.dp, bottom = 90.dp)
    ) {
        // Aula Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Aula",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                )
                Text(
                    text = "Tus clases, materiales y asistencia",
                    fontSize = 13.sp,
                    color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                )
            }

            LiquidGlassButton(
                text = "Unirse",
                icon = Icons.Default.Add,
                isSecondary = true,
                modifier = Modifier.height(40.dp),
                onClick = {
                    joinCodeInput = ""
                    joinError = null
                    showJoinDialog = true
                }
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Checador / Asistencia Module
        Text(
            text = "Checador de Asistencia",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
        )

        Spacer(modifier = Modifier.height(10.dp))

        val currentClass = communities.firstOrNull()
        if (currentClass != null) {
            val record = attendanceList.firstOrNull { it.communityId == currentClass.id }
            val isPresent = record != null

            LiquidGlassCard(
                modifier = Modifier.fillMaxWidth(),
                isHighlighted = !isPresent
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "CLASE DE HOY",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = QNAIBlue,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = currentClass.name,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                            )
                        }

                        if (isPresent) {
                            LiquidGlassBadge(
                                text = "PRESENTE",
                                color = QNSuccess,
                                icon = Icons.Default.Check
                            )
                        } else {
                            LiquidGlassBadge(
                                text = "Sin Registro",
                                color = QNTechPurple
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Docente: ${currentClass.teacherName}",
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
                            text = if (isPresent) "Registrado a las ${record?.timestamp}" else "Horario: 09:00 - 11:00 AM",
                            fontSize = 12.sp,
                            color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    if (!isPresent) {
                        LiquidGlassButton(
                            text = "REGISTRAR ASISTENCIA",
                            icon = Icons.Default.Check,
                            modifier = Modifier.fillMaxWidth(),
                            onClick = {
                                val time = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())
                                onRegisterAttendance(
                                    AttendanceRecord(
                                        communityId = currentClass.id,
                                        className = currentClass.name,
                                        teacherName = currentClass.teacherName,
                                        timestamp = time,
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
                                text = "Asistencia confirmada para la clase de hoy",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = QNSuccess
                            )
                        }
                    }
                }
            }
        } else {
            LiquidGlassCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Únete a una clase para registrar tu asistencia aquí.",
                    fontSize = 13.sp,
                    color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary,
                    modifier = Modifier.padding(18.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Enrolled Communities List
        Text(
            text = "Mis Clases Inscritas (${communities.size})",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
        )

        Spacer(modifier = Modifier.height(10.dp))

        communities.forEach { comm ->
            LiquidGlassCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 14.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = comm.name,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                        )
                        if (comm.code.isNotEmpty()) {
                            LiquidGlassBadge(
                                text = comm.code,
                                color = QNAIBlue
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "Profesor: ${comm.teacherName}",
                        fontSize = 13.sp,
                        color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                    )

                    if (comm.description.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = comm.description,
                            fontSize = 12.sp,
                            color = if (isDark) QNDarkTextSecondary.copy(alpha = 0.8f) else QNLightTextSecondary
                        )
                    }

                    // Class Materials Section
                    if (comm.materials.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "Materiales de Clase (${comm.materials.size})",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = QNTechPurple
                        )
                        Spacer(modifier = Modifier.height(6.dp))

                        comm.materials.forEach { mat ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (isDark) Color(0x22FFFFFF) else Color(0x0F000000))
                                    .clickable { selectedMaterial = mat }
                                    .padding(horizontal = 10.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Info,
                                    contentDescription = null,
                                    tint = QNAIBlue,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = mat.title,
                                    fontSize = 13.sp,
                                    color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = "Ver",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = QNAIBlue
                                )
                            }
                        }
                    }

                    // Class Exams Section
                    if (comm.exams.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "Evaluaciones Disponibles (${comm.exams.size})",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = QNAIBlue
                        )
                        Spacer(modifier = Modifier.height(6.dp))

                        comm.exams.forEach { exam ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (isDark) Color(0x335865F2) else Color(0x1A5865F2))
                                    .clickable {
                                        activeExamCommunityId = comm.id
                                        selectedExam = exam
                                        examAnswers = emptyMap()
                                        examResultScore = null
                                    }
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = exam.title,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                                    )
                                    Text(
                                        text = "${exam.questions.size} preguntas • ${exam.durationMinutes} min",
                                        fontSize = 11.sp,
                                        color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Default.PlayArrow,
                                    contentDescription = "Iniciar",
                                    tint = QNAIBlue,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal: Join Community by code
    if (showJoinDialog) {
        Dialog(onDismissRequest = { if (!isJoining) showJoinDialog = false }) {
            LiquidGlassCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp),
                isHighlighted = true
            ) {
                Column(modifier = Modifier.padding(22.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Unirse a una Clase",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                        )
                        IconButton(onClick = { showJoinDialog = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Cerrar")
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Ingresa el código proporcionado por tu profesor (ejemplo: QN-PHYS):",
                        fontSize = 13.sp,
                        color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = joinCodeInput,
                        onValueChange = { joinCodeInput = it.uppercase() },
                        label = { Text("Código de Comunidad") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = QNAIBlue,
                            unfocusedBorderColor = if (isDark) QNDarkBorder else QNLightBorder
                        )
                    )

                    if (joinError != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = joinError ?: "",
                            fontSize = 12.sp,
                            color = Color(0xFFE5484D)
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    LiquidGlassButton(
                        text = "UNIRME AHORA",
                        isLoading = isJoining,
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            if (joinCodeInput.isBlank()) {
                                joinError = "Ingresa un código válido"
                                return@LiquidGlassButton
                            }
                            scope.launch {
                                isJoining = true
                                joinError = null
                                val result = apiClient.joinCommunity(user.id, joinCodeInput)
                                isJoining = false
                                result.onSuccess { comm ->
                                    showJoinDialog = false
                                    onCommunityJoined(comm)
                                }
                            }
                        }
                    )
                }
            }
        }
    }

    // Modal: Material Details
    if (selectedMaterial != null) {
        val mat = selectedMaterial!!
        Dialog(onDismissRequest = { selectedMaterial = null }) {
            LiquidGlassCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp),
                isHighlighted = true
            ) {
                Column(
                    modifier = Modifier
                        .padding(22.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = mat.title,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = { selectedMaterial = null }) {
                            Icon(Icons.Default.Close, contentDescription = "Cerrar")
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (mat.fileName.isNotEmpty()) {
                        LiquidGlassBadge(
                            text = mat.fileName,
                            color = QNAIBlue,
                            icon = Icons.Default.Info
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    Text(
                        text = mat.content.ifBlank { "Contenido del material de estudio compartido por el profesor." },
                        fontSize = 14.sp,
                        lineHeight = 20.sp,
                        color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    LiquidGlassButton(
                        text = "ENTENDIDO",
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { selectedMaterial = null }
                    )
                }
            }
        }
    }

    // Modal: Exam / Evaluation Taker
    if (selectedExam != null) {
        val exam = selectedExam!!
        Dialog(onDismissRequest = { selectedExam = null }) {
            LiquidGlassCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp),
                isHighlighted = true
            ) {
                Column(
                    modifier = Modifier
                        .padding(22.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = exam.title,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = { selectedExam = null }) {
                            Icon(Icons.Default.Close, contentDescription = "Cerrar")
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    if (examResultScore != null) {
                        // Results View
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "Evaluación Completada",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = QNSuccess
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Tu Calificación: ${examResultScore} / ${exam.questions.size}",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                            )
                            Spacer(modifier = Modifier.height(20.dp))
                            LiquidGlassButton(
                                text = "CERRAR",
                                modifier = Modifier.fillMaxWidth(),
                                onClick = { selectedExam = null }
                            )
                        }
                    } else {
                        // Questions View
                        exam.questions.forEachIndexed { qIdx, question ->
                            Spacer(modifier = Modifier.height(14.dp))
                            Text(
                                text = "${qIdx + 1}. ${question.question}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                            )
                            Spacer(modifier = Modifier.height(6.dp))

                            question.options.forEachIndexed { oIdx, opt ->
                                val isSelected = examAnswers[qIdx] == oIdx
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(
                                            if (isSelected) QNAIBlue.copy(alpha = 0.2f)
                                            else Color.Transparent
                                        )
                                        .clickable {
                                            examAnswers = examAnswers.toMutableMap().apply {
                                                put(qIdx, oIdx)
                                            }
                                        }
                                        .padding(horizontal = 8.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(
                                        selected = isSelected,
                                        onClick = {
                                            examAnswers = examAnswers.toMutableMap().apply {
                                                put(qIdx, oIdx)
                                            }
                                        },
                                        colors = RadioButtonDefaults.colors(selectedColor = QNAIBlue)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = opt,
                                        fontSize = 13.sp,
                                        color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        LiquidGlassButton(
                            text = "ENVIAR EVALUACIÓN",
                            modifier = Modifier.fillMaxWidth(),
                            onClick = {
                                var score = 0
                                exam.questions.forEachIndexed { idx, q ->
                                    if (examAnswers[idx] == q.correctIndex) {
                                        score++
                                    }
                                }
                                examResultScore = score
                                scope.launch {
                                    apiClient.submitExam(
                                        userId = user.id,
                                        communityId = activeExamCommunityId,
                                        examId = exam.id,
                                        title = exam.title,
                                        score = score,
                                        total = exam.questions.size
                                    )
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}
