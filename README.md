# 🌌 QuantumNova

> **Tu Segundo Cerebro Digital Impulsado por IA**  
> *Transformando la toma de notas pasiva en un ecosistema vivo, interconectado y potenciado por Inteligencia Artificial.*

---

## 📌 Visión General

**QuantumNova** es una plataforma educativa Full-Stack que integra metodologías científicas de aprendizaje acelerado (*Active Recall*, *Spaced Repetition*, *Método Feynman*) con grafos semánticos de conocimiento y un tutor socrático impulsado por IA.

El ecosistema integra tres aplicaciones en un solo servidor unificado:
1. **Lobby & Landing Interactiva** (`/Loby`): Presentación inmersiva, generador dinámico de nodos y portal de acceso.
2. **Aplicación Central de Estudio** (`/client`): Editor de notas Markdown con enlaces bidireccionales (`[[nota]]`), mapa mental interactivo con física de partículas, tutor RAG "Quantum", generador de quizzes, copiloto contextual y control por voz (Web Speech API).
3. **Panel Gnosis** (`/gnosis`): Entorno para fine-tuning y experimentación de modelos de lenguaje (Gemini / OpenAI).
4. **App Móvil** (`/appmovil`): Proyecto Android Studio (Kotlin / Jetpack Compose).

---

## 🚀 Arquitectura del Proyecto

```text
QuantumNova/
├── client/          # Frontend React + TypeScript + Vite + Tailwind CSS + Framer Motion
├── server/          # Backend Node.js + Express + TypeScript + SQLite/MySQL + Gemini/OpenAI API
├── Loby/            # Landing page interactiva y demostrador de grafos
├── gnosis/          # Panel de afinación y monitoreo de modelos de IA
├── appmovil/        # Aplicación móvil Android en Kotlin
├── package.json     # Scripts globales para orquestar cliente y servidor
└── README.md
```

---

## 🛠️ Tecnologías Utilizadas

- **Frontend Web**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, SQLite / MySQL.
- **Inteligencia Artificial**: Google Gemini API, OpenAI API (con fallback de simulación determinista sin conexión).
- **Móvil**: Kotlin, Android SDK, Jetpack Compose.
- **Voz y Accesibilidad**: Web Speech API (reconocimiento y síntesis de voz en español).

---

## ⚙️ Instalación y Puesta en Marcha

### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [npm](https://www.npmjs.com/)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/engecodevs-stack/QuantumNova.git
cd QuantumNova
```

### 2. Instalar Dependencias
Instala todas las dependencias del proyecto raíz, servidor y cliente con un solo comando:
```bash
npm run install:all
```

### 3. Configurar Variables de Entorno
Copia el archivo de ejemplo en el servidor y configura tus claves:
```bash
cp server/.env.example server/.env
```
Edita `server/.env` y define tu `GEMINI_API_KEY` o credenciales de base de datos.

### 4. Ejecutar en Modo Desarrollo
Para levantar simultáneamente el servidor y el cliente web:
```bash
npm run dev
```

- **Cliente Web**: [http://localhost:5173](http://localhost:5173)
- **Servidor API**: [http://localhost:5000](http://localhost:5000)
- **Lobby**: [http://localhost:5000/loby](http://localhost:5000/loby)
- **Gnosis**: [http://localhost:5000/gnosis](http://localhost:5000/gnosis)

---

## 📋 Características Principales

- **Editor Estructurado**: Markdown completo con autocompletado y enlaces semánticos bidireccionales.
- **Mapa Mental / Grafo 2D/3D**: Representación gráfica de conceptos con física de resortes y navegación en tiempo real.
- **Tutor Socrático "Quantum"**: Preguntas socráticas ancladas a las notas del estudiante (RAG).
- **Exámenes & Quizzes Dinámicos**: Evaluación automática de comprensión y detección de vacíos de conocimiento.
- **Asistente por Voz**: Comandos completos en español para dictar, consultar y navegar con manos libres.
- **Panel Gnosis**: Supervisión de datasets y curvas de entrenamiento de IA.

---

## 📄 Licencia

Este proyecto se encuentra bajo los términos acordados para el desarrollo de QuantumNova.
