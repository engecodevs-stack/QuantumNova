package com.example.quantumnova

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.Crossfade
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.quantumnova.data.ApiClient
import com.example.quantumnova.data.AppPreferences
import com.example.quantumnova.data.AttendanceRecord
import com.example.quantumnova.data.Community
import com.example.quantumnova.data.Note
import com.example.quantumnova.data.User
import com.example.quantumnova.ui.screens.AulaScreen
import com.example.quantumnova.ui.screens.HomeScreen
import com.example.quantumnova.ui.screens.LobbyScreen
import com.example.quantumnova.ui.screens.ProfileScreen
import com.example.quantumnova.ui.screens.StudyScreen
import com.example.quantumnova.ui.theme.QNAIBlue
import com.example.quantumnova.ui.theme.QNBrandGradient
import com.example.quantumnova.ui.theme.QNDarkBgPrimary
import com.example.quantumnova.ui.theme.QNDarkGlassBorder
import com.example.quantumnova.ui.theme.QNDarkGlassSurface
import com.example.quantumnova.ui.theme.QNDarkTextPrimary
import com.example.quantumnova.ui.theme.QNDarkTextSecondary
import com.example.quantumnova.ui.theme.QNLightBgPrimary
import com.example.quantumnova.ui.theme.QNLightGlassBorder
import com.example.quantumnova.ui.theme.QNLightGlassSurface
import com.example.quantumnova.ui.theme.QNLightTextPrimary
import com.example.quantumnova.ui.theme.QNLightTextSecondary
import com.example.quantumnova.ui.theme.QNTechPurple
import com.example.quantumnova.ui.theme.QuantumNovaTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val preferences = AppPreferences(applicationContext)
        val apiClient = ApiClient(preferences)

        setContent {
            var isDarkMode by remember { mutableStateOf(preferences.isDarkMode) }

            QuantumNovaTheme(darkTheme = isDarkMode) {
                MainApp(
                    preferences = preferences,
                    apiClient = apiClient,
                    onToggleDarkMode = { isDarkMode = it }
                )
            }
        }
    }
}

enum class StudentTab(val label: String, val icon: ImageVector) {
    INICIO("Inicio", Icons.Default.Home),
    AULA("Aula", Icons.Default.DateRange),
    ESTUDIAR("Estudiar", Icons.Default.Edit),
    PERFIL("Perfil", Icons.Default.Person)
}

