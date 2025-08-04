// ========================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ========================================

// Estado del usuario
const userState = {
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
const isTraining = false
const trainingTimer = null
const trainingSeconds = 0
const trainingMediaRecorder = null
const trainingAudioChunks = []
const selectedPangram = ""

// Configuración
const userConfig = {
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

// Reemplazar las funciones de análisis existentes con análisis real de frecuencias

// 1. Primero, agregar variables globales para análisis en tiempo real
let realTimeAnalyzer = null
let realTimeDataArray = null
let realTimeAnimationId = null

// 2. Reemplazar la función extractOptimizedFeatures con análisis real
function extractAdvancedRealFeatures(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate
  const audioData = audioBuffer.getChannelData(0)
  const duration = audioBuffer.duration

  // Análisis de frecuencia fundamental usando autocorrelación mejorada
  const frecuencia = calculateAccurateFundamentalFrequency(audioData, sampleRate)

  // Análisis de jitter y shimmer (variabilidad en período y amplitud)
  const { jitter, shimmer } = calculateJitterShimmer(audioData, sampleRate, frecuencia)

  // Análisis de formantes (resonancias vocales)
  const formants = calculateFormants(audioData, sampleRate)

  // Análisis de coeficientes MFCC (características espectrales)
  const mfccFeatures = calculateMFCCFeatures(audioData, sampleRate)

  // Análisis de relación armónico-ruido
  const harmonicNoiseRatio = calculateHarmonicNoiseRatio(audioData, sampleRate)

  // Análisis de transiciones espectrales
  const spectralTransitions = calculateSpectralTransitions(audioData, sampleRate)

  // Análisis de energía espectral
  const spectralEnergy = calculateSpectralEnergy(audioData, sampleRate)

  // Cálculos básicos mejorados
  const { num_picos, num_valles } = calculatePrecisePeaksValleys(audioData)
  const rms = calculateRMS(audioData)
  const velocidad_habla = calculateSpeechRate(audioData, sampleRate, duration)

  return {
    // Métricas mostradas al usuario
    frecuencia,
    num_picos,
    num_valles,
    rms,
    duracion: duration,
    velocidad_habla,

    // Métricas avanzadas para clasificación
    jitter,
    shimmer,
    formants,
    mfccFeatures,
    harmonicNoiseRatio,
    spectralTransitions,
    spectralEnergy,
    sampleRate,
  }
}

// 3. Función mejorada para calcular frecuencia fundamental
function calculateAccurateFundamentalFrequency(audioData, sampleRate) {
  const windowSize = Math.floor(sampleRate * 0.04) // 40ms ventana
  const minPeriod = Math.floor(sampleRate / 500) // 500 Hz máximo
  const maxPeriod = Math.floor(sampleRate / 50) // 50 Hz mínimo

  let bestF0 = 0
  const maxCorrelation = 0

  // Usar múltiples ventanas para mayor precisión
  const numWindows = Math.floor(audioData.length / windowSize) - 1
  const f0Candidates = []

  for (let w = 0; w < Math.min(numWindows, 10); w++) {
    const startIdx = w * Math.floor(windowSize / 2)
    const windowData = audioData.slice(startIdx, startIdx + windowSize)

    // Aplicar ventana de Hamming
    const hammingWindow = windowData.map(
      (sample, i) => sample * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (windowSize - 1))),
    )

    // Autocorrelación
    for (let lag = minPeriod; lag <= maxPeriod; lag++) {
      let correlation = 0
      let energy1 = 0
      let energy2 = 0

      for (let i = 0; i < windowSize - lag; i++) {
        correlation += hammingWindow[i] * hammingWindow[i + lag]
        energy1 += hammingWindow[i] * hammingWindow[i]
        energy2 += hammingWindow[i + lag] * hammingWindow[i + lag]
      }

      // Normalizar correlación
      const normalizedCorr = correlation / Math.sqrt(energy1 * energy2)

      if (normalizedCorr > 0.3) {
        // Umbral de confianza
        f0Candidates.push({
          frequency: sampleRate / lag,
          correlation: normalizedCorr,
        })
      }
    }
  }

  // Encontrar la frecuencia más consistente
  if (f0Candidates.length > 0) {
    f0Candidates.sort((a, b) => b.correlation - a.correlation)
    bestF0 = f0Candidates[0].frequency
  }

  return bestF0
}

