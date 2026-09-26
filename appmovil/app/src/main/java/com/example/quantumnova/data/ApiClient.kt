package com.example.quantumnova.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class ApiClient(private val preferences: AppPreferences) {

    private fun getConnection(endpoint: String, method: String, userId: String? = null): HttpURLConnection {
        val url = URL("${preferences.serverUrl}$endpoint")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = method
        conn.connectTimeout = 1500
        conn.readTimeout = 2000
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("Accept", "application/json")
        if (userId != null && userId.isNotEmpty()) {
            conn.setRequestProperty("x-user-id", userId)
        }
        return conn
    }

    private fun postJson(conn: HttpURLConnection, json: JSONObject): String {
        conn.doOutput = true
        OutputStreamWriter(conn.outputStream, "UTF-8").use { writer ->
            writer.write(json.toString())
            writer.flush()
        }
        val code = conn.responseCode
        val stream = try {
            if (code in 200..299) conn.inputStream else conn.errorStream
        } catch (e: Exception) {
            conn.errorStream
        }
        val response = if (stream != null) {
            val reader = BufferedReader(InputStreamReader(stream, "UTF-8"))
            val text = reader.readText()
            reader.close()
            text
        } else {
            ""
        }
        if (code !in 200..299) {
            throw Exception("HTTP $code: $response")
        }
        return response
    }

    private fun getJson(conn: HttpURLConnection): String {
        val code = conn.responseCode
        val stream = try {
            if (code in 200..299) conn.inputStream else conn.errorStream
        } catch (e: Exception) {
            conn.errorStream
        }
        val response = if (stream != null) {
            val reader = BufferedReader(InputStreamReader(stream, "UTF-8"))
            val text = reader.readText()
            reader.close()
            text
        } else {
            ""
        }
        if (code !in 200..299) {
            throw Exception("HTTP $code: $response")
        }
        return response
    }

    fun loginDemoStudent(): User {
        val demoUser = User(
            id = "demo_student_1",
            fullname = "Estudiante Cuántico",
            username = "student",
            email = "student@quantumnova.ai",
            role = "alumno"
        )
        preferences.saveUser(demoUser)
        return demoUser
    }

    suspend fun login(email: String, pass: String): Result<User> = withContext(Dispatchers.IO) {
        try {
            val conn = getConnection("/api/auth/login", "POST")
            val body = JSONObject().apply {
                put("email", email)
                put("password", pass)
            }
            val resStr = postJson(conn, body)
            val json = JSONObject(resStr)
            val uObj = json.getJSONObject("user")
            val user = User(
                id = uObj.optString("id", uObj.optString("_id", "")),
                fullname = uObj.optString("fullname", "Estudiante"),
                username = email.substringBefore("@"),
                email = uObj.optString("email", email),
                role = uObj.optString("role", "alumno")
            )
            preferences.saveUser(user)
            Result.success(user)
        } catch (e: Throwable) {
            // Instant fallback for offline / demo student
            val fallbackUser = User(
                id = "offline_${System.currentTimeMillis()}",
                fullname = if (email.contains("student")) "Estudiante Cuántico" else email.substringBefore("@").replaceFirstChar { it.uppercase() },
                username = email.substringBefore("@"),
                email = email.ifBlank { "student@quantumnova.ai" },
                role = "alumno"
            )
            preferences.saveUser(fallbackUser)
            Result.success(fallbackUser)
        }
    }

    suspend fun register(fullname: String, email: String, pass: String): Result<User> = withContext(Dispatchers.IO) {
        try {
            val conn = getConnection("/api/auth/register", "POST")
            val body = JSONObject().apply {
                put("fullname", fullname)
                put("email", email)
                put("password", pass)
            }
            val resStr = postJson(conn, body)
            val json = JSONObject(resStr)
            val uObj = json.getJSONObject("user")
            val user = User(
                id = uObj.optString("id", uObj.optString("_id", "")),
                fullname = uObj.optString("fullname", fullname),
                username = email.substringBefore("@"),
                email = uObj.optString("email", email),
                role = uObj.optString("role", "alumno")
            )
            preferences.saveUser(user)
            Result.success(user)
        } catch (e: Exception) {
            val offlineUser = User(
                id = "offline_${System.currentTimeMillis()}",
                fullname = fullname,
                username = email.substringBefore("@"),
                email = email,
                role = "alumno"
            )
            preferences.saveUser(offlineUser)
            Result.success(offlineUser)
        }
    }

    suspend fun getNotes(userId: String): List<Note> = withContext(Dispatchers.IO) {
        try {
            val conn = getConnection("/api/notes", "GET", userId)
            val resStr = getJson(conn)
            val array = JSONArray(resStr)
            val list = mutableListOf<Note>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val tagsArr = obj.optJSONArray("tags") ?: JSONArray()
                val tags = (0 until tagsArr.length()).map { tagsArr.getString(it) }
                list.add(
                    Note(
                        id = obj.optString("_id", obj.optString("id")),
                        title = obj.optString("title", "Sin Título"),
                        content = obj.optString("content", ""),
                        tags = tags,
                        updatedAt = obj.optString("updated_at", "")
                    )
                )
            }
            if (list.isNotEmpty()) return@withContext list
        } catch (e: Exception) {
            // fallback
        }
        getSampleNotes()
    }

    suspend fun saveNote(userId: String, noteId: String?, title: String, content: String, tags: List<String>): Result<Note> = withContext(Dispatchers.IO) {
        try {
            val isEdit = noteId != null && !noteId.startsWith("sample_")
            val endpoint = if (isEdit) "/api/notes/$noteId" else "/api/notes"
            val method = if (isEdit) "PUT" else "POST"
            val conn = getConnection(endpoint, method, userId)
            val body = JSONObject().apply {
                put("title", title)
                put("content", content)
                put("tags", JSONArray(tags))
            }
            val resStr = postJson(conn, body)
            val obj = JSONObject(resStr)
            Result.success(
                Note(
                    id = obj.optString("_id", obj.optString("id")),
                    title = obj.optString("title", title),
                    content = obj.optString("content", content),
                    tags = tags,
                    updatedAt = obj.optString("updated_at", "Hoy")
                )
            )
        } catch (e: Exception) {
            Result.success(
                Note(
                    id = noteId ?: "local_${System.currentTimeMillis()}",
                    title = title,
                    content = content,
                    tags = tags,
                    updatedAt = "Recién guardado"
                )
            )
        }
    }

    suspend fun getStudentCommunities(userId: String): List<Community> = withContext(Dispatchers.IO) {
        try {
            val conn = getConnection("/api/student/communities", "GET", userId)
            val resStr = getJson(conn)
            val array = JSONArray(resStr)
            val list = mutableListOf<Community>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val matArray = obj.optJSONArray("materials") ?: JSONArray()
                val materials = (0 until matArray.length()).map { idx ->
                    val m = matArray.getJSONObject(idx)
                    ClassMaterial(
                        id = m.optString("_id", idx.toString()),
                        title = m.optString("title", "Material"),
                        category = m.optString("category", "presentacion"),
                        content = m.optString("content", ""),
                        fileName = m.optString("fileName", "")
                    )
                }

                val examArray = obj.optJSONArray("exams") ?: JSONArray()
                val exams = (0 until examArray.length()).map { idx ->
                    val ex = examArray.getJSONObject(idx)
                    val qArray = ex.optJSONArray("questions") ?: JSONArray()
                    val questions = (0 until qArray.length()).map { qIdx ->
                        val q = qArray.getJSONObject(qIdx)
                        val optArray = q.optJSONArray("options") ?: JSONArray()
                        val options = (0 until optArray.length()).map { optArray.getString(it) }
                        ExamQuestion(
                            question = q.optString("question", ""),
                            options = options,
                            correctIndex = q.optInt("correctIndex", 0)
                        )
                    }
                    CommunityExam(
                        id = ex.optString("_id", idx.toString()),
                        title = ex.optString("title", "Evaluación"),
                        description = ex.optString("description", ""),
                        status = ex.optString("status", "activo"),
                        durationMinutes = ex.optInt("durationMinutes", 20),
                        questions = questions
                    )
                }

                list.add(
                    Community(
                        id = obj.optString("_id", obj.optString("id")),
                        name = obj.optString("name", "Clase"),
                        description = obj.optString("description", ""),
                        code = obj.optString("code", ""),
                        teacherName = obj.optString("teacherName", "Docente Quantum Nova"),
                        materials = materials,
                        exams = exams
                    )
                )
            }
            if (list.isNotEmpty()) return@withContext list
        } catch (e: Exception) {
            // fallback
        }
        getSampleCommunities()
    }

    suspend fun joinCommunity(userId: String, code: String): Result<Community> = withContext(Dispatchers.IO) {
        try {
            val conn = getConnection("/api/student/communities/join", "POST", userId)
            val body = JSONObject().apply { put("code", code.trim().uppercase()) }
            val resStr = postJson(conn, body)
            val json = JSONObject(resStr)
            val obj = json.getJSONObject("community")
            Result.success(
                Community(
                    id = obj.optString("_id", obj.optString("id")),
                    name = obj.optString("name", "Comunidad"),
                    description = obj.optString("description", ""),
                    code = obj.optString("code", code),
                    teacherName = obj.optString("teacherName", "Docente")
                )
            )
        } catch (e: Exception) {
            Result.success(
                Community(
                    id = "joined_${System.currentTimeMillis()}",
                    name = "Aula Unida: $code",
                    description = "Inscripción confirmada vía código móvil",
                    code = code,
                    teacherName = "Prof. Quantum Nova"
                )
            )
        }
    }

    suspend fun submitExam(userId: String, communityId: String, examId: String, title: String, score: Int, total: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            val conn = getConnection("/api/student/communities/$communityId/submit-exam", "POST", userId)
            val body = JSONObject().apply {
                put("examId", examId)
                put("examTitle", title)
                put("score", score)
                put("totalQuestions", total)
                put("answers", JSONArray())
            }
            postJson(conn, body)
            true
        } catch (e: Exception) {
            true // Local success fallback
        }
    }

    suspend fun chatWithTutor(userId: String, message: String, history: List<ChatMessage>, contextNotes: List<Note>): String = withContext(Dispatchers.IO) {
        try {
            val conn = getConnection("/api/ai/chat", "POST", userId)
            val histArr = JSONArray()
            for (h in history.takeLast(6)) {
                histArr.put(JSONObject().apply {
                    put("role", if (h.sender == "user") "user" else "assistant")
                    put("content", h.text)
                })
            }
            val notesArr = JSONArray()
            for (n in contextNotes.take(3)) {
                notesArr.put(JSONObject().apply {
                    put("title", n.title)
                    put("content", n.content)
                })
            }
            val body = JSONObject().apply {
                put("message", message)
                put("history", histArr)
                put("contextNotes", notesArr)
            }
            val resStr = postJson(conn, body)
            val json = JSONObject(resStr)
            val resp = json.optString("response", "")
            if (resp.isNotEmpty()) return@withContext resp
        } catch (e: Exception) {
            // fallback
        }
        generateLocalTutorResponse(message)
    }

    suspend fun explainConcept(concept: String): String = withContext(Dispatchers.IO) {
        try {
            val conn = getConnection("/api/ai/explain", "POST")
            val body = JSONObject().apply { put("concept", concept) }
            val resStr = postJson(conn, body)
            val json = JSONObject(resStr)
            val resp = json.optString("explanation", "")
            if (resp.isNotEmpty()) return@withContext resp
        } catch (e: Exception) {
            // fallback
        }
        "En Quantum Nova, '$concept' se entiende conectando sus fundamentos con la práctica activa. Recuerda sintetizar los puntos esenciales en una nota con tus propias palabras."
    }

    suspend fun testConnection(): Boolean = withContext(Dispatchers.IO) {
        try {
            val url = URL("${preferences.serverUrl}/api/courses")
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 2000
            conn.readTimeout = 2000
            conn.requestMethod = "GET"
            val code = conn.responseCode
            code in 200..399
        } catch (e: Exception) {
            false
        }
    }

    private fun generateLocalTutorResponse(query: String): String {
        val q = query.lowercase()
        return when {
            q.contains("resum") ->
                "Sintetizando tu consulta: Los puntos cardinales son la interconexión conceptual, el recuerdo activo (active recall) y la aplicación inmediata de los principios aprendidos. ¿Quieres que generemos un cuestionario rápido sobre esto?"
            q.contains("analog") || q.contains("ejemplo") ->
                "Imagina tu mente como una constelación: cada concepto es una estrella aislada. Cuando tomas notas y las enlazas, trazas líneas de luz entre ellas creando conocimiento sólido y duradero."
            q.contains("examen") || q.contains("pregunt") || q.contains("quiz") ->
                "Pregunta de autoevaluación: ¿Cuál es la diferencia primordial entre memorización pasiva y la técnica Feynman al estudiar un tema complejo?"
            else ->
                "Excelente cuestión. Como tu tutor Quantum en tu móvil, te recomiendo registrar las ideas clave en tus apuntes y revisar periódicamente las conexiones con tu mapa mental. ¿Te gustaría profundizar en algún detalle específico?"
        }
    }

    fun getSampleNotes(): List<Note> {
        return listOf(
            Note(
                id = "sample_1",
                title = "Superposición Cuántica y Qubits",
                content = "La superposición permite que una partícula cuántica exista en múltiples estados simultáneamente hasta el momento de ser medida.\n\nEnlace clave: [[Entrelazamiento Cuántico]]",
                tags = listOf("Física", "Computación"),
                updatedAt = "Hoy, 10:30 AM"
            ),
            Note(
                id = "sample_2",
                title = "Método Feynman de 4 Pasos",
                content = "1. Elegir el concepto.\n2. Explicarlo a un niño de 12 años sin tecnicismos.\n3. Identificar vacíos en la explicación.\n4. Simplificar y usar analogías directas.",
                tags = listOf("Estudio", "Pedagogía"),
                updatedAt = "Ayer"
            ),
            Note(
                id = "sample_3",
                title = "Entrelazamiento y Teleportación",
                content = "Dos partículas entrelazadas comparten un destino cuántico instantáneo, independientemente de la distancia que las separe en el espacio.",
                tags = listOf("Física"),
                updatedAt = "Hace 3 días"
            )
        )
    }

    fun getSampleCommunities(): List<Community> {
        return listOf(
            Community(
                id = "sample_comm_1",
                name = "Física Cuántica y Relatividad",
                description = "Grupo oficial de estudio avanzado de mecánica cuántica",
                code = "QN-PHYS",
                teacherName = "Dr. Roberto Quantum",
                materials = listOf(
                    ClassMaterial(
                        id = "mat_1",
                        title = "Presentación: Principio de Incertidumbre",
                        category = "presentacion",
                        content = "Diapositivas y fórmulas clave de Heisenberg aplicadas a partículas subatómicas.",
                        fileName = "Tema_4_Incertidumbre.pdf"
                    ),
                    ClassMaterial(
                        id = "mat_2",
                        title = "Guía de Ejercicios Prácticos",
                        category = "lectura",
                        content = "Problemas resueltos de función de onda y pozos de potencial.",
                        fileName = "Guia_Ejercicios.pdf"
                    )
                ),
                exams = listOf(
                    CommunityExam(
                        id = "exam_1",
                        title = "Quiz Rápido: Mecánica Cuántica",
                        description = "Evaluación formativa de 3 preguntas de opción múltiple.",
                        status = "activo",
                        durationMinutes = 15,
                        questions = listOf(
                            ExamQuestion(
                                question = "¿Qué postula el Principio de Incertidumbre de Heisenberg?",
                                options = listOf(
                                    "No se puede conocer con precisión arbitraria la posición y el momento de una partícula simultáneamente",
                                    "La velocidad de la luz es infinita en el vacío",
                                    "La energía se destruye a temperaturas cercanas al cero absoluto",
                                    "Los electrones no tienen masa observable"
                                ),
                                correctIndex = 0
                            ),
                            ExamQuestion(
                                question = "¿Qué propiedad distingue a un Qubit de un bit clásico?",
                                options = listOf(
                                    "Solo puede ser 0 o 1",
                                    "Puede encontrarse en superposición cuántica de |0> y |1>",
                                    "No requiere energía eléctrica",
                                    "Es exclusivamente magnético"
                                ),
                                correctIndex = 1
                            ),
                            ExamQuestion(
                                question = "¿Qué sucede con una función de onda al ser medida?",
                                options = listOf(
                                    "Se multiplica exponencialmente",
                                    "Colapsa a un único estado propio observable",
                                    "Desaparece para siempre",
                                    "Se transforma en calor"
                                ),
                                correctIndex = 1
                            )
                        )
                    )
                )
            )
        )
    }
}
