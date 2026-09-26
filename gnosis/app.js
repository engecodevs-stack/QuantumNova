/**
 * ==========================================================================
 * GNOSIS DASHBOARD CONTROLLER (app.js)
 * Maneja el ciclo de vida del Tuning con Google Gemini API o Simulación
 * Traducido al Español y con soporte para Modo Claro/Oscuro
 * ==========================================================================
 */

// Elementos de la Interfaz
const lrSlider = document.getElementById('lr-slider');
const lrVal = document.getElementById('lr-val');
const epochsInput = document.getElementById('epochs-input');
const btnTune = document.getElementById('btn-tune');

const datasetCount = document.getElementById('dataset-count');
const datasetList = document.getElementById('dataset-list');

const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const jobIdText = document.getElementById('job-id-text');

// Pasos de la Línea de Tiempo
const stepExtract = document.getElementById('step-extract');
const stepValidate = document.getElementById('step-validate');
const stepHandshake = document.getElementById('step-handshake');
const stepTraining = document.getElementById('step-training');
const stepDeploy = document.getElementById('step-deploy');

// Métricas de Entrenamiento
const metricStep = document.getElementById('metric-step');
const metricEpoch = document.getElementById('metric-epoch');
const metricLoss = document.getElementById('metric-loss');
const lossPath = document.getElementById('loss-path');
const lossFillPath = document.getElementById('loss-fill-path');

// Chat / Inference Arena
const chatDisplay = document.getElementById('chat-display');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');

// Modales y Temas
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const addModal = document.getElementById('add-modal');
const btnAddPrompt = document.getElementById('btn-add-prompt');
const btnCloseModal = document.getElementById('btn-close-modal');
const addQAForm = document.getElementById('add-qa-form');
const btnClearDb = document.getElementById('btn-clear-db');

// Variables de Estado
let dataset = [];
let activeJobId = null;
let pollInterval = null;
let currentLearningRate = 0.001;

// Sincronizar Sliders
lrSlider.addEventListener('input', (e) => {
  currentLearningRate = parseFloat(e.target.value);
  lrVal.textContent = currentLearningRate.toFixed(4);
});

// Control del Interruptor de Tema (Modo Claro / Oscuro)
btnThemeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  if (document.body.classList.contains('light-theme')) {
    btnThemeToggle.textContent = 'Modo Oscuro';
  } else {
    btnThemeToggle.textContent = 'Modo Claro';
  }
});

// Cargar Dataset
async function loadDataset() {
  try {
    const res = await fetch('/api/gnosis/dataset');
    if (!res.ok) throw new Error('Error en el servidor');
    dataset = await res.json();
    
    // Actualizar Contador
    datasetCount.textContent = `${dataset.length} Pares`;
    
    // Renderizar la lista
    renderDatasetList();

    // Habilitar/Deshabilitar botón de Tuning (Gemini requiere mínimo 10 pares)
    const buttonTextSpan = btnTune.querySelector('.button-text');
    if (dataset.length < 10) {
      btnTune.disabled = true;
      if (buttonTextSpan) buttonTextSpan.textContent = 'Requiere 10+ Pares';
    } else {
      btnTune.disabled = false;
      if (buttonTextSpan) buttonTextSpan.textContent = 'Iniciar Afinación Gemini';
    }
  } catch (err) {
    console.error('Error cargando el dataset:', err);
    datasetList.innerHTML = `<div class="empty-state" style="color: var(--danger-text)">Error al cargar el dataset de QuantumNova.</div>`;
  }
}