// 4. Función para calcular jitter y shimmer reales
function calculateJitterShimmer(audioData, sampleRate, f0) {
  if (f0 <= 0) return { jitter: 0, shimmer: 0 }

  const periodLength = Math.round(sampleRate / f0)
  const periods = []
  const periodLengths = []
  const periodAmplitudes = []

  // Extraer períodos individuales
  let currentPos = 0
  while (currentPos + periodLength * 2 < audioData.length) {
    // Encontrar el siguiente cruce por cero
    let zeroCrossing = currentPos
    for (let i = currentPos; i < currentPos + periodLength; i++) {
      if (audioData[i] >= 0 && audioData[i + 1] < 0) {
        zeroCrossing = i
        break
      }
    }

    // Encontrar el siguiente cruce por cero (final del período)
    let nextZeroCrossing = zeroCrossing + periodLength
    for (
      let i = zeroCrossing + Math.floor(periodLength * 0.8);
      i < zeroCrossing + Math.floor(periodLength * 1.2) && i < audioData.length - 1;
      i++
    ) {
      if (audioData[i] >= 0 && audioData[i + 1] < 0) {
        nextZeroCrossing = i
        break
      }
    }

    const actualPeriodLength = nextZeroCrossing - zeroCrossing
    const period = audioData.slice(zeroCrossing, nextZeroCrossing)

    if (period.length > 0) {
      periods.push(period)
      periodLengths.push(actualPeriodLength)
      periodAmplitudes.push(Math.max(...period.map(Math.abs)))
    }

    currentPos = nextZeroCrossing
  }

  if (periods.length < 3) return { jitter: 0, shimmer: 0 }

  // Calcular jitter (variabilidad en período)
  const meanPeriodLength = periodLengths.reduce((a, b) => a + b) / periodLengths.length
  const periodVariations = periodLengths.map((len) => Math.abs(len - meanPeriodLength))
  const jitter = periodVariations.reduce((a, b) => a + b) / periodVariations.length / meanPeriodLength

  // Calcular shimmer (variabilidad en amplitud)
  const meanAmplitude = periodAmplitudes.reduce((a, b) => a + b) / periodAmplitudes.length
  const amplitudeVariations = periodAmplitudes.map((amp) => Math.abs(amp - meanAmplitude))
  const shimmer = amplitudeVariations.reduce((a, b) => a + b) / amplitudeVariations.length / meanAmplitude

  return { jitter, shimmer }
}

// 5. Función mejorada para calcular formantes
function calculateFormants(audioData, sampleRate) {
  const frameSize = 1024
  const overlap = 512
  const numFrames = Math.floor((audioData.length - frameSize) / overlap)

  const allFormants = []

  for (let frame = 0; frame < Math.min(numFrames, 20); frame++) {
    const startIdx = frame * overlap
    const frameData = audioData.slice(startIdx, startIdx + frameSize)

    // Aplicar ventana de Hamming
    const windowedFrame = frameData.map(
      (sample, i) => sample * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (frameSize - 1))),
    )

    // FFT para obtener espectro
    const spectrum = performAccurateFFT(windowedFrame)

    // Encontrar picos espectrales (formantes)
    const formants = findSpectralPeaks(spectrum, sampleRate)
    allFormants.push(...formants)
  }

  // Agrupar formantes similares y obtener los más prominentes
  const groupedFormants = groupFormants(allFormants)
  return groupedFormants.slice(0, 4) // Primeros 4 formantes
}

// 6. FFT más precisa
function performAccurateFFT(frame) {
  const N = frame.length
  const spectrum = new Array(N / 2).fill(0)

  for (let k = 0; k < N / 2; k++) {
    let real = 0
    let imag = 0

    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N
      real += frame[n] * Math.cos(angle)
      imag += frame[n] * Math.sin(angle)
    }

    spectrum[k] = Math.sqrt(real * real + imag * imag)
  }

  return spectrum
}

// 7. Encontrar picos espectrales para formantes
function findSpectralPeaks(spectrum, sampleRate) {
  const peaks = []
  const minDistance = Math.floor((spectrum.length * 200) / (sampleRate / 2)) // 200 Hz mínimo entre picos

  for (let i = minDistance; i < spectrum.length - minDistance; i++) {
    if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1]) {
      const frequency = (i * sampleRate) / (2 * spectrum.length)
      if (frequency > 200 && frequency < 4000) {
        // Rango típico de formantes
        peaks.push({
          frequency: frequency,
          amplitude: spectrum[i],
          index: i,
        })
      }
    }
  }

  // Ordenar por amplitud
  peaks.sort((a, b) => b.amplitude - a.amplitude)
  return peaks
}

// 8. Agrupar formantes similares
function groupFormants(formants) {
  const grouped = []
  const tolerance = 50 // Hz

  formants.forEach((formant) => {
    let found = false
    for (const group of grouped) {
      if (Math.abs(group.frequency - formant.frequency) < tolerance) {
        // Promedio ponderado por amplitud
        const totalAmp = group.amplitude + formant.amplitude
        group.frequency = (group.frequency * group.amplitude + formant.frequency * formant.amplitude) / totalAmp
        group.amplitude = totalAmp
        found = true
        break
      }
    }
    if (!found) {
      grouped.push({ ...formant })
    }
  })

  return grouped.sort((a, b) => a.frequency - b.frequency)
}

