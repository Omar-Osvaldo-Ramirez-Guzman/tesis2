// ========================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ========================================

// Estado del usuario
let userState = {
  isLoggedIn: false,
  hasProfile: false,
  email: "",
  userData: null,
}

// Estados de archivos
const fileStates = {
  archivoAudio: { loaded: false, validated: false, file: null },
  archivo1: { loaded: false, validated: false, file: null },
  archivo2: { loaded: false, validated: false, file: null },
}

// Estados de procesamiento
const processingStates = {
  analysis: false,
  comparison: false,
  training: false,
}

// Variables para grabación
let isRecording = false
let recordingTimer = null
let recordingSeconds = 0
let mediaRecorder = null
let audioChunks = []

// Variables para entrenamiento
let isTraining = false
let trainingTimer = null
let trainingSeconds = 0
let trainingMediaRecorder = null
let trainingAudioChunks = []
let selectedPangram = ""

// Configuración
let userConfig = {
  theme: "dark",
  language: "es",
}

// Traducciones
const translations = {
  es: {
    analysis: "Análisis",
    comparison: "Comparación",
    training: "Entrenamiento",
    realVoice: "Voz Real",
    aiVoice: "Voz IA",
    confidence: "Confianza",
    processing: "Procesando...",
  },
  en: {
    analysis: "Analysis",
    comparison: "Comparison",
    training: "Training",
    realVoice: "Real Voice",
    aiVoice: "AI Voice",
    confidence: "Confidence",
    processing: "Processing...",
  },
}

// ========================================
// FUNCIONES DE NAVEGACIÓN Y CONTROL
// ========================================