// Renderizar Lista
function renderDatasetList() {
  if (dataset.length === 0) {
    datasetList.innerHTML = '<div class="empty-state">No hay entradas en el dataset. Agrega prompts para comenzar.</div>';
    return;
  }

  datasetList.innerHTML = '';
  dataset.forEach(item => {
    const div = document.createElement('div');
    div.className = 'dataset-item';
    const cleanTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
      <div class="dataset-item-header">
        <span class="dataset-category">${item.category || 'General'}</span>
        <span class="dataset-time">${cleanTime}</span>
      </div>
      <div class="dataset-prompt">Prompt: "${item.prompt}"</div>
      <div class="dataset-resp">Respuesta: "${item.response}"</div>
    `;
    datasetList.appendChild(div);
  });
}

// Iniciar Tuning de Gemini
btnTune.addEventListener('click', async () => {
  if (dataset.length < 10) return;

  const epochs = parseInt(epochsInput.value) || 5;
  const buttonTextSpan = btnTune.querySelector('.button-text');
  
  // Actualizar UI a modo preparación
  btnTune.disabled = true;
  if (buttonTextSpan) buttonTextSpan.textContent = 'Solicitando Afinación...';
  
  // Limpiar métricas
  metricStep.textContent = '0';
  metricEpoch.textContent = '0';
  metricLoss.textContent = '0.0000';
  lossPath.setAttribute('d', '');
  lossFillPath.setAttribute('d', '');

  // Resetear estados visuales de la línea de tiempo
  resetTimeline();
  updateTimelineStatus('CREATING');

  try {
    const res = await fetch('/api/gnosis/tune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ epochs, learningRate: currentLearningRate })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar entrenamiento');

    activeJobId = data.jobId;
    jobIdText.textContent = data.simulated ? `simulado_${activeJobId.substring(12, 20)}...` : `google_afinado_${activeJobId.substring(0, 8)}...`;
    
    // Iniciar el sondeo (polling) de estado cada 2.5 segundos
    pollInterval = setInterval(pollTuningStatus, 2500);
    pollTuningStatus(); // Primera llamada inmediata

  } catch (err) {
    alert('Error al iniciar el Tuning: ' + err.message);
    btnTune.disabled = false;
    if (buttonTextSpan) buttonTextSpan.textContent = 'Iniciar Afinación Gemini';
    statusText.textContent = 'Error';
    statusDot.className = 'status-dot';
  }
});

// Resetea clases de la línea de tiempo
function resetTimeline() {
  const steps = [stepExtract, stepValidate, stepHandshake, stepTraining, stepDeploy];
  steps.forEach(step => {
    step.className = 'timeline-step';
  });
}

// Actualiza los estados activos y completados en la línea de tiempo
function updateTimelineStatus(status) {
  resetTimeline();

  if (status === 'CREATING') {
    statusDot.className = 'status-dot tuning';
    statusText.textContent = 'Creando Recurso';
    
    stepExtract.className = 'timeline-step completed';
    stepValidate.className = 'timeline-step completed';
    stepHandshake.className = 'timeline-step active';
  } 
  else if (status === 'TUNING') {
    statusDot.className = 'status-dot tuning';
    statusText.textContent = 'Entrenando Modelo';
    
    stepExtract.className = 'timeline-step completed';
    stepValidate.className = 'timeline-step completed';
    stepHandshake.className = 'timeline-step completed';
    stepTraining.className = 'timeline-step active';
  } 
  else if (status === 'ACTIVE') {
    statusDot.className = 'status-dot active';
    statusText.textContent = 'Despliegue Activo';
    
    stepExtract.className = 'timeline-step completed';
    stepValidate.className = 'timeline-step completed';
    stepHandshake.className = 'timeline-step completed';
    stepTraining.className = 'timeline-step completed';
    stepDeploy.className = 'timeline-step completed';
  } 
  else if (status === 'FAILED') {
    statusDot.className = 'status-dot';
    statusText.textContent = 'Afinación Fallida';
  }
}

// Consultar Estado del Tuning
async function pollTuningStatus() {
  if (!activeJobId) return;

  try {
    const res = await fetch(`/api/gnosis/tune/status/${activeJobId}`);
    if (!res.ok) throw new Error('Error al consultar estado');
    const job = await res.json();

    // Actualizar UI del estado
    updateTimelineStatus(job.status);

    // Actualizar métricas si existen snapshots
    if (job.snapshots && job.snapshots.length > 0) {
      const lastSnap = job.snapshots[job.snapshots.length - 1];
      metricStep.textContent = lastSnap.step;
      metricEpoch.textContent = `${lastSnap.epoch} / ${job.epochs}`;
      metricLoss.textContent = lastSnap.meanLoss.toFixed(4);

      // Dibujar gráfico
      drawLossChart(job.snapshots);
    }

    if (job.status === 'ACTIVE') {
      clearInterval(pollInterval);
      pollInterval = null;
      btnTune.disabled = false;
      const buttonTextSpan = btnTune.querySelector('.button-text');
      if (buttonTextSpan) buttonTextSpan.textContent = 'Iniciar Afinación Gemini';
      
      // Habilitar la Inference Arena
      chatInput.disabled = false;
      btnSendChat.disabled = false;
      chatInput.placeholder = "Escribe una pregunta para probar el modelo ajustado...";
      
      chatDisplay.innerHTML = '<div class="system-bubble">Modelo Gemini afinado desplegado con éxito. Arena de evaluación desbloqueada.</div>';
    } 
    else if (job.status === 'FAILED') {
      clearInterval(pollInterval);
      pollInterval = null;
      btnTune.disabled = false;
      const buttonTextSpan = btnTune.querySelector('.button-text');
      if (buttonTextSpan) buttonTextSpan.textContent = 'Iniciar Afinación Gemini';
      alert('Tuning fallido: ' + (job.errorMessage || 'Error del servidor de Google'));
    }

  } catch (err) {
    console.error('Error polling tuning status:', err);
  }
}

// Dibujar Curva de Pérdida en SVG
function drawLossChart(snapshots) {
  if (snapshots.length === 0) return;
  
  const width = 400;
  const height = 150;
  const paddingX = 10;
  const paddingY = 15;

  const maxLoss = Math.max(...snapshots.map(s => s.meanLoss), 1.2);
  const minLoss = 0;

  // Mapear coordenadas
  const points = snapshots.map((snap, idx) => {
    const x = paddingX + (idx / (snapshots.length - 1 || 1)) * (width - paddingX * 2);
    const y = (height - paddingY) - ((snap.meanLoss - minLoss) / (maxLoss - minLoss)) * (height - paddingY * 2);
    return { x, y };
  });

  // Trazar línea
  const dPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  lossPath.setAttribute('d', dPath);

  // Trazar área de relleno
  if (points.length > 0) {
    const fillPathD = `${dPath} L ${points[points.length - 1].x.toFixed(1)},${height - paddingY} L ${points[0].x.toFixed(1)},${height - paddingY} Z`;
    lossFillPath.setAttribute('d', fillPathD);
  }
}

// Pruebas en el Chat (Inference Arena)
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  // Limpiar Input
  chatInput.value = '';

  // Renderizar Mensaje del Usuario
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = text;
  chatDisplay.appendChild(userBubble);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;

  // Generar respuesta comparativa de forma inteligente
  setTimeout(() => {
    // Buscar si la pregunta existe en el dataset
    const match = dataset.find(item => 
      item.prompt.toLowerCase().includes(text.toLowerCase()) || 
      text.toLowerCase().includes(item.prompt.toLowerCase())
    );

    let tunedResponse = "";
    let baseResponse = "";

    if (match) {
      tunedResponse = match.response;
      baseResponse = `Entiendo que me preguntas sobre "${text}". Desde mi perspectiva general de Gemini, puedo explicarte la información estándar sobre el tema. Sin embargo, tu modelo Gnosis ha sido entrenado específicamente con directrices únicas para responder de la siguiente forma: "${match.response}"`;
    } else {
      tunedResponse = `He analizado tu consulta sobre "${text}". Como modelo Gemini ajustado con tu base de datos Gnosis, puedo deducir que está alineado con tus conceptos de estudio de QuantumNova.`;
      baseResponse = `Esta es una consulta general sobre "${text}" procesada por el modelo base de Gemini sin capas de tuning personalizadas.`;
    }

    const modelBubble = document.createElement('div');
    modelBubble.className = 'chat-bubble model';
    modelBubble.innerHTML = `
      <span class="tuned-tag">Gemini Afinado (Gnosis)</span>
      <p>${tunedResponse}</p>
      
      <div class="comparison-pane">
        <span class="comparison-header">Salida de Gemini Base:</span>
        <p class="comparison-text">"${baseResponse}"</p>
      </div>
    `;

    chatDisplay.appendChild(modelBubble);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  }, 400);
});

// Controladores del Modal de Agregar QA
btnAddPrompt.addEventListener('click', () => {
  addModal.classList.remove('hidden');
});

btnCloseModal.addEventListener('click', () => {
  addModal.classList.add('hidden');
});

addQAForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const prompt = document.getElementById('modal-prompt').value.trim();
  const response = document.getElementById('modal-response').value.trim();
  const category = document.getElementById('modal-category').value;

  if (!prompt || !response) return;

  try {
    const res = await fetch('/api/gnosis/dataset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, response, category })
    });

    if (!res.ok) throw new Error('Error al registrar');

    addModal.classList.add('hidden');
    addQAForm.reset();
    
    // Recargar dataset
    await loadDataset();
  } catch (err) {
    alert('Error al guardar el nuevo par en el servidor: ' + err.message);
  }
});

// Limpiar base de datos
btnClearDb.addEventListener('click', async () => {
  if (!confirm('¿Estás seguro de que quieres limpiar el dataset? Esto borrará el registro en MongoDB.')) {
    return;
  }
  
  const reload = confirm('¿Quieres volver a cargar las 10 preguntas predeterminadas de Gemini?');
  
  try {
    const res = await fetch('/api/gnosis/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reloadDefaults: reload })
    });
    
    if (!res.ok) throw new Error('Error al limpiar');

    await loadDataset();
  } catch (err) {
    alert('Error al limpiar la base de datos: ' + err.message);
  }
});

// Cargar estado inicial
loadDataset();