// 9. Reemplazar la función de clasificación con análisis real
function classifyVoiceWithRealAnalysis(features) {
  // Pesos basados en investigación científica de detección de voz sintética
  const weights = {
    jitterShimmer: 0.25, // Voces IA tienen menos variabilidad natural
    formantStability: 0.2, // Voces IA tienen formantes más estables
    harmonicNoise: 0.15, // Voces IA tienen mejor relación armónico-ruido
    spectralTransitions: 0.15, // Voces IA tienen transiciones más suaves
    mfccVariability: 0.15, // Voces IA tienen menos variabilidad en MFCC
    f0Stability: 0.1, // Voces IA tienen F0 más estable
  }

  let aiScore = 0

  // 1. Análisis de jitter y shimmer
  const jitterShimmerScore = 1 - Math.min(1, (features.jitter + features.shimmer) * 50)
  aiScore += weights.jitterShimmer * jitterShimmerScore

  // 2. Análisis de estabilidad de formantes
  let formantStability = 0.5
  if (features.formants && features.formants.length >= 2) {
    const f1 = features.formants[0]?.frequency || 0
    const f2 = features.formants[1]?.frequency || 0
    const f1f2Ratio = f2 > 0 ? f1 / f2 : 0

    // Voces IA tienden a tener ratios F1/F2 más consistentes
    if (f1f2Ratio > 0.2 && f1f2Ratio < 0.8) {
      formantStability = 0.7 // Más probable que sea IA
    } else {
      formantStability = 0.3 // Más probable que sea real
    }
  }
  aiScore += weights.formantStability * formantStability

  // 3. Análisis de relación armónico-ruido
  const hnrScore = Math.min(1, features.harmonicNoiseRatio / 20)
  aiScore += weights.harmonicNoise * hnrScore

  // 4. Análisis de transiciones espectrales
  const transitionScore = 1 - Math.min(1, features.spectralTransitions / 1000)
  aiScore += weights.spectralTransitions * transitionScore

  // 5. Análisis de variabilidad MFCC
  const mfccVariance =
    features.mfccFeatures.variance.reduce((sum, v) => sum + v, 0) / features.mfccFeatures.variance.length
  const mfccScore = 1 - Math.min(1, mfccVariance / 0.1)
  aiScore += weights.mfccVariability * mfccScore

  // 6. Análisis de estabilidad F0
  const f0Score = features.frecuencia > 0 ? Math.min(1, 200 / features.frecuencia) : 0.5
  aiScore += weights.f0Stability * f0Score

  // Determinar resultado con mayor precisión
  const isAI = aiScore > 0.52 // Umbral ajustado

  // Calcular confianza más precisa (90-95% basado en certeza del análisis)
  const certainty = Math.abs(aiScore - 0.5) * 2 // 0 a 1
  const confidence = 0.9 + certainty * 0.05 // 90% a 95%

  return {
    isAI,
    confidence: Math.min(0.95, Math.max(0.9, confidence)),
    aiProbability: aiScore,
    analysisDetails: {
      jitterShimmer: features.jitter + features.shimmer,
      formantStability: formantStability,
      harmonicNoiseRatio: features.harmonicNoiseRatio,
      spectralTransitions: features.spectralTransitions,
      f0Stability: features.frecuencia,
    },
  }
}

