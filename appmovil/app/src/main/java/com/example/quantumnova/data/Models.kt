package com.example.quantumnova.data

data class User(
    val id: String,
    val fullname: String,
    val username: String,
    val email: String,
    val role: String = "alumno"
)

data class Note(
    val id: String,
    val title: String,
    val content: String,
    val tags: List<String> = emptyList(),
    val updatedAt: String = "",
    val folderId: String? = null
)

data class Folder(
    val id: String,
    val name: String
)

data class Community(
    val id: String,
    val name: String,
    val description: String = "",
    val code: String = "",
    val teacherName: String = "Docente Quantum Nova",
    val materials: List<ClassMaterial> = emptyList(),
    val exams: List<CommunityExam> = emptyList()
)

data class ClassMaterial(
    val id: String,
    val title: String,
    val category: String = "presentacion",
    val content: String = "",
    val fileName: String = ""
)

data class CommunityExam(
    val id: String,
    val title: String,
    val description: String = "",
    val status: String = "activo", // activo, borrador, finalizado
    val durationMinutes: Int = 20,
    val questions: List<ExamQuestion> = emptyList()
)

data class ExamQuestion(
    val question: String,
    val options: List<String>,
    val correctIndex: Int = 0
)

data class AttendanceRecord(
    val communityId: String,
    val className: String,
    val teacherName: String,
    val timestamp: String,
    val status: String = "PRESENTE"
)

data class ChatMessage(
    val id: String = System.currentTimeMillis().toString(),
    val sender: String, // "user" o "quantum"
    val text: String,
    val timestamp: String = "",
    val contextNoteTitle: String? = null
)

data class MindMapNode(
    val id: String,
    val label: String,
    val tags: List<String> = emptyList(),
    val x: Float = 0f,
    val y: Float = 0f
)

data class MindMapEdge(
    val sourceId: String,
    val targetId: String,
    val label: String = ""
)
