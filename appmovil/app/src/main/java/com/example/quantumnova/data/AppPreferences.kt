package com.example.quantumnova.data

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class AppPreferences(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("quantumnova_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_DARK_MODE = "dark_mode"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_ATTENDANCE_HISTORY = "attendance_history"
        private const val DEFAULT_SERVER_URL = "http://10.0.2.2:5000"
    }

    var isLoggedIn: Boolean
        get() = prefs.getBoolean(KEY_IS_LOGGED_IN, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_LOGGED_IN, value).apply()

    var isDarkMode: Boolean
        get() = prefs.getBoolean(KEY_DARK_MODE, false)
        set(value) = prefs.edit().putBoolean(KEY_DARK_MODE, value).apply()

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
        set(value) {
            val clean = value.trimEnd('/')
            prefs.edit().putString(KEY_SERVER_URL, clean).apply()
        }

    fun saveUser(user: User) {
        prefs.edit()
            .putBoolean(KEY_IS_LOGGED_IN, true)
            .putString(KEY_USER_ID, user.id)
            .putString(KEY_USER_NAME, user.fullname)
            .putString(KEY_USER_EMAIL, user.email)
            .putString(KEY_USER_ROLE, user.role)
            .apply()
    }

    fun getUser(): User? {
        if (!isLoggedIn) return null
        val id = prefs.getString(KEY_USER_ID, "") ?: ""
        val name = prefs.getString(KEY_USER_NAME, "Estudiante Cuántico") ?: "Estudiante Cuántico"
        val email = prefs.getString(KEY_USER_EMAIL, "") ?: ""
        val role = prefs.getString(KEY_USER_ROLE, "alumno") ?: "alumno"
        return User(id = id, fullname = name, username = email.substringBefore("@"), email = email, role = role)
    }

    fun clearSession() {
        prefs.edit()
            .putBoolean(KEY_IS_LOGGED_IN, false)
            .remove(KEY_USER_ID)
            .remove(KEY_USER_NAME)
            .remove(KEY_USER_EMAIL)
            .remove(KEY_USER_ROLE)
            .apply()
    }

    fun saveAttendance(record: AttendanceRecord) {
        val list = getAttendanceRecords().toMutableList()
        list.removeAll { it.communityId == record.communityId }
        list.add(0, record)
        val array = JSONArray()
        for (item in list) {
            val obj = JSONObject()
            obj.put("communityId", item.communityId)
            obj.put("className", item.className)
            obj.put("teacherName", item.teacherName)
            obj.put("timestamp", item.timestamp)
            obj.put("status", item.status)
            array.put(obj)
        }
        prefs.edit().putString(KEY_ATTENDANCE_HISTORY, array.toString()).apply()
    }

    fun getAttendanceRecords(): List<AttendanceRecord> {
        val raw = prefs.getString(KEY_ATTENDANCE_HISTORY, "[]") ?: "[]"
        val list = mutableListOf<AttendanceRecord>()
        try {
            val array = JSONArray(raw)
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                list.add(
                    AttendanceRecord(
                        communityId = obj.optString("communityId", ""),
                        className = obj.optString("className", ""),
                        teacherName = obj.optString("teacherName", ""),
                        timestamp = obj.optString("timestamp", ""),
                        status = obj.optString("status", "PRESENTE")
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }
}