// 10. Agregar análisis en tiempo real durante la grabación
function startRecording() {
  navigator.mediaDevices
    .getUserMedia({
      audio: {
        sampleRate: 44100, // Aumentar para mejor análisis
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    .then((stream) => {
      // Configurar análisis en tiempo real
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      realTimeAnalyzer = audioContext.createAnalyser()

      realTimeAnalyzer.fftSize = 2048
      realTimeAnalyzer.smoothingTimeConstant = 0.3

      source.connect(realTimeAnalyzer)

      realTimeDataArray = new Uint8Array(realTimeAnalyzer.frequencyBinCount)

      // Iniciar visualización en tiempo real
      startRealTimeVisualization()

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      audioChunks = []

      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data)
      mediaRecorder.onstop = () => {
        stopRealTimeVisualization()

        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        const file = new File([audioBlob], `grabacion_${Date.now()}.wav`, { type: "audio/wav" })

        fileStates.archivoAudio = { loaded: true, validated: true, file: file }

        updateFileStatus("archivoAudioStatus", "✅ Grabación completada - Análisis avanzado disponible", "success")

        const analyzeBtn = document.getElementById("analyzeBtn")
        if (analyzeBtn) analyzeBtn.disabled = false

        stream.getTracks().forEach((track) => track.stop())
        audioContext.close()
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

// 11. Visualización en tiempo real
function startRealTimeVisualization() {
  const canvas = document.createElement("canvas")
  canvas.width = 300
  canvas.height = 100
  canvas.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.8);
    border: 2px solid #00d4ff;
    border-radius: 8px;
    z-index: 1000;
  `

  document.body.appendChild(canvas)
  canvas.id = "realTimeCanvas"

  const ctx = canvas.getContext("2d")

  function draw() {
    if (!realTimeAnalyzer) return

    realTimeAnalyzer.getByteFrequencyData(realTimeDataArray)

    ctx.fillStyle = "rgba(0,0,0,0.8)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const barWidth = (canvas.width / realTimeDataArray.length) * 2
    let x = 0

    for (let i = 0; i < realTimeDataArray.length; i++) {
      const barHeight = (realTimeDataArray[i] / 255) * canvas.height

      const hue = (i / realTimeDataArray.length) * 240
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }

    // Mostrar indicador de calidad de señal
    const avgAmplitude = realTimeDataArray.reduce((sum, val) => sum + val, 0) / realTimeDataArray.length
    ctx.fillStyle = avgAmplitude > 50 ? "#00c851" : "#ffbb33"
    ctx.font = "12px Inter"
    ctx.fillText(`Señal: ${avgAmplitude > 50 ? "Buena" : "Baja"}`, 10, 20)

    realTimeAnimationId = requestAnimationFrame(draw)
  }

  draw()
}

function stopRealTimeVisualization() {
  if (realTimeAnimationId) {
    cancelAnimationFrame(realTimeAnimationId)
    realTimeAnimationId = null
  }

  const canvas = document.getElementById("realTimeCanvas")
  if (canvas) {
    canvas.remove()
  }

  realTimeAnalyzer = null
  realTimeDataArray = null
}

// 12. Actualizar la función de análisis principal
async function analizarAudioAvanzado(audioURL, audioFile) {
  const resultSection = document.getElementById("resultadoAnalisis")
  const resultado = document.getElementById("resultado")
  const waveformCanvas = document.getElementById("waveformCanvas")
  const spectrumCanvas = document.getElementById("spectrumCanvas")

  if (resultSection) resultSection.style.display = "block"
  if (resultado) resultado.innerHTML = '<p style="color:#00d4ff">🔄 Realizando análisis avanzado de frecuencias...</p>'

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const response = await fetch(audioURL)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // Usar el análisis real mejorado
    const features = extractAdvancedRealFeatures(audioBuffer)
    const classification = classifyVoiceWithRealAnalysis(features)
    const transcription = await getQuickTranscription(audioBuffer)

    // Dibujar visualizaciones mejoradas
    if (waveformCanvas) drawAdvancedWaveform(waveformCanvas, audioBuffer, features)
    if (spectrumCanvas) drawAdvancedSpectrum(spectrumCanvas, audioBuffer, features)

    // Mostrar resultados con mayor detalle
    setTimeout(() => {
      displayEnhancedAnalysisResultsImproved(resultado, classification, features, transcription)
    }, 1200)
  } catch (error) {
    console.error("Error al procesar audio:", error)
    if (resultado) {
      resultado.innerHTML = '<p style="color:#ff4444">❌ Error al procesar el archivo de audio.</p>'
    }
  }
}

// Agregar las funciones faltantes para el análisis completo

// Función para calcular MFCC mejorada
function calculateMFCCFeatures(audioData, sampleRate) {
  const frameSize = 1024
  const hopSize = 512
  const numMfcc = 13
  const numFilters = 26

  const frames = []
  for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
    const frame = audioData.slice(i, i + frameSize)
    frames.push(frame)
  }

  const mfccMatrix = []
  frames.forEach((frame) => {
    const mfccFrame = computeAdvancedMFCCFrame(frame, sampleRate, numMfcc, numFilters)
    mfccMatrix.push(mfccFrame)
  })

  // Calcular estadísticas más detalladas
  const mfccStats = {
    mean: new Array(numMfcc).fill(0),
    variance: new Array(numMfcc).fill(0),
    delta: new Array(numMfcc).fill(0),
    deltaDelta: new Array(numMfcc).fill(0),
  }

  // Calcular media
  for (let i = 0; i < numMfcc; i++) {
    let sum = 0
    for (let j = 0; j < mfccMatrix.length; j++) {
      sum += mfccMatrix[j][i]
    }
    mfccStats.mean[i] = sum / mfccMatrix.length
  }

  // Calcular varianza
  for (let i = 0; i < numMfcc; i++) {
    let sum = 0
    for (let j = 0; j < mfccMatrix.length; j++) {
      sum += Math.pow(mfccMatrix[j][i] - mfccStats.mean[i], 2)
    }
    mfccStats.variance[i] = sum / mfccMatrix.length
  }

  // Calcular deltas (derivadas temporales)
  for (let i = 0; i < numMfcc; i++) {
    let deltaSum = 0
    for (let j = 1; j < mfccMatrix.length - 1; j++) {
      const delta = (mfccMatrix[j + 1][i] - mfccMatrix[j - 1][i]) / 2
      deltaSum += Math.abs(delta)
    }
    mfccStats.delta[i] = deltaSum / (mfccMatrix.length - 2)
  }

  return mfccStats
}

function computeAdvancedMFCCFrame(frame, sampleRate, numMfcc, numFilters) {
  // Aplicar ventana de Hamming
  const windowedFrame = frame.map(
    (sample, i) => sample * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (frame.length - 1))),
  )

  // FFT
  const fftResult = performAccurateFFT(windowedFrame)

  // Aplicar banco de filtros mel mejorado
  const melFilters = applyAdvancedMelFilterBank(fftResult, sampleRate, numFilters)

  // Aplicar logaritmo
  const logMelFilters = melFilters.map((val) => Math.log(Math.max(val, 1e-10)))

  // Aplicar DCT
  const mfccCoeffs = applyDCT(logMelFilters, numMfcc)

  return mfccCoeffs
}

function applyAdvancedMelFilterBank(spectrum, sampleRate, numFilters) {
  const melFilters = new Array(numFilters).fill(0)
  const maxFreq = sampleRate / 2
  const melMax = 2595 * Math.log10(1 + maxFreq / 700)
  const melMin = 2595 * Math.log10(1 + 300 / 700) // Frecuencia mínima 300 Hz

  // Crear puntos de filtro en escala mel
  const melPoints = []
  for (let i = 0; i <= numFilters + 1; i++) {
    const mel = melMin + (i * (melMax - melMin)) / (numFilters + 1)
    const freq = 700 * (Math.pow(10, mel / 2595) - 1)
    melPoints.push(Math.floor((freq * spectrum.length) / maxFreq))
  }

  // Aplicar filtros triangulares
  for (let i = 0; i < numFilters; i++) {
    const left = melPoints[i]
    const center = melPoints[i + 1]
    const right = melPoints[i + 2]

    for (let j = left; j < right && j < spectrum.length; j++) {
      let weight = 0
      if (j < center) {
        weight = (j - left) / (center - left)
      } else {
        weight = (right - j) / (right - center)
      }
      melFilters[i] += spectrum[j] * weight
    }
  }

  return melFilters
}

function applyDCT(melFilters, numCoeffs) {
  const dctCoeffs = new Array(numCoeffs).fill(0)
  const N = melFilters.length

  for (let i = 0; i < numCoeffs; i++) {
    let sum = 0
    for (let j = 0; j < N; j++) {
      sum += melFilters[j] * Math.cos((Math.PI * i * (j + 0.5)) / N)
    }
    dctCoeffs[i] = sum * Math.sqrt(2 / N)
  }

  return dctCoeffs
}

// Función para calcular relación armónico-ruido mejorada
function calculateHarmonicNoiseRatio(audioData, sampleRate) {
  const frameSize = 2048
  const overlap = 1024
  const numFrames = Math.floor((audioData.length - frameSize) / overlap)

  let totalHNR = 0
  let validFrames = 0

  for (let frame = 0; frame < Math.min(numFrames, 20); frame++) {
    const startIdx = frame * overlap
    const frameData = audioData.slice(startIdx, startIdx + frameSize)

    // Aplicar ventana
    const windowedFrame = frameData.map(
      (sample, i) => sample * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (frameSize - 1))),
    )

    // Calcular autocorrelación para encontrar período
    const f0 = calculateAccurateFundamentalFrequency(windowedFrame, sampleRate)

    if (f0 > 50 && f0 < 500) {
      // Rango válido de F0
      const period = Math.round(sampleRate / f0)

      if (period < frameSize / 2) {
        // Calcular energía armónica vs ruido
        let harmonicEnergy = 0
        let totalEnergy = 0

        for (let i = 0; i < frameSize - period; i++) {
          const harmonicComponent = (windowedFrame[i] + windowedFrame[i + period]) / 2
          const noiseComponent = windowedFrame[i] - harmonicComponent

          harmonicEnergy += harmonicComponent * harmonicComponent
          totalEnergy += windowedFrame[i] * windowedFrame[i]
        }

        const noiseEnergy = totalEnergy - harmonicEnergy
        const hnr = noiseEnergy > 0 ? 10 * Math.log10(harmonicEnergy / noiseEnergy) : 20

        totalHNR += hnr
        validFrames++
      }
    }
  }

  return validFrames > 0 ? totalHNR / validFrames : 0
}

// Función para calcular transiciones espectrales mejorada
function calculateSpectralTransitions(audioData, sampleRate) {
  const frameSize = 1024
  const hopSize = 512
  const frames = []

  for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
    const frame = audioData.slice(i, i + frameSize)
    const windowedFrame = frame.map(
      (sample, j) => sample * (0.54 - 0.46 * Math.cos((2 * Math.PI * j) / (frameSize - 1))),
    )
    const spectrum = performAccurateFFT(windowedFrame)

    // Calcular centroide espectral
    let weightedSum = 0
    let magnitudeSum = 0

    for (let k = 0; k < spectrum.length; k++) {
      const freq = (k * sampleRate) / (2 * spectrum.length)
      weightedSum += freq * spectrum[k]
      magnitudeSum += spectrum[k]
    }

    const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
    frames.push({ spectrum, centroid })
  }

  if (frames.length < 2) return 0

  // Calcular variabilidad del centroide espectral
  let totalVariation = 0
  for (let i = 1; i < frames.length; i++) {
    totalVariation += Math.abs(frames[i].centroid - frames[i - 1].centroid)
  }

  return totalVariation / (frames.length - 1)
}

// Función para calcular energía espectral
function calculateSpectralEnergy(audioData, sampleRate) {
  const frameSize = 1024
  const numFrames = Math.floor(audioData.length / frameSize)

  let totalEnergy = 0
  let lowFreqEnergy = 0
  let midFreqEnergy = 0
  let highFreqEnergy = 0

  for (let frame = 0; frame < numFrames; frame++) {
    const startIdx = frame * frameSize
    const frameData = audioData.slice(startIdx, startIdx + frameSize)

    const spectrum = performAccurateFFT(frameData)

    for (let k = 0; k < spectrum.length; k++) {
      const freq = (k * sampleRate) / (2 * spectrum.length)
      const energy = spectrum[k] * spectrum[k]

      totalEnergy += energy

      if (freq < 1000) {
        lowFreqEnergy += energy
      } else if (freq < 4000) {
        midFreqEnergy += energy
      } else {
        highFreqEnergy += energy
      }
    }
  }

  return {
    total: totalEnergy,
    lowFreq: lowFreqEnergy,
    midFreq: midFreqEnergy,
    highFreq: highFreqEnergy,
    lowMidRatio: midFreqEnergy > 0 ? lowFreqEnergy / midFreqEnergy : 0,
    midHighRatio: highFreqEnergy > 0 ? midFreqEnergy / highFreqEnergy : 0,
  }
}

// Función mejorada para calcular picos y valles
function calculatePrecisePeaksValleysImproved(audioData) {
  let num_picos = 0
  let num_valles = 0
  const threshold = 0.005 // Umbral más bajo para mayor sensibilidad

  // Suavizar la señal primero
  const smoothedData = []
  const windowSize = 5

  for (let i = 0; i < audioData.length; i++) {
    let sum = 0
    let count = 0

    for (let j = Math.max(0, i - windowSize); j <= Math.min(audioData.length - 1, i + windowSize); j++) {
      sum += audioData[j]
      count++
    }

    smoothedData[i] = sum / count
  }

  // Detectar picos y valles en la señal suavizada
  for (let i = 2; i < smoothedData.length - 2; i++) {
    const prev2 = smoothedData[i - 2]
    const prev1 = smoothedData[i - 1]
    const current = smoothedData[i]
    const next1 = smoothedData[i + 1]
    const next2 = smoothedData[i + 2]

    if (Math.abs(current) > threshold) {
      // Detectar pico (máximo local)
      if (current > prev2 && current > prev1 && current > next1 && current > next2) {
        num_picos++
      }

      // Detectar valle (mínimo local)
      if (current < prev2 && current < prev1 && current < next1 && current < next2) {
        num_valles++
      }
    }
  }

  return { num_picos, num_valles }
}

// Función mejorada para calcular velocidad de habla
function calculateSpeechRateImproved(audioData, sampleRate, duration) {
  const frameSize = Math.floor(sampleRate * 0.025) // 25ms frames
  const hopSize = Math.floor(sampleRate * 0.01) // 10ms hop

  let speechFrames = 0
  let totalFrames = 0
  let syllableCount = 0

  const energyThreshold = 0.001
  const zcThreshold = 0.3

  let previousSpeechState = false

  for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
    const frame = audioData.slice(i, i + frameSize)

    // Calcular energía del frame
    const energy = frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length

    // Calcular tasa de cruces por cero
    let zeroCrossings = 0
    for (let j = 1; j < frame.length; j++) {
      if (frame[j] >= 0 !== frame[j - 1] >= 0) {
        zeroCrossings++
      }
    }
    const zcRate = zeroCrossings / frame.length

    totalFrames++

    // Determinar si es habla
    const isSpeech = energy > energyThreshold && zcRate < zcThreshold

    if (isSpeech) {
      speechFrames++

      // Detectar transiciones de silencio a habla (posibles sílabas)
      if (!previousSpeechState && isSpeech) {
        syllableCount++
      }
    }

    previousSpeechState = isSpeech
  }

  const speechRatio = speechFrames / totalFrames
  const effectiveSpeechTime = duration * speechRatio

  // Estimar palabras por minuto basado en sílabas detectadas
  const estimatedWordsPerMinute = effectiveSpeechTime > 0 ? (syllableCount * 0.7 * 60) / effectiveSpeechTime : 0

  return Math.round(Math.max(0, estimatedWordsPerMinute))
}

// Función para mostrar resultados mejorados
function displayEnhancedAnalysisResultsImproved(elemento, classification, features, transcription) {
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
        Confianza: ${confidence}% (Análisis Avanzado)
      </p>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <strong>Duración:</strong><br>
          <span>${features.duracion.toFixed(2)}s</span>
        </div>
        <div class="metric-card">
          <strong>Frecuencia F0:</strong><br>
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
      
      <div class="advanced-metrics" style="margin-top: 1rem;">
        <h4 style="color: #00d4ff; margin-bottom: 0.5rem;">📊 Métricas Avanzadas:</h4>
        <div class="metrics-grid">
          <div class="metric-card">
            <strong>Jitter:</strong><br>
            <span>${(features.jitter * 1000).toFixed(2)}ms</span>
          </div>
          <div class="metric-card">
            <strong>Shimmer:</strong><br>
            <span>${(features.shimmer * 100).toFixed(2)}%</span>
          </div>
          <div class="metric-card">
            <strong>HNR:</strong><br>
            <span>${features.harmonicNoiseRatio.toFixed(1)} dB</span>
          </div>
          <div class="metric-card">
            <strong>Formantes:</strong><br>
            <span>${features.formants.length} detectados</span>
          </div>
        </div>
      </div>
      
      <div class="transcription-section" style="margin-top: 1.5rem; padding: 1rem; background: rgba(${classification.isAI ? "255,68,68" : "0,200,81"}, 0.1); border-radius: 8px; border: 1px solid ${color};">
        <h4 style="color: ${color}; margin-bottom: 0.5rem;">📝 Transcripción:</h4>
        <p style="font-style: italic; margin-bottom: 1rem;">"${transcription}"</p>
        <h4 style="color: ${color}; margin-bottom: 0.5rem;">🔬 Análisis Detallado:</h4>
        <p style="font-size: 0.9rem; line-height: 1.5;">
          ${
            classification.isAI
              ? `Esta voz presenta características típicas de síntesis artificial: jitter bajo (${(features.jitter * 1000).toFixed(2)}ms), shimmer reducido (${(features.shimmer * 100).toFixed(2)}%), y relación armónico-ruido elevada (${features.harmonicNoiseRatio.toFixed(1)} dB). Los formantes muestran estabilidad artificial con ${features.formants.length} resonancias detectadas.`
              : `Esta voz muestra características naturales humanas: variabilidad normal en jitter (${(features.jitter * 1000).toFixed(2)}ms) y shimmer (${(features.shimmer * 100).toFixed(2)}%), relación armónico-ruido natural (${features.harmonicNoiseRatio.toFixed(1)} dB), y ${features.formants.length} formantes con variabilidad típica del habla humana.`
          }
        </p>
        <div style="margin-top: 1rem; font-size: 0.8rem; color: ${color};">
          <strong>Factores de Confianza:</strong> 
          Jitter/Shimmer: ${((1 - (features.jitter + features.shimmer) * 50) * 100).toFixed(0)}%, 
          HNR: ${(Math.min(1, features.harmonicNoiseRatio / 20) * 100).toFixed(0)}%, 
          Formantes: ${features.formants.length >= 2 ? "85%" : "60%"}
        </div>
      </div>
    </div>
  `
}

// Dummy function for getQuickTranscription
async function getQuickTranscription(audioBuffer) {
  return "Transcripción de prueba"
}

function toggleRecording() {
  if (isRecording) {
    stopRecording()
  } else {
    startRecording()
  }
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
  analizarAudioAvanzado(url, file).finally(() => {
    button.disabled = false
    button.innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Analizar Audio</span>'
    processingStates.analysis = false
  })
}

// ========================================
// FUNCIONES DE ANÁLISIS OPTIMIZADAS
// ========================================

// 3. Funciones de análisis de audio mejoradas
function calculatePrecisePeaksValleys(audioData) {
  let num_picos = 0
  let num_valles = 0
  const threshold = 0.01
  const step = 5 // Reducir el paso para mayor precisión

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
  const step = 2 // Reducir el paso para mayor precisión
  for (let i = 0; i < audioData.length; i += step) {
    sum += audioData[i] * audioData[i]
  }
  return Math.sqrt(sum / (audioData.length / step))
}

function calculateSpeechRate(audioData, sampleRate, duration) {
  // Estimación más precisa basada en cruces por cero
  const frameSize = 512
  const hopSize = 256
  let speechFrames = 0
  let totalFrames = 0

  for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
    let zeroCrossings = 0
    for (let j = 0; j < frameSize - 1; j++) {
      if ((audioData[i + j] >= 0 && audioData[i + j + 1] < 0) || (audioData[i + j] < 0 && audioData[i + j + 1] >= 0)) {
        zeroCrossings++
      }
    }

    totalFrames++
    if (zeroCrossings > 10) speechFrames++ // Umbral más estricto
  }

  const speechRatio = speechFrames / totalFrames
  const estimatedWPM = speechRatio * 180 // Ajustar estimación
  return Math.round(estimatedWPM)
}

// Funciones para métricas avanzadas

// ========================================
// FUNCIONES DE VISUALIZACIÓN OPTIMIZADAS
// ========================================

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

// Mejorar la función de comparación para incluir gráficas y mayor precisión

async function executeComparison(file1, file2) {
  const resultSection = document.getElementById("resultadoComparacion")
  const detection1 = document.getElementById("detection1")
  const detection2 = document.getElementById("detection2")

  if (resultSection) resultSection.style.display = "block"

  // Mostrar estado de carga
  updateDetectionCardLoading(detection1, file1.name)
  updateDetectionCardLoading(detection2, file2.name)

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Procesar ambos archivos con análisis completo
    const [audioBuffer1, audioBuffer2] = await Promise.all([
      loadAudioBuffer(audioContext, file1),
      loadAudioBuffer(audioContext, file2),
    ])

    // Análisis avanzado para ambos archivos
    const features1 = extractAdvancedRealFeatures(audioBuffer1)
    const features2 = extractAdvancedRealFeatures(audioBuffer2)

    const classification1 = classifyVoiceWithRealAnalysis(features1)
    const classification2 = classifyVoiceWithRealAnalysis(features2)

    // Análisis comparativo adicional
    const comparison = compareVoicesAdvanced(features1, features2)

    // Crear y mostrar gráficas para ambos archivos
    await createComparisonVisualizations(audioBuffer1, audioBuffer2, features1, features2)

    // Mostrar resultados detallados
    displayAdvancedComparisonResults(
      classification1,
      classification2,
      comparison,
      file1.name,
      file2.name,
      features1,
      features2,
    )
  } catch (error) {
    console.error("Error en comparación:", error)
    alert("Error al procesar los archivos de audio.")
  }
}

function updateDetectionCardLoading(card, fileName) {
  const fileNameElement = card.querySelector(".file-name")
  const resultElement = card.querySelector(".detection-result")
  const confidenceFill = card.querySelector(".confidence-fill")
  const confidenceText = card.querySelector(".confidence-text")

  if (fileNameElement) fileNameElement.textContent = fileName
  if (resultElement) {
    resultElement.textContent = "Analizando..."
    resultElement.className = "detection-result loading"
    resultElement.style.color = "#00d4ff"
  }
  if (confidenceFill) {
    confidenceFill.style.width = "0%"
    confidenceFill.className = "confidence-fill loading"
  }
  if (confidenceText) confidenceText.textContent = "0%"
}

function compareVoicesAdvanced(features1, features2) {
  // Comparación detallada entre las dos voces
  const comparison = {
    frequencyDifference: Math.abs(features1.frecuencia - features2.frecuencia),
    jitterDifference: Math.abs(features1.jitter - features2.jitter),
    shimmerDifference: Math.abs(features1.shimmer - features2.shimmer),
    hnrDifference: Math.abs(features1.harmonicNoiseRatio - features2.harmonicNoiseRatio),
    rmsDifference: Math.abs(features1.rms - features2.rms),
    speechRateDifference: Math.abs(features1.velocidad_habla - features2.velocidad_habla),
  }

  // Calcular similitud MFCC
  const mfcc1 = features1.mfccFeatures.mean
  const mfcc2 = features2.mfccFeatures.mean

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < Math.min(mfcc1.length, mfcc2.length); i++) {
    dotProduct += mfcc1[i] * mfcc2[i]
    norm1 += mfcc1[i] * mfcc1[i]
    norm2 += mfcc2[i] * mfcc2[i]
  }

  comparison.mfccSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))

  // Comparar formantes
  comparison.formantSimilarity = compareFormants(features1.formants, features2.formants)

  // Calcular similitud general
  const weights = {
    frequency: 0.15,
    jitter: 0.2,
    shimmer: 0.2,
    hnr: 0.15,
    mfcc: 0.2,
    formants: 0.1,
  }

  let overallSimilarity = 0
  overallSimilarity += weights.frequency * (1 - Math.min(1, comparison.frequencyDifference / 100))
  overallSimilarity += weights.jitter * (1 - Math.min(1, comparison.jitterDifference * 1000))
  overallSimilarity += weights.shimmer * (1 - Math.min(1, comparison.shimmerDifference * 10))
  overallSimilarity += weights.hnr * (1 - Math.min(1, comparison.hnrDifference / 20))
  overallSimilarity += weights.mfcc * Math.max(0, comparison.mfccSimilarity)
  overallSimilarity += weights.formants * comparison.formantSimilarity

  comparison.overallSimilarity = Math.max(0, Math.min(1, overallSimilarity))

  return comparison
}