@Composable
fun MainApp(
    preferences: AppPreferences,
    apiClient: ApiClient,
    onToggleDarkMode: (Boolean) -> Unit
) {
    val scope = rememberCoroutineScope()
    var currentUser by remember { mutableStateOf(preferences.getUser()) }
    var currentTab by remember { mutableStateOf(StudentTab.INICIO) }

    // Global Student Data (Pre-populated for instantaneous response)
    var notes by remember { mutableStateOf<List<Note>>(apiClient.getSampleNotes()) }
    var communities by remember { mutableStateOf<List<Community>>(apiClient.getSampleCommunities()) }
    var attendanceList by remember { mutableStateOf<List<AttendanceRecord>>(preferences.getAttendanceRecords()) }

    // Inter-screen navigation parameters
    var studyTargetNote by remember { mutableStateOf<Note?>(null) }
    var studyTargetPrompt by remember { mutableStateOf<String?>(null) }
    var studySubTab by remember { mutableIntStateOf(0) }

    // Load and sync data in background when user is logged in
    LaunchedEffect(currentUser) {
        if (currentUser != null) {
            scope.launch {
                val remoteNotes = apiClient.getNotes(currentUser!!.id)
                if (remoteNotes.isNotEmpty()) notes = remoteNotes
                val remoteComm = apiClient.getStudentCommunities(currentUser!!.id)
                if (remoteComm.isNotEmpty()) communities = remoteComm
            }
        }
    }

    AnimatedContent(
        targetState = currentUser != null,
        transitionSpec = { fadeIn() togetherWith fadeOut() },
        label = "AuthTransition"
    ) { isLoggedIn ->
        if (!isLoggedIn) {
            LobbyScreen(
                apiClient = apiClient,
                onLoginSuccess = { user ->
                    currentUser = user
                    currentTab = StudentTab.INICIO
                }
            )
        } else {
            val user = currentUser ?: preferences.getUser() ?: apiClient.loginDemoStudent()
            val isDark = isAppInDarkTheme()

            Scaffold(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding(),
                bottomBar = {
                    LiquidGlassBottomNavBar(
                        currentTab = currentTab,
                        onTabSelected = { tab ->
                            if (tab == StudentTab.ESTUDIAR && currentTab != StudentTab.ESTUDIAR) {
                                studySubTab = 0
                                studyTargetNote = null
                                studyTargetPrompt = null
                            }
                            currentTab = tab
                        }
                    )
                },
                containerColor = if (isDark) QNDarkBgPrimary else QNLightBgPrimary
            ) { innerPadding ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    AnimatedContent(
                        targetState = currentTab,
                        transitionSpec = {
                            fadeIn() togetherWith fadeOut()
                        },
                        label = "TabContent"
                    ) { tab ->
                        when (tab) {
                            StudentTab.INICIO -> HomeScreen(
                                user = user,
                                notes = notes,
                                communities = communities,
                                attendanceList = attendanceList,
                                onRegisterAttendance = { record ->
                                    preferences.saveAttendance(record)
                                    attendanceList = preferences.getAttendanceRecords()
                                },
                                onNavigateToStudy = { note ->
                                    studyTargetNote = note
                                    studySubTab = 0
                                    currentTab = StudentTab.ESTUDIAR
                                },
                                onNavigateToChat = { prompt ->
                                    studyTargetPrompt = prompt
                                    studySubTab = 1
                                    currentTab = StudentTab.ESTUDIAR
                                },
                                onNavigateToAula = {
                                    currentTab = StudentTab.AULA
                                }
                            )

                            StudentTab.AULA -> AulaScreen(
                                user = user,
                                communities = communities,
                                attendanceList = attendanceList,
                                apiClient = apiClient,
                                onRegisterAttendance = { record ->
                                    preferences.saveAttendance(record)
                                    attendanceList = preferences.getAttendanceRecords()
                                },
                                onCommunityJoined = { newComm ->
                                    communities = communities + newComm
                                }
                            )

                            StudentTab.ESTUDIAR -> StudyScreen(
                                user = user,
                                notes = notes,
                                apiClient = apiClient,
                                initialTab = studySubTab,
                                initialNote = studyTargetNote,
                                initialPrompt = studyTargetPrompt,
                                onNoteCreatedOrUpdated = { updatedNote ->
                                    notes = listOf(updatedNote) + notes.filter { it.id != updatedNote.id }
                                }
                            )

                            StudentTab.PERFIL -> ProfileScreen(
                                user = user,
                                preferences = preferences,
                                apiClient = apiClient,
                                totalNotesCount = notes.size,
                                attendanceList = attendanceList,
                                onToggleDarkMode = onToggleDarkMode,
                                onLogout = {
                                    currentUser = null
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Premium Liquid Glass Floating Navigation Bar
 */
@Composable
fun LiquidGlassBottomNavBar(
    currentTab: StudentTab,
    onTabSelected: (StudentTab) -> Unit
) {
    val isDark = isAppInDarkTheme()
    val shape = RoundedCornerShape(26.dp)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 20.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(shape)
                .background(
                    if (isDark) QNDarkGlassSurface else QNLightGlassSurface
                )
                .border(
                    width = 1.dp,
                    color = if (isDark) QNDarkGlassBorder else QNLightGlassBorder,
                    shape = shape
                )
                .padding(vertical = 8.dp, horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            StudentTab.entries.forEach { tab ->
                val isSelected = currentTab == tab

                Column(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .clickable { onTabSelected(tab) }
                        .padding(horizontal = 14.dp, vertical = 6.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = tab.icon,
                        contentDescription = tab.label,
                        tint = if (isSelected) QNAIBlue else if (isDark) QNDarkTextSecondary else QNLightTextSecondary,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                        text = tab.label,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        color = if (isSelected) QNAIBlue else if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                    )
                }
            }
        }
    }
}