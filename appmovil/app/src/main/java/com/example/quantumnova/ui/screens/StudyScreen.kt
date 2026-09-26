package com.example.quantumnova.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.quantumnova.data.ApiClient
import com.example.quantumnova.data.ChatMessage
import com.example.quantumnova.data.Note
import com.example.quantumnova.data.User
import com.example.quantumnova.ui.components.LiquidGlassBadge
import com.example.quantumnova.ui.components.LiquidGlassButton
import com.example.quantumnova.ui.components.LiquidGlassCard
import com.example.quantumnova.ui.theme.QNAIBlue
import com.example.quantumnova.ui.theme.QNBrandGradient
import com.example.quantumnova.ui.theme.QNDarkBgPrimary
import com.example.quantumnova.ui.theme.QNDarkBorder
import com.example.quantumnova.ui.theme.QNDarkTextPrimary
import com.example.quantumnova.ui.theme.QNDarkTextSecondary
import com.example.quantumnova.ui.theme.QNLightBgPrimary
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
fun StudyScreen(
    user: User,
    notes: List<Note>,
    apiClient: ApiClient,
    initialTab: Int = 0,
    initialNote: Note? = null,
    initialPrompt: String? = null,
    onNoteCreatedOrUpdated: (Note) -> Unit
) {
    val isDark = isAppInDarkTheme()
    var selectedTabIndex by remember { mutableIntStateOf(initialTab) }

    // Active Note Editor/Viewer State
    var activeNote by remember { mutableStateOf(initialNote) }
    var isEditingNote by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()

    LaunchedEffect(initialTab) {
        selectedTabIndex = initialTab
    }
    LaunchedEffect(initialNote) {
        if (initialNote != null) {
            activeNote = initialNote
            selectedTabIndex = 0
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 12.dp)
    ) {
        // Study Tabs: [Notas] [Tutor IA] [Mapa Mental]
        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = Color.Transparent,
            contentColor = QNAIBlue,
            divider = {},
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                    color = QNAIBlue,
                    height = 2.5.dp
                )
            },
            modifier = Modifier.padding(horizontal = 16.dp)
        ) {
            val tabs = listOf("Mis Notas", "Tutor IA", "Mapa Mental")
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = {
                        Text(
                            text = title,
                            fontSize = 14.sp,
                            fontWeight = if (selectedTabIndex == index) FontWeight.Bold else FontWeight.Medium,
                            color = if (selectedTabIndex == index) QNAIBlue else if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                        )
                    }
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 80.dp)
        ) {
            when (selectedTabIndex) {
                0 -> NotesSubScreen(
                    notes = notes,
                    activeNote = activeNote,
                    isEditingNote = isEditingNote,
                    onSelectNote = { note ->
                        activeNote = note
                        isEditingNote = false
                    },
                    onNewNote = {
                        activeNote = Note(
                            id = "",
                            title = "",
                            content = "",
                            tags = listOf("General")
                        )
                        isEditingNote = true
                    },
                    onSaveNote = { title, content, tags ->
                        val n = activeNote
                        scope.launch {
                            val saved = apiClient.saveNote(user.id, n?.id?.ifBlank { null }, title, content, tags)
                            saved.onSuccess {
                                activeNote = it
                                isEditingNote = false
                                onNoteCreatedOrUpdated(it)
                            }
                        }
                    },
                    onBackToList = {
                        activeNote = null
                        isEditingNote = false
                    },
                    onAskAIAssistant = { noteToAsk ->
                        activeNote = noteToAsk
                        selectedTabIndex = 1
                    }
                )
                1 -> ChatSubScreen(
                    user = user,
                    notes = notes,
                    initialContextNote = activeNote,
                    initialPrompt = initialPrompt,
                    apiClient = apiClient
                )
                2 -> MindMapSubScreen(
                    notes = notes,
                    onSelectNote = { note ->
                        activeNote = note
                        selectedTabIndex = 0
                    }
                )
            }
        }
    }
}

