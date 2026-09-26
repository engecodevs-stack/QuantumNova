package com.example.quantumnova.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.quantumnova.R
import com.example.quantumnova.data.ApiClient
import com.example.quantumnova.data.User
import com.example.quantumnova.ui.components.LiquidGlassButton
import com.example.quantumnova.ui.components.LiquidGlassCard
import com.example.quantumnova.ui.theme.QNAIBlue
import com.example.quantumnova.ui.theme.QNBrandGradient
import com.example.quantumnova.ui.theme.QNDarkBgPrimary
import com.example.quantumnova.ui.theme.QNDarkBorder
import com.example.quantumnova.ui.theme.QNDarkTextPrimary
import com.example.quantumnova.ui.theme.QNDarkTextSecondary
import com.example.quantumnova.ui.theme.QNError
import com.example.quantumnova.ui.theme.QNLightBgPrimary
import com.example.quantumnova.ui.theme.QNLightBorder
import com.example.quantumnova.ui.theme.QNLightTextPrimary
import com.example.quantumnova.ui.theme.QNLightTextSecondary
import com.example.quantumnova.ui.theme.QNTechPurple
import kotlinx.coroutines.launch

@Composable
fun LobbyScreen(
    apiClient: ApiClient,
    onLoginSuccess: (User) -> Unit
) {
    val isDark = isAppInDarkTheme()
    val scope = rememberCoroutineScope()

    var showAuthModal by remember { mutableStateOf(false) }
    var isRegisterMode by remember { mutableStateOf(false) }
    var emailInput by remember { mutableStateOf("student@quantumnova.ai") }
    var passwordInput by remember { mutableStateOf("alumno123") }
    var fullnameInput by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val bgGradient = Brush.verticalGradient(
        colors = if (isDark) {
            listOf(
                Color(0xFF090910),
                QNDarkBgPrimary,
                Color(0xFF110E1C)
            )
        } else {
            listOf(
                QNLightBgPrimary,
                Color(0xFFEBEBF5),
                Color(0xFFF2EDFA)
            )
        }
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(bgGradient)
            .padding(horizontal = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(48.dp))

            // Logo with subtle glowing aura
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(110.dp)
                    .clip(RoundedCornerShape(32.dp))
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                QNAIBlue.copy(alpha = 0.35f),
                                Color.Transparent
                            )
                        )
                    )
            ) {
                Image(
                    painter = painterResource(id = R.drawable.quantumnova_logo),
                    contentDescription = "Quantum Nova Logo",
                    modifier = Modifier.size(90.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // App Name
            Text(
                text = "QUANTUM NOVA",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp,
                color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Inspiring Subtitle
            Text(
                text = "Tu Segundo Cerebro Digital\nImpulsado por IA",
                fontSize = 15.sp,
                fontWeight = FontWeight.Normal,
                textAlign = TextAlign.Center,
                lineHeight = 22.sp,
                color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Highlighted Feature Card in Liquid Glass
            LiquidGlassCard(
                modifier = Modifier.fillMaxWidth(),
                isHighlighted = true
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Compañero del Alumno",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = QNAIBlue
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Accede a tus clases, consulta tus notas con IA y registra tu asistencia al instante desde tu teléfono.",
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp,
                        color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(36.dp))

            // Main Liquid Glass Call To Action
            LiquidGlassButton(
                text = "INICIAR SESIÓN",
                icon = Icons.AutoMirrored.Filled.ArrowForward,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                onClick = {
                    isRegisterMode = false
                    errorMessage = null
                    showAuthModal = true
                }
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Quick Demo 1-Tap Access for Student Testing
            LiquidGlassButton(
                text = "Entrar como Estudiante Demo",
                icon = Icons.Default.PlayArrow,
                isSecondary = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                onClick = {
                    val demoUser = apiClient.loginDemoStudent()
                    onLoginSuccess(demoUser)
                }
            )

            Spacer(modifier = Modifier.height(48.dp))
        }

        // Auth Dialog (Login / Register modal)
        if (showAuthModal) {
            Dialog(onDismissRequest = { if (!isLoading) showAuthModal = false }) {
                LiquidGlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp),
                    isHighlighted = true
                ) {
                    Column(
                        modifier = Modifier
                            .padding(24.dp)
                            .verticalScroll(rememberScrollState())
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (isRegisterMode) "Crear Cuenta Alumno" else "Iniciar Sesión",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                            )
                            IconButton(
                                onClick = { showAuthModal = false },
                                enabled = !isLoading
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Cerrar",
                                    tint = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        if (isRegisterMode) {
                            OutlinedTextField(
                                value = fullnameInput,
                                onValueChange = { fullnameInput = it },
                                label = { Text("Nombre Completo") },
                                leadingIcon = {
                                    Icon(Icons.Default.Person, contentDescription = null, tint = QNAIBlue)
                                },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = QNAIBlue,
                                    unfocusedBorderColor = if (isDark) QNDarkBorder else QNLightBorder
                                )
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }

                        OutlinedTextField(
                            value = emailInput,
                            onValueChange = { emailInput = it },
                            label = { Text("Correo Electrónico") },
                            leadingIcon = {
                                Icon(Icons.Default.Person, contentDescription = null, tint = QNAIBlue)
                            },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = QNAIBlue,
                                unfocusedBorderColor = if (isDark) QNDarkBorder else QNLightBorder
                            )
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = passwordInput,
                            onValueChange = { passwordInput = it },
                            label = { Text("Contraseña") },
                            leadingIcon = {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = QNTechPurple)
                            },
                            singleLine = true,
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = QNAIBlue,
                                unfocusedBorderColor = if (isDark) QNDarkBorder else QNLightBorder
                            )
                        )

                        if (errorMessage != null) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = errorMessage ?: "",
                                color = QNError,
                                fontSize = 13.sp,
                                lineHeight = 16.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        LiquidGlassButton(
                            text = if (isRegisterMode) "REGISTRARME" else "INGRESAR",
                            isLoading = isLoading,
                            modifier = Modifier.fillMaxWidth(),
                            onClick = {
                                scope.launch {
                                    isLoading = true
                                    errorMessage = null
                                    if (isRegisterMode) {
                                        if (fullnameInput.isBlank() || emailInput.isBlank() || passwordInput.isBlank()) {
                                            errorMessage = "Por favor completa todos los campos"
                                            isLoading = false
                                            return@launch
                                        }
                                        val result = apiClient.register(fullnameInput, emailInput, passwordInput)
                                        isLoading = false
                                        result.fold(
                                            onSuccess = { user ->
                                                showAuthModal = false
                                                onLoginSuccess(user)
                                            },
                                            onFailure = { err ->
                                                errorMessage = err.message ?: "Error al registrar cuenta"
                                            }
                                        )
                                    } else {
                                        if (emailInput.isBlank() || passwordInput.isBlank()) {
                                            errorMessage = "Ingresa tu correo y contraseña"
                                            isLoading = false
                                            return@launch
                                        }
                                        val result = apiClient.login(emailInput, passwordInput)
                                        isLoading = false
                                        result.fold(
                                            onSuccess = { user ->
                                                showAuthModal = false
                                                onLoginSuccess(user)
                                            },
                                            onFailure = { err ->
                                                errorMessage = err.message ?: "Credenciales incorrectas"
                                            }
                                        )
                                    }
                                }
                            }
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        TextButton(
                            onClick = {
                                isRegisterMode = !isRegisterMode
                                errorMessage = null
                            },
                            modifier = Modifier.align(Alignment.CenterHorizontally)
                        ) {
                            Text(
                                text = if (isRegisterMode) "¿Ya tienes cuenta? Inicia sesión" else "¿Eres nuevo alumno? Regístrate aquí",
                                fontSize = 13.sp,
                                color = QNAIBlue
                            )
                        }
                    }
                }
            }
        }
    }
}