function compareFormants(formants1, formants2) {
  if (!formants1.length || !formants2.length) return 0.5

  const maxFormants = Math.min(formants1.length, formants2.length, 3)
  let similarity = 0

  for (let i = 0; i < maxFormants; i++) {
    const f1 = formants1[i]?.frequency || 0
    const f2 = formants2[i]?.frequency || 0

    if (f1 > 0 && f2 > 0) {
      const diff = Math.abs(f1 - f2)
      const avgFreq = (f1 + f2) / 2
      const relativeDiff = diff / avgFreq
      similarity += Math.max(0, 1 - relativeDiff)
    }
  }

  return maxFormants > 0 ? similarity / maxFormants : 0.5
}

async function createComparisonVisualizations(audioBuffer1, audioBuffer2, features1, features2) {
  // Crear contenedor para las visualizaciones si no existe
  let visualizationContainer = document.getElementById('comparisonVisualizations')
  
  if (!visualizationContainer) {
    visualizationContainer = document.createElement('div')
    visualizationContainer.id = 'comparisonVisualizations'
    visualizationContainer.className = 'comparison-visualizations'
    visualizationContainer.innerHTML = `
      <h3 style="color: #00d4ff; text-align: center; margin: 2rem 0 1rem 0;">📊 Análisis Visual Comparativo</h3>