// -------------------------------------------------------------
// SUB-SCREEN 1: MIS NOTAS
// -------------------------------------------------------------
@Composable
fun NotesSubScreen(
    notes: List<Note>,
    activeNote: Note?,
    isEditingNote: Boolean,
    onSelectNote: (Note) -> Unit,
    onNewNote: () -> Unit,
    onSaveNote: (title: String, content: String, tags: List<String>) -> Unit,
    onBackToList: () -> Unit,
    onAskAIAssistant: (Note) -> Unit
) {
    val isDark = isAppInDarkTheme()
    var searchQuery by remember { mutableStateOf("") }
    val filteredNotes = notes.filter {
        it.title.contains(searchQuery, ignoreCase = true) ||
                it.tags.any { t -> t.contains(searchQuery, ignoreCase = true) }
    }

    if (activeNote != null) {
        // Detailed Note View or Simple Editor
        var editTitle by remember(activeNote) { mutableStateOf(activeNote.title) }
        var editContent by remember(activeNote) { mutableStateOf(activeNote.content) }
        var editTags by remember(activeNote) { mutableStateOf(activeNote.tags.joinToString(", ")) }
        var isEditing by remember { mutableStateOf(isEditingNote || activeNote.id.isBlank()) }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Note Top Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBackToList) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Regresar",
                        tint = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                    )
                }

                Row {
                    if (!isEditing) {
                        LiquidGlassButton(
                            text = "Consultar con IA",
                            isSecondary = true,
                            modifier = Modifier.height(38.dp),
                            onClick = { onAskAIAssistant(activeNote) }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        IconButton(onClick = { isEditing = true }) {
                            Icon(Icons.Default.Edit, contentDescription = "Editar", tint = QNAIBlue)
                        }
                    } else {
                        LiquidGlassButton(
                            text = "Guardar",
                            icon = Icons.Default.Check,
                            modifier = Modifier.height(38.dp),
                            onClick = {
                                val tagsList = editTags.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                                onSaveNote(editTitle.ifBlank { "Sin Título" }, editContent, tagsList)
                                isEditing = false
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (isEditing) {
                OutlinedTextField(
                    value = editTitle,
                    onValueChange = { editTitle = it },
                    label = { Text("Título de la Nota") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = QNAIBlue,
                        unfocusedBorderColor = if (isDark) QNDarkBorder else QNLightBorder
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = editTags,
                    onValueChange = { editTags = it },
                    label = { Text("Etiquetas (separadas por coma)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = QNTechPurple,
                        unfocusedBorderColor = if (isDark) QNDarkBorder else QNLightBorder
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = editContent,
                    onValueChange = { editContent = it },
                    label = { Text("Contenido de la Nota") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(320.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = QNAIBlue,
                        unfocusedBorderColor = if (isDark) QNDarkBorder else QNLightBorder
                    )
                )
            } else {
                Text(
                    text = activeNote.title,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                )

                if (activeNote.tags.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow {
                        items(activeNote.tags) { tag ->
                            LiquidGlassBadge(
                                text = "#$tag",
                                color = QNTechPurple,
                                modifier = Modifier.padding(end = 6.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                LiquidGlassCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = activeNote.content.ifBlank { "Nota sin contenido registrado." },
                        fontSize = 15.sp,
                        lineHeight = 22.sp,
                        color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary,
                        modifier = Modifier.padding(18.dp)
                    )
                }
            }
        }
    } else {
        // Notes List Screen
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Mis Notas (${notes.size})",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                )

                LiquidGlassButton(
                    text = "Nueva Nota",
                    icon = Icons.Default.Add,
                    modifier = Modifier.height(40.dp),
                    onClick = onNewNote
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Buscar apuntes o #etiquetas...") },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null, tint = QNAIBlue)
                },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = QNAIBlue,
                    unfocusedBorderColor = if (isDark) QNDarkBorder else QNLightBorder
                )
            )

            Spacer(modifier = Modifier.height(14.dp))

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredNotes) { note ->
                    LiquidGlassCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectNote(note) }
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = note.title,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = note.updatedAt.ifBlank { "Reciente" },
                                    fontSize = 11.sp,
                                    color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                                )
                            }

                            Spacer(modifier = Modifier.height(6.dp))

                            Text(
                                text = note.content.take(80).replace("\n", " ") + "...",
                                fontSize = 13.sp,
                                color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                            )

                            if (note.tags.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Row {
                                    note.tags.take(3).forEach { tag ->
                                        LiquidGlassBadge(
                                            text = "#$tag",
                                            color = QNTechPurple,
                                            modifier = Modifier.padding(end = 6.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// SUB-SCREEN 2: TUTOR IA QUANTUM (CHAT CONTEXTUAL)
// -------------------------------------------------------------
@Composable
fun ChatSubScreen(
    user: User,
    notes: List<Note>,
    initialContextNote: Note?,
    initialPrompt: String?,
    apiClient: ApiClient
) {
    val isDark = isAppInDarkTheme()
    val scope = rememberCoroutineScope()

    var messages by remember {
        mutableStateOf(
            listOf(
                ChatMessage(
                    sender = "quantum",
                    text = "¡Hola, ${user.fullname.split(" ").firstOrNull()}! Soy Quantum, tu tutor de estudio. ¿En qué concepto o nota te ayudo hoy?",
                    timestamp = "Ahora"
                )
            )
        )
    }

    var selectedContextNote by remember { mutableStateOf(initialContextNote) }
    var inputText by remember { mutableStateOf(initialPrompt ?: "") }
    var isThinking by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        // Context Note Chip selector
        if (notes.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Contexto:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                )
                Spacer(modifier = Modifier.width(8.dp))
                LazyRow {
                    item {
                        LiquidGlassBadge(
                            text = if (selectedContextNote != null) selectedContextNote!!.title.take(18) + " ✕" else "Toda mi biblioteca",
                            color = if (selectedContextNote != null) QNAIBlue else QNTechPurple,
                            modifier = Modifier.clickable {
                                selectedContextNote = if (selectedContextNote == null) notes.firstOrNull() else null
                            }
                        )
                    }
                }
            }
        }

        // Quick Suggestion Chips
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp)
        ) {
            val suggestions = listOf(
                "Explícame con una analogía",
                "Hazme 2 preguntas de examen",
                "Resume los puntos clave",
                "¿Cómo se aplica en la vida real?"
            )
            items(suggestions) { prompt ->
                Box(
                    modifier = Modifier
                        .padding(end = 8.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isDark) Color(0x22FFFFFF) else Color(0x105865F2))
                        .clickable {
                            inputText = prompt
                        }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = prompt,
                        fontSize = 12.sp,
                        color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                    )
                }
            }
        }

        // Messages List
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(messages) { msg ->
                val isUser = msg.sender == "user"
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                ) {
                    val bubbleShape = RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp
                    )
                    val bubbleModifier = if (isUser) {
                        Modifier.background(QNBrandGradient, bubbleShape)
                    } else {
                        Modifier.background(
                            if (isDark) Color(0xD9181824) else Color(0xF0FFFFFF),
                            bubbleShape
                        )
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.85f)
                            .clip(bubbleShape)
                            .then(bubbleModifier)
                            .padding(14.dp)
                    ) {
                        Column {
                            if (!isUser) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(QNAIBlue)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Quantum IA",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = QNAIBlue
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                            }
                            Text(
                                text = msg.text,
                                fontSize = 14.sp,
                                lineHeight = 20.sp,
                                color = if (isUser) Color.White else if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                            )
                        }
                    }
                }
            }

            if (isThinking) {
                item {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(start = 8.dp)
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = QNAIBlue
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Quantum pensando...",
                            fontSize = 12.sp,
                            color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Input Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                placeholder = { Text("Escribe tu consulta a Quantum...") },
                modifier = Modifier.weight(1f),
                singleLine = false,
                maxLines = 3,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = QNAIBlue,
                    unfocusedBorderColor = if (isDark) QNDarkBorder else QNLightBorder
                )
            )

            Spacer(modifier = Modifier.width(8.dp))

            LiquidGlassButton(
                text = "",
                icon = Icons.AutoMirrored.Filled.Send,
                enabled = inputText.isNotBlank() && !isThinking,
                modifier = Modifier
                    .size(50.dp)
                    .clip(CircleShape),
                onClick = {
                    val prompt = inputText.trim()
                    inputText = ""
                    val time = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
                    val userMsg = ChatMessage(sender = "user", text = prompt, timestamp = time)
                    messages = messages + userMsg

                    scope.launch {
                        isThinking = true
                        val contextNotes = if (selectedContextNote != null) listOf(selectedContextNote!!) else notes
                        val reply = apiClient.chatWithTutor(user.id, prompt, messages, contextNotes)
                        isThinking = false
                        messages = messages + ChatMessage(sender = "quantum", text = reply, timestamp = time)
                    }
                }
            )
        }
    }
}

// -------------------------------------------------------------
// SUB-SCREEN 3: MAPA MENTAL INTERACTIVO (CONSULTA MÓVIL)
// -------------------------------------------------------------
@Composable
fun MindMapSubScreen(
    notes: List<Note>,
    onSelectNote: (Note) -> Unit
) {
    val isDark = isAppInDarkTheme()
    var scale by remember { mutableFloatStateOf(1f) }
    var offsetX by remember { mutableFloatStateOf(0f) }
    var offsetY by remember { mutableFloatStateOf(0f) }
    var selectedNoteByNode by remember { mutableStateOf<Note?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Grafo de Conocimiento",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) QNDarkTextPrimary else QNLightTextPrimary
                )
                Text(
                    text = "Desplaza y haz zoom para explorar relaciones",
                    fontSize = 12.sp,
                    color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                )
            }

            LiquidGlassBadge(
                text = "${notes.size} Nodos",
                color = QNAIBlue
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Interactive Canvas Container
        LiquidGlassCard(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectTransformGestures { _, pan, zoom, _ ->
                            scale = (scale * zoom).coerceIn(0.6f, 2.5f)
                            offsetX += pan.x
                            offsetY += pan.y
                        }
                    }
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val cx = size.width / 2 + offsetX
                    val cy = size.height / 2 + offsetY
                    val radius = 120.dp.toPx() * scale

                    // Draw connections to center
                    notes.forEachIndexed { i, _ ->
                        val angle = (i.toDouble() / notes.size.coerceAtLeast(1)) * 2 * Math.PI
                        val nx = cx + (Math.cos(angle) * radius).toFloat()
                        val ny = cy + (Math.sin(angle) * radius).toFloat()
                        drawLine(
                            color = if (isDark) Color(0x445865F2) else Color(0x335865F2),
                            start = Offset(cx, cy),
                            end = Offset(nx, ny),
                            strokeWidth = 2.dp.toPx()
                        )
                    }

                    // Draw Central Node ("Segundo Cerebro")
                    drawCircle(
                        color = QNAIBlue,
                        radius = 28.dp.toPx() * scale,
                        center = Offset(cx, cy)
                    )

                    // Draw Note Nodes
                    notes.forEachIndexed { i, _ ->
                        val angle = (i.toDouble() / notes.size.coerceAtLeast(1)) * 2 * Math.PI
                        val nx = cx + (Math.cos(angle) * radius).toFloat()
                        val ny = cy + (Math.sin(angle) * radius).toFloat()
                        drawCircle(
                            color = QNTechPurple,
                            radius = 18.dp.toPx() * scale,
                            center = Offset(nx, ny)
                        )
                    }
                }

                // Interactive Overlaid Node Labels
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(12.dp)
                ) {
                    Text(
                        text = "Toca un concepto para abrir la nota asociada:",
                        fontSize = 11.sp,
                        color = if (isDark) QNDarkTextSecondary else QNLightTextSecondary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    LazyRow {
                        items(notes) { note ->
                            Box(
                                modifier = Modifier
                                    .padding(end = 8.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isDark) Color(0xD9181824) else Color(0xF0FFFFFF))
                                    .clickable { onSelectNote(note) }
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    text = note.title,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = QNAIBlue
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