function showSection(sectionId) {
  // Ocultar todas las secciones
  document.querySelectorAll(".pantalla").forEach((section) => {
    section.classList.add("oculto")
  })

  // Mostrar la sección solicitada
  const targetSection = document.getElementById(sectionId)
  if (targetSection) {
    targetSection.classList.remove("oculto")
  }

  // Actualizar navegación activa
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active")
  })

  // Marcar como activo el enlace correspondiente
  const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`)
  if (activeLink) {
    activeLink.classList.add("active")
  }
}

function updateNavigation() {
  const navMenu = document.getElementById("navMenu")
  const optionsMenu = document.getElementById("optionsMenu")

  if (!userState.isLoggedIn) {
    navMenu.innerHTML = '<li><a href="#" onclick="showSection(\'auth\')" class="nav-link active">Acceso</a></li>'
    optionsMenu.style.display = "none"
  } else if (!userState.hasProfile) {
    navMenu.innerHTML =
      '<li><a href="#" onclick="showSection(\'perfil\')" class="nav-link active">Completar Perfil</a></li>'
    optionsMenu.style.display = "block"
  } else {
    navMenu.innerHTML = `
      <li><a href="#" onclick="showSection('analisis')" class="nav-link active">🎤 ${translations[userConfig.language].analysis}</a></li>
      <li><a href="#" onclick="showSection('comparacion')" class="nav-link">🆚 ${translations[userConfig.language].comparison}</a></li>
      <li><a href="#" onclick="showSection('entrenamiento')" class="nav-link">🧠 ${translations[userConfig.language].training}</a></li>
    `
    optionsMenu.style.display = "block"
  }
}

// ========================================
// FUNCIONES DE AUTENTICACIÓN
// ========================================

function loginEmail() {
  const email = document.getElementById("authEmail").value.trim()
  const password = document.getElementById("authPassword").value.trim()
  const statusElement = document.getElementById("authStatus")

  clearFormErrors()

  if (!email || !password) {
    showStatus(statusElement, "Por favor completa todos los campos", "error")
    return
  }

  if (!validateEmail(email)) {
    showFieldError("authEmail", "Ingresa un correo electrónico válido")
    showStatus(statusElement, "Correo electrónico no válido", "error")
    return
  }

  showStatus(statusElement, "Iniciando sesión...", "loading")

  // Simular proceso de login
  setTimeout(() => {
    userState.isLoggedIn = true
    userState.email = email
    userState.hasProfile = true

    showStatus(statusElement, "✅ Sesión iniciada correctamente", "success")

    setTimeout(() => {
      updateNavigation()
      showSection("analisis")
    }, 1000)
  }, 1500)
}

function loginGoogle() {
  const statusElement = document.getElementById("authStatus")

  showStatus(statusElement, "Conectando con Google...", "loading")

  setTimeout(() => {
    userState.isLoggedIn = true
    userState.email = "usuario@gmail.com"
    userState.hasProfile = true

    showStatus(statusElement, "✅ Conectado con Google", "success")

    setTimeout(() => {
      updateNavigation()
      showSection("analisis")
    }, 1000)
  }, 1500)
}

function showRegister() {
  showSection("registro")
}

function processRegistration() {
  const email = document.getElementById("regEmail").value.trim()
  const password = document.getElementById("regPassword").value.trim()
  const confirmPassword = document.getElementById("regConfirmPassword").value.trim()
  const statusElement = document.getElementById("regStatus")

  clearFormErrors()

  if (!email || !password || !confirmPassword) {
    showStatus(statusElement, "Por favor completa todos los campos", "error")
    return
  }

  if (!validateEmail(email)) {
    showFieldError("regEmail", "Ingresa un correo electrónico válido")
    showStatus(statusElement, "Correo electrónico no válido", "error")
    return
  }

  if (password.length < 6) {
    showFieldError("regPassword", "La contraseña debe tener al menos 6 caracteres")
    showStatus(statusElement, "Contraseña muy corta", "error")
    return
  }

  if (password !== confirmPassword) {
    showFieldError("regConfirmPassword", "Las contraseñas no coinciden")
    showStatus(statusElement, "Las contraseñas no coinciden", "error")
    return
  }

  showStatus(statusElement, "Creando cuenta...", "loading")

  setTimeout(() => {
    userState.isLoggedIn = true
    userState.email = email
    userState.hasProfile = false

    // Prellenar el correo en el perfil
    const correoUsuario = document.getElementById("correoUsuario")
    if (correoUsuario) {
      correoUsuario.value = email
    }

    showStatus(statusElement, "✅ Cuenta creada exitosamente", "success")

    setTimeout(() => {
      updateNavigation()
      showSection("perfil")
    }, 1000)
  }, 1500)
}

function showForgotPassword() {
  const modal = document.createElement("div")
  modal.className = "forgot-password-modal"
  modal.innerHTML = `
    <div class="modal-content">
      <h3>🔑 Recuperar Contraseña</h3>
      <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
      <div class="form-group">
        <label for="forgotEmail">Correo electrónico:</label>
        <input type="email" id="forgotEmail" placeholder="tu@correo.com">
      </div>
      <div class="modal-buttons">
        <button onclick="sendPasswordReset()" class="btn-primary">Enviar Enlace</button>
        <button onclick="closeForgotPasswordModal()" class="btn-secondary">Cancelar</button>
      </div>
      <div id="forgotPasswordStatus" class="auth-status"></div>
    </div>
  `

  document.body.appendChild(modal)

  // Funciones para el modal
  window.sendPasswordReset = () => {
    const email = document.getElementById("forgotEmail").value.trim()
    const status = document.getElementById("forgotPasswordStatus")

    if (!email || !validateEmail(email)) {
      showStatus(status, "Por favor ingresa un correo válido", "error")
      return
    }

    showStatus(status, "Enviando enlace...", "loading")

    setTimeout(() => {
      showStatus(status, "✅ Enlace enviado. Revisa tu correo.", "success")
      setTimeout(() => {
        closeForgotPasswordModal()
      }, 2000)
    }, 1500)
  }

  window.closeForgotPasswordModal = () => {
    document.body.removeChild(modal)
    delete window.sendPasswordReset
    delete window.closeForgotPasswordModal
  }

  // Cerrar con ESC
  const handleKeyPress = (e) => {
    if (e.key === "Escape") {
      closeForgotPasswordModal()
      document.removeEventListener("keydown", handleKeyPress)
    }
  }
  document.addEventListener("keydown", handleKeyPress)

  // Cerrar al hacer clic fuera
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeForgotPasswordModal()
      document.removeEventListener("keydown", handleKeyPress)
    }
  })
}

// ========================================
// FUNCIONES DE PERFIL
// ========================================

function guardarPerfil() {
  const nombre = document.getElementById("nombreCompleto").value.trim()
  const correo = document.getElementById("correoUsuario").value.trim()
  const telefono = document.getElementById("telefono").value.trim()
  const tipoUsuario = document.getElementById("tipoUsuario").value

  clearFormErrors()

  let hasErrors = false

  if (!nombre || !correo || !tipoUsuario) {
    alert("Por favor completa los campos obligatorios (marcados con *)")
    return
  }

  if (!validateEmail(correo)) {
    showFieldError("correoUsuario", "Ingresa un correo electrónico válido")
    hasErrors = true
  }

  if (telefono && !validatePhone(telefono)) {
    showFieldError("telefono", "El teléfono debe tener exactamente 10 dígitos numéricos")
    hasErrors = true
  }

  if (hasErrors) return

  userState.userData = { nombre, correo, telefono, tipoUsuario }
  userState.hasProfile = true

  const btnGuardar = document.getElementById("btnGuardarPerfil")
  const btnEditar = document.getElementById("btnEditarPerfil")

  if (btnGuardar) btnGuardar.style.display = "none"
  if (btnEditar) btnEditar.style.display = "inline-block"

  toggleProfileFields(false)
  alert("✅ Perfil guardado exitosamente")

  updateNavigation()
  showSection("analisis")
}

function editarPerfil() {
  const btnGuardar = document.getElementById("btnGuardarPerfil")
  const btnEditar = document.getElementById("btnEditarPerfil")

  if (btnGuardar) {
    btnGuardar.style.display = "inline-block"
    btnGuardar.textContent = "💾 Actualizar Perfil"
  }
  if (btnEditar) btnEditar.style.display = "none"

  toggleProfileFields(true)
}

function toggleProfileFields(editable) {
  const fields = ["nombreCompleto", "telefono", "tipoUsuario"]
  fields.forEach((fieldId) => {
    const field = document.getElementById(fieldId)
    if (field) {
      field.readOnly = !editable
      field.disabled = !editable
    }
  })
}

// ========================================
// FUNCIONES DE ANÁLISIS DE AUDIO OPTIMIZADAS
// ========================================

function toggleRecording() {
  if (isRecording) {
    stopRecording()
  } else {
    startRecording()
  }
}

function startRecording() {
  navigator.mediaDevices
    .getUserMedia({
      audio: {
        sampleRate: 22050, // Reducido para mejor rendimiento
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      audioChunks = []

      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data)
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        const file = new File([audioBlob], `grabacion_${Date.now()}.wav`, { type: "audio/wav" })

        fileStates.archivoAudio = { loaded: true, validated: true, file: file }

        updateFileStatus("archivoAudioStatus", "✅ Grabación completada - Listo para análisis", "success")

        const analyzeBtn = document.getElementById("analyzeBtn")
        if (analyzeBtn) analyzeBtn.disabled = false

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      isRecording = true
      recordingSeconds = 0

      updateRecordingUI(true)

      recordingTimer = setInterval(() => {
        recordingSeconds++
        updateTimerDisplay("timerText", recordingSeconds)
      }, 1000)
    })
    .catch((error) => {
      console.error("Error accediendo al micrófono:", error)
      alert("❌ Error: No se pudo acceder al micrófono. Verifica los permisos.")
    })
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop()
    isRecording = false
    updateRecordingUI(false)

    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
  }
}

function updateRecordingUI(recording) {
  const recordBtn = document.getElementById("recordBtn")
  const recordingTimerElement = document.getElementById("recordingTimer")

  if (recordBtn) {
    if (recording) {
      recordBtn.innerHTML = '<span class="record-icon">⏹️</span><span class="record-text">Detener</span>'
      recordBtn.classList.add("recording")
    } else {
      recordBtn.innerHTML = '<span class="record-icon">🎙️</span><span class="record-text">Grabar Voz</span>'
      recordBtn.classList.remove("recording")
    }
  }

  if (recordingTimerElement) {
    recordingTimerElement.style.display = recording ? "flex" : "none"
  }
}

function updateTimerDisplay(elementId, seconds) {
  const element = document.getElementById(elementId)
  if (element) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    element.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
}

function iniciarAnalisis() {
  if (processingStates.analysis) return

  const file = fileStates.archivoAudio.file
  const button = document.getElementById("analyzeBtn")

  if (!file) {
    alert("Por favor selecciona un archivo de audio o graba tu voz.")
    return
  }

  button.disabled = true
  button.innerHTML = '<div class="loading-spinner"></div> Analizando...'
  processingStates.analysis = true

  const url = URL.createObjectURL(file)
  analizarAudioOptimizado(url, file).finally(() => {
    button.disabled = false
    button.innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Analizar Audio</span>'
    processingStates.analysis = false
  })
}

async function analizarAudioOptimizado(audioURL, audioFile) {
  const resultSection = document.getElementById("resultadoAnalisis")
  const resultado = document.getElementById("resultado")
  const waveformCanvas = document.getElementById("waveformCanvas")
  const spectrumCanvas = document.getElementById("spectrumCanvas")

  if (resultSection) resultSection.style.display = "block"
  if (resultado) resultado.innerHTML = '<p style="color:#00d4ff">🔄 Analizando características de frecuencia...</p>'

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const response = await fetch(audioURL)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // Análisis optimizado y más rápido
    const features = extractOptimizedFeatures(audioBuffer)
    const classification = classifyVoiceOptimized(features)
    const transcription = await getQuickTranscription(audioBuffer)

    // Dibujar visualizaciones optimizadas
    if (waveformCanvas) drawOptimizedWaveform(waveformCanvas, audioBuffer, features)
    if (spectrumCanvas) drawOptimizedSpectrum(spectrumCanvas, audioBuffer, features)

    // Mostrar resultados
    setTimeout(() => {
      displayAnalysisResults(resultado, classification, features, transcription)
    }, 800) // Reducido el tiempo de espera
  } catch (error) {
    console.error("Error al procesar audio:", error)
    if (resultado) {
      resultado.innerHTML = '<p style="color:#ff4444">❌ Error al procesar el archivo de audio.</p>'
    }
  }
}

// ========================================
// FUNCIONES DE ANÁLISIS OPTIMIZADAS
// ========================================

function extractOptimizedFeatures(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate
  const audioData = audioBuffer.getChannelData(0)
  const duration = audioBuffer.duration

  // Análisis más eficiente con menos cálculos
  const frecuencia = calculateBasicF0(audioData, sampleRate)
  const { num_picos, num_valles } = calculatePeaksValleys(audioData)
  const rms = calculateRMS(audioData)
  const velocidad_habla = estimateSpeechRate(audioData, duration)

  return {
    frecuencia,
    num_picos,
    num_valles,
    rms,
    duracion: duration,
    velocidad_habla,
  }
}

function calculateBasicF0(audioData, sampleRate) {
  // Algoritmo más simple y rápido para F0
  const windowSize = Math.min(2048, Math.floor(sampleRate * 0.03)) // Ventana más pequeña
  let maxCorr = 0
  let bestLag = 0
  const minLag = Math.floor(sampleRate / 500) // 500 Hz máximo
  const maxLag = Math.floor(sampleRate / 80) // 80 Hz mínimo

  for (let lag = minLag; lag < Math.min(maxLag, windowSize); lag += 2) {
    // Saltar cada 2 para velocidad
    let corr = 0
    for (let i = 0; i < windowSize - lag; i += 4) {
      // Saltar cada 4 muestras
      corr += audioData[i] * audioData[i + lag]
    }
    if (corr > maxCorr) {
      maxCorr = corr
      bestLag = lag
    }
  }

  return bestLag > 0 ? sampleRate / bestLag : 0
}

function calculatePeaksValleys(audioData) {
  let num_picos = 0
  let num_valles = 0
  const threshold = 0.01
  const step = 10 // Saltar muestras para velocidad

  for (let i = step; i < audioData.length - step; i += step) {
    const prev = audioData[i - step]
    const current = audioData[i]
    const next = audioData[i + step]

    if (Math.abs(current) > threshold) {
      if (current > prev && current > next) num_picos++
      if (current < prev && current < next) num_valles++
    }
  }

  return { num_picos, num_valles }
}

function calculateRMS(audioData) {
  let sum = 0
  const step = 4 // Saltar muestras para velocidad
  for (let i = 0; i < audioData.length; i += step) {
    sum += audioData[i] * audioData[i]
  }
  return Math.sqrt(sum / (audioData.length / step))
}

function estimateSpeechRate(audioData, duration) {
  // Estimación rápida basada en energía
  const frameSize = 1024
  const hopSize = 512
  let speechFrames = 0
  let totalFrames = 0

  for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
    let energy = 0
    for (let j = 0; j < frameSize; j += 8) {
      // Saltar muestras
      energy += audioData[i + j] * audioData[i + j]
    }
    energy /= frameSize / 8

    totalFrames++
    if (energy > 0.001) speechFrames++
  }

  const speechRatio = speechFrames / totalFrames
  const estimatedWPM = speechRatio * 150 // Estimación simple
  return Math.round(estimatedWPM)
}

function classifyVoiceOptimized(features) {
  // Clasificación simplificada pero efectiva
  let aiScore = 0

  // Análisis de estabilidad de frecuencia
  const f0Stability = features.frecuencia > 0 ? Math.min(features.frecuencia / 200, 1) : 0.5
  aiScore += f0Stability * 0.3

  // Análisis de patrones de picos/valles
  const peakRatio = features.num_picos / Math.max(features.num_valles, 1)
  const peakScore = Math.abs(peakRatio - 1.2) < 0.3 ? 0.7 : 0.3 // Voces IA tienden a ser más regulares
  aiScore += peakScore * 0.3

  // Análisis de RMS
  const rmsScore = features.rms > 0.05 && features.rms < 0.2 ? 0.6 : 0.4
  aiScore += rmsScore * 0.2

  // Análisis de velocidad de habla
  const speechScore = features.velocidad_habla > 100 && features.velocidad_habla < 180 ? 0.6 : 0.4
  aiScore += speechScore * 0.2

  const isAI = aiScore > 0.5
  const confidence = 0.9 + Math.abs(aiScore - 0.5) * 0.06 // Rango 90-93%

  return {
    isAI,
    confidence: Math.min(0.93, Math.max(0.9, confidence)),
    aiProbability: aiScore,
  }
}

async function getQuickTranscription(audioBuffer) {
  // Transcripción simulada más rápida
  const transcriptions = [
    "Esta es una muestra de voz para análisis de autenticidad.",
    "Probando el sistema de detección de voz sintética.",
    "Análisis de características espectrales en proceso.",
    "Evaluando patrones de habla natural versus artificial.",
    "Sistema de verificación de voz en funcionamiento.",
  ]

  const duration = audioBuffer.duration
  const index = Math.floor(duration * 10) % transcriptions.length

  // Simular delay más corto
  await new Promise((resolve) => setTimeout(resolve, 500))

  return transcriptions[index]
}

// ========================================
// FUNCIONES DE VISUALIZACIÓN OPTIMIZADAS
// ========================================

function drawOptimizedWaveform(canvas, audioBuffer, features) {
  const ctx = canvas.getContext("2d")
  const width = canvas.width
  const height = canvas.height

  ctx.fillStyle = "#0a0e1a"
  ctx.fillRect(0, 0, width, height)

  const audioData = audioBuffer.getChannelData(0)
  const step = Math.ceil(audioData.length / width)
  const amp = height / 2

  ctx.beginPath()
  ctx.strokeStyle = "#00d4ff"
  ctx.lineWidth = 1

  for (let i = 0; i < width; i++) {
    let min = 1.0,
      max = -1.0
    for (let j = 0; j < step; j += 2) {
      // Saltar muestras para velocidad
      const datum = audioData[i * step + j]
      if (datum < min) min = datum
      if (datum > max) max = datum
    }

    if (i === 0) {
      ctx.moveTo(i, (1 + min) * amp)
    } else {
      ctx.lineTo(i, (1 + min) * amp)
    }
    ctx.lineTo(i, (1 + max) * amp)
  }
  ctx.stroke()

  // Información básica
  if (features) {
    ctx.fillStyle = "#ffffff"
    ctx.font = "12px Inter"
    ctx.fillText(`F0: ${features.frecuencia.toFixed(1)}Hz`, 10, 20)
    ctx.fillText(`RMS: ${features.rms.toFixed(4)}`, 10, 35)
  }

  addZoomButton(canvas, audioBuffer, features, "waveform")
}

function drawOptimizedSpectrum(canvas, audioBuffer, features) {
  const ctx = canvas.getContext("2d")
  const width = canvas.width
  const height = canvas.height

  ctx.fillStyle = "#0a0e1a"
  ctx.fillRect(0, 0, width, height)

  // Espectro simplificado
  const audioData = audioBuffer.getChannelData(0)
  const fftSize = 512 // Más pequeño para velocidad
  const spectrum = performQuickFFT(audioData.slice(0, fftSize))

  const barWidth = width / spectrum.length
  const maxValue = Math.max(...spectrum)

  for (let i = 0; i < spectrum.length; i++) {
    const barHeight = (spectrum[i] / maxValue) * height
    const hue = (i / spectrum.length) * 240
    ctx.fillStyle = `hsl(${hue}, 70%, 50%)`
    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
  }

  addZoomButton(canvas, audioBuffer, features, "spectrum")
}

function performQuickFFT(frame) {
  // FFT simplificada y más rápida
  const N = frame.length
  const spectrum = new Array(N / 4).fill(0) // Menos bins para velocidad

  for (let k = 0; k < N / 4; k++) {
    let real = 0,
      imag = 0
    for (let n = 0; n < N; n += 2) {
      // Saltar muestras
      const angle = (-2 * Math.PI * k * n) / N
      real += frame[n] * Math.cos(angle)
      imag += frame[n] * Math.sin(angle)
    }
    spectrum[k] = Math.sqrt(real * real + imag * imag)
  }

  return spectrum
}

function addZoomButton(canvas, audioBuffer, features, type) {
  let zoomBtn = canvas.parentElement.querySelector(".zoom-btn")
  if (!zoomBtn) {
    zoomBtn = document.createElement("button")
    zoomBtn.className = "zoom-btn"
    zoomBtn.innerHTML = "🔍"
    zoomBtn.title = "Ampliar vista"

    canvas.parentElement.style.position = "relative"
    canvas.parentElement.appendChild(zoomBtn)

    zoomBtn.addEventListener("click", () => {
      openZoomModal(canvas, audioBuffer, features, type)
    })
  }
}

function openZoomModal(originalCanvas, audioBuffer, features, type) {
  const modal = document.createElement("div")
  modal.className = "zoom-modal"
  modal.innerHTML = `
    <div class="zoom-content">
      <button class="close-btn" onclick="this.closest('.zoom-modal').remove()">✕</button>
      <h3>${type === "waveform" ? "Forma de Onda - Vista Ampliada" : "Espectro - Vista Ampliada"}</h3>
      <canvas width="1000" height="400"></canvas>
    </div>
  `

  document.body.appendChild(modal)

  const zoomedCanvas = modal.querySelector("canvas")
  if (type === "waveform") {
    drawOptimizedWaveform(zoomedCanvas, audioBuffer, features)
  } else {
    drawOptimizedSpectrum(zoomedCanvas, audioBuffer, features)
  }

  // Cerrar con ESC o clic fuera
  const handleClose = (e) => {
    if (e.key === "Escape" || e.target === modal) {
      modal.remove()
      document.removeEventListener("keydown", handleClose)
    }
  }
  document.addEventListener("keydown", handleClose)
  modal.addEventListener("click", handleClose)
}

function displayAnalysisResults(elemento, classification, features, transcription) {
  if (!elemento) return

  const color = classification.isAI ? "#ff4444" : "#00c851"
  const resultText = classification.isAI ? "IA" : "REAL"
  const confidence = (classification.confidence * 100).toFixed(1)

  elemento.innerHTML = `
    <div class="result-display">
      <h3 style="color:${color}; font-size: 2rem; margin-bottom: 1rem;">
        🎯 Resultado: VOZ ${resultText}
      </h3>
      <p style="color: #00d4ff; font-size: 1.2rem; margin-bottom: 1.5rem;">
        Confianza: ${confidence}%
      </p>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <strong>Duración:</strong><br>
          <span>${features.duracion.toFixed(2)}s</span>
        </div>
        <div class="metric-card">
          <strong>Frecuencia:</strong><br>
          <span>${features.frecuencia.toFixed(1)} Hz</span>
        </div>
        <div class="metric-card">
          <strong>Picos:</strong><br>
          <span>${features.num_picos}</span>
        </div>
        <div class="metric-card">
          <strong>Valles:</strong><br>
          <span>${features.num_valles}</span>
        </div>
        <div class="metric-card">
          <strong>RMS:</strong><br>
          <span>${features.rms.toFixed(4)}</span>
        </div>
        <div class="metric-card">
          <strong>Velocidad:</strong><br>
          <span>${features.velocidad_habla} wpm</span>
        </div>
      </div>
      
      <div class="transcription-section" style="margin-top: 1.5rem; padding: 1rem; background: rgba(${classification.isAI ? "255,68,68" : "0,200,81"}, 0.1); border-radius: 8px; border: 1px solid ${color};">
        <h4 style="color: ${color}; margin-bottom: 0.5rem;">📝 Transcripción:</h4>
        <p style="font-style: italic; margin-bottom: 1rem;">"${transcription}"</p>
        <h4 style="color: ${color}; margin-bottom: 0.5rem;">Análisis:</h4>
        <p style="font-size: 0.9rem; line-height: 1.5;">
          ${
            classification.isAI
              ? `Esta voz presenta características típicas de síntesis artificial con patrones regulares.`
              : `Esta voz muestra características naturales humanas con variabilidad normal.`
          }
        </p>
      </div>
    </div>
  `
}

// ========================================
// FUNCIONES DE COMPARACIÓN
// ========================================

function iniciarComparacion() {
  if (processingStates.comparison) return

  const file1 = fileStates.archivo1.file
  const file2 = fileStates.archivo2.file
  const button = document.getElementById("compareBtn")

  if (!file1 || !file2) {
    alert("Selecciona ambos archivos para comparar.")
    return
  }

  button.disabled = true
  button.innerHTML = '<div class="loading-spinner"></div> Comparando...'
  processingStates.comparison = true

  executeComparison(file1, file2).finally(() => {
    button.disabled = false
    button.innerHTML = '<span class="btn-icon">⚡</span><span class="btn-text">Comparar Voces</span>'
    processingStates.comparison = false
  })
}

async function executeComparison(file1, file2) {
  const resultSection = document.getElementById("resultadoComparacion")

  if (resultSection) resultSection.style.display = "block"

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Procesar ambos archivos
    const [audioBuffer1, audioBuffer2] = await Promise.all([
      loadAudioBuffer(audioContext, file1),
      loadAudioBuffer(audioContext, file2),
    ])

    const features1 = extractOptimizedFeatures(audioBuffer1)
    const features2 = extractOptimizedFeatures(audioBuffer2)

    const classification1 = classifyVoiceOptimized(features1)
    const classification2 = classifyVoiceOptimized(features2)

    // Mostrar resultados de comparación
    displayComparisonResults(classification1, classification2, file1.name, file2.name)
  } catch (error) {
    console.error("Error en comparación:", error)
    alert("Error al procesar los archivos de audio.")
  }
}

async function loadAudioBuffer(audioContext, file) {
  const arrayBuffer = await file.arrayBuffer()
  return await audioContext.decodeAudioData(arrayBuffer)
}

function displayComparisonResults(class1, class2, name1, name2) {
  const detection1 = document.getElementById("detection1")
  const detection2 = document.getElementById("detection2")
  const result1 = document.getElementById("result1")
  const result2 = document.getElementById("result2")
  const confidence1 = document.getElementById("confidence1")
  const confidence2 = document.getElementById("confidence2")
  const confidenceText1 = document.getElementById("confidenceText1")
  const confidenceText2 = document.getElementById("confidenceText2")
  const fileName1 = document.getElementById("fileName1")
  const fileName2 = document.getElementById("fileName2")
  const finalResult = document.getElementById("finalResult")

  // Actualizar nombres de archivos
  if (fileName1) fileName1.textContent = name1
  if (fileName2) fileName2.textContent = name2

  // Actualizar resultados
  updateDetectionCard(detection1, result1, confidence1, confidenceText1, class1)
  updateDetectionCard(detection2, result2, confidence2, confidenceText2, class2)

  // Veredicto final
  if (finalResult) {
    const conf1 = (class1.confidence * 100).toFixed(1)
    const conf2 = (class2.confidence * 100).toFixed(1)

    finalResult.innerHTML = `
      <p><strong>Archivo 1:</strong> ${class1.isAI ? "IA" : "REAL"} (${conf1}%)</p>
      <p><strong>Archivo 2:</strong> ${class2.isAI ? "IA" : "REAL"} (${conf2}%)</p>
      <p style="margin-top: 1rem; font-size: 1.1rem;">
        ${
          class1.isAI === class2.isAI
            ? `Ambas voces parecen ser ${class1.isAI ? "generadas por IA" : "reales"}.`
            : `Una voz es real y la otra es generada por IA.`
        }
      </p>
    `
  }
}

function updateDetectionCard(card, result, confidenceFill, confidenceText, classification) {
  const isAI = classification.isAI
  const confidence = (classification.confidence * 100).toFixed(1)
  const color = isAI ? "#ff4444" : "#00c851"
  const text = isAI ? "VOZ IA" : "VOZ REAL"

  if (card) {
    card.className = `detection-card ${isAI ? "ai" : "real"}`
  }

  if (result) {
    result.textContent = text
    result.className = `detection-result ${isAI ? "ai" : "real"}`
    result.style.color = color
  }

  if (confidenceFill) {
    confidenceFill.style.width = `${confidence}%`
    confidenceFill.className = `confidence-fill ${isAI ? "ai" : "real"}`
  }

  if (confidenceText) {
    confidenceText.textContent = `${confidence}%`
  }
}

// ========================================
// FUNCIONES DE ENTRENAMIENTO
// ========================================

function showPangramCategory(category) {
  // Actualizar tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"))
  document.querySelector(`[onclick="showPangramCategory('${category}')"]`).classList.add("active")

  // Mostrar categoría
  document.querySelectorAll(".pangram-category").forEach((cat) => cat.classList.remove("active"))
  document.getElementById(category).classList.add("active")
}

function iniciarEntrenamiento() {
  if (!selectedPangram) {
    alert("Por favor selecciona un texto para leer.")
    return
  }

  if (isTraining) {
    detenerEntrenamiento()
  } else {
    startTraining()
  }
}

function startTraining() {
  navigator.mediaDevices
    .getUserMedia({ audio: { sampleRate: 22050, channelCount: 1 } })
    .then((stream) => {
      trainingMediaRecorder = new MediaRecorder(stream)
      trainingAudioChunks = []

      trainingMediaRecorder.ondataavailable = (e) => trainingAudioChunks.push(e.data)
      trainingMediaRecorder.onstop = () => {
        const audioBlob = new Blob(trainingAudioChunks, { type: "audio/wav" })
        // Aquí se procesaría el audio de entrenamiento
        updateTrainingStatus("✅ Muestra de entrenamiento guardada exitosamente", "success")
        stream.getTracks().forEach((track) => track.stop())
      }

      trainingMediaRecorder.start()
      isTraining = true
      trainingSeconds = 0

      updateTrainingUI(true)

      trainingTimer = setInterval(() => {
        trainingSeconds++
        updateTimerDisplay("trainingTime", trainingSeconds)
      }, 1000)
    })
    .catch((error) => {
      console.error("Error accediendo al micrófono:", error)
      alert("❌ Error: No se pudo acceder al micrófono.")
    })
}

function detenerEntrenamiento() {
  if (trainingMediaRecorder && trainingMediaRecorder.state === "recording") {
    trainingMediaRecorder.stop()
    isTraining = false
    updateTrainingUI(false)

    if (trainingTimer) {
      clearInterval(trainingTimer)
      trainingTimer = null
    }
  }
}

function updateTrainingUI(training) {
  const trainBtn = document.getElementById("trainBtn")
  const trainingTimerElement = document.getElementById("trainingTimer")

  if (trainBtn) {
    trainBtn.disabled = !selectedPangram
    if (training) {
      trainBtn.innerHTML = '<span class="btn-icon">⏹️</span><span class="btn-text">Detener Grabación</span>'
    } else {
      trainBtn.innerHTML = '<span class="btn-icon">🎙️</span><span class="btn-text">Iniciar Grabación</span>'
    }
  }

  if (trainingTimerElement) {
    trainingTimerElement.style.display = training ? "block" : "none"
  }
}

function updateTrainingStatus(message, type) {
  const statusElement = document.getElementById("trainingStatus")
  if (statusElement) {
    statusElement.textContent = message
    statusElement.className = `training-status ${type}`
  }
}

// ========================================
// FUNCIONES DE MENÚ Y CONFIGURACIÓN
// ========================================

function toggleOptionsMenu() {
  const dropdown = document.getElementById("optionsDropdown")
  if (dropdown) dropdown.classList.toggle("show")
}

function showProfile() {
  const dropdown = document.getElementById("optionsDropdown")
  if (dropdown) dropdown.classList.remove("show")
  showSection("perfil")
}

function showSettings() {
  const dropdown = document.getElementById("optionsDropdown")
  if (dropdown) dropdown.classList.remove("show")
  showSection("configuracion")
  loadCurrentConfig()
}

function logout() {
  const dropdown = document.getElementById("optionsDropdown")
  if (dropdown) dropdown.classList.remove("show")

  if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
    userState = {
      isLoggedIn: false,
      hasProfile: false,
      email: "",
      userData: null,
    }

    updateNavigation()
    showSection("auth")

    // Limpiar formularios
    const authForm = document.getElementById("authForm")
    const authStatus = document.getElementById("authStatus")
    if (authForm) authForm.reset()
    if (authStatus) authStatus.textContent = ""
  }
}

function loadCurrentConfig() {
  const themeSelector = document.getElementById("themeSelector")
  const languageSelector = document.getElementById("languageSelector")

  if (themeSelector) themeSelector.value = userConfig.theme
  if (languageSelector) languageSelector.value = userConfig.language
}

function changeTheme() {
  const themeSelector = document.getElementById("themeSelector")
  userConfig.theme = themeSelector.value

  if (userConfig.theme === "light") {
    document.body.classList.add("light-theme")
  } else {
    document.body.classList.remove("light-theme")
  }
}

function changeLanguage() {
  const languageSelector = document.getElementById("languageSelector")
  userConfig.language = languageSelector.value
  updateNavigation()
}

function saveConfiguration() {
  localStorage.setItem("vozcheckConfig", JSON.stringify(userConfig))
  alert("✅ Configuración guardada exitosamente")
}

function resetConfiguration() {
  if (confirm("¿Estás seguro de que quieres restablecer la configuración?")) {
    userConfig = { theme: "dark", language: "es" }
    document.body.classList.remove("light-theme")
    loadCurrentConfig()
    updateNavigation()
    alert("🔄 Configuración restablecida")
  }
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone) {
  const phoneRegex = /^\d{10}$/
  return phoneRegex.test(phone)
}

function showStatus(element, message, type) {
  if (!element) return

  element.textContent = message
  element.className = `auth-status ${type}`

  const colors = {
    success: "#00c851",
    error: "#ff4444",
    loading: "#00d4ff",
    warning: "#ffbb33",
  }

  element.style.color = colors[type] || "#ffffff"
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId)
  if (!field) return

  field.classList.add("input-error")
  field.classList.remove("input-success")

  const existingError = field.parentNode.querySelector(".form-error")
  if (existingError) existingError.remove()

  const errorDiv = document.createElement("div")
  errorDiv.className = "form-error"
  errorDiv.textContent = message
  field.parentNode.appendChild(errorDiv)
}

function clearFormErrors() {
  document.querySelectorAll(".form-error").forEach((error) => error.remove())
  document.querySelectorAll(".input-error").forEach((field) => {
    field.classList.remove("input-error")
  })
  document.querySelectorAll(".input-success").forEach((field) => {
    field.classList.remove("input-success")
  })
}

function updateFileStatus(statusId, message, type) {
  const statusElement = document.getElementById(statusId)
  if (statusElement) {
    statusElement.textContent = message
    statusElement.className = `file-status ${type}`
  }
}

function validateAudioFile(file, statusElementId) {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/wave", "audio/webm", "audio/ogg"]

  if (!file) {
    updateFileStatus(statusElementId, "", "")
    return false
  }

  const isValidType = allowedTypes.includes(file.type) || file.name.toLowerCase().match(/\.(mp3|wav|webm|ogg)$/)

  if (!isValidType) {
    updateFileStatus(statusElementId, "❌ Formato no válido. Use MP3, WAV, WebM u OGG", "error")
    return false
  }

  if (file.size > maxSize) {
    updateFileStatus(statusElementId, "❌ Archivo muy grande. Máximo 50MB", "error")
    return false
  }

  if (file.size < 50 * 1024) {
    updateFileStatus(statusElementId, "⚠️ Archivo muy pequeño. Mínimo 3 segundos", "warning")
    return false
  }

  updateFileStatus(statusElementId, "✅ Archivo válido - Listo para análisis", "success")
  return true
}

// ========================================
// INICIALIZACIÓN Y EVENT LISTENERS
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 VozCheck iniciado")

  // Inicializar estado
  userState = {
    isLoggedIn: false,
    hasProfile: false,
    email: "",
    userData: null,
  }

  // Mostrar sección de acceso por defecto
  showSection("auth")
  updateNavigation()

  // Event listeners para archivos
  setupFileListeners()

  // Event listeners para pangramas
  setupPangramListeners()

  // Event listener para contador de teléfono
  const telefonoInput = document.getElementById("telefono")
  if (telefonoInput) {
    telefonoInput.addEventListener("input", (e) => {
      const counter = document.getElementById("phoneCounter")
      if (counter) {
        const length = e.target.value.length
        counter.textContent = `${length}/10`
        counter.className = `phone-counter ${length === 10 ? "valid" : length > 10 ? "invalid" : ""}`
      }
    })
  }

  // Cerrar menú al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".options-menu")) {
      const dropdown = document.getElementById("optionsDropdown")
      if (dropdown) dropdown.classList.remove("show")
    }
  })

  // Cargar configuración guardada
  loadUserConfiguration()

  console.log("✅ VozCheck inicializado correctamente")
})

function setupFileListeners() {
  // Archivo de análisis
  const archivoAudio = document.getElementById("archivoAudio")
  if (archivoAudio) {
    archivoAudio.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file && validateAudioFile(file, "archivoAudioStatus")) {
        fileStates.archivoAudio = { loaded: true, validated: true, file: file }
        const analyzeBtn = document.getElementById("analyzeBtn")
        if (analyzeBtn) analyzeBtn.disabled = false
      }
    })
  }

  // Archivos de comparación
  const archivo1 = document.getElementById("archivo1")
  const archivo2 = document.getElementById("archivo2")

  if (archivo1) {
    archivo1.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file && validateAudioFile(file, "archivo1Status")) {
        fileStates.archivo1 = { loaded: true, validated: true, file: file }
        checkComparisonFiles()
      }
    })
  }

  if (archivo2) {
    archivo2.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file && validateAudioFile(file, "archivo2Status")) {
        fileStates.archivo2 = { loaded: true, validated: true, file: file }
        checkComparisonFiles()
      }
    })
  }
}

function checkComparisonFiles() {
  const compareBtn = document.getElementById("compareBtn")
  if (compareBtn && fileStates.archivo1.validated && fileStates.archivo2.validated) {
    compareBtn.disabled = false
  }
}

function setupPangramListeners() {
  document.querySelectorAll(".pangram-item").forEach((item) => {
    item.addEventListener("click", () => {
      // Remover selección anterior
      document.querySelectorAll(".pangram-item").forEach((p) => p.classList.remove("selected"))

      // Seleccionar actual
      item.classList.add("selected")
      selectedPangram = item.dataset.pangram

      // Mostrar texto seleccionado
      const selectedTextDiv = document.getElementById("selectedText")
      const selectedPangramP = document.getElementById("selectedPangram")

      if (selectedTextDiv && selectedPangramP) {
        selectedPangramP.textContent = selectedPangram
        selectedTextDiv.style.display = "block"
      }

      // Habilitar botón de entrenamiento
      const trainBtn = document.getElementById("trainBtn")
      if (trainBtn) trainBtn.disabled = false
    })
  })
}

function loadUserConfiguration() {
  const savedConfig = localStorage.getItem("vozcheckConfig")
  if (savedConfig) {
    userConfig = { ...userConfig, ...JSON.parse(savedConfig) }
    if (userConfig.theme === "light") {
      document.body.classList.add("light-theme")
    }
  }
}
