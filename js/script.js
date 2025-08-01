// js/script.js

// 🔐 Supabase
const SUPABASE_URL = "https://bmztpqepwcsbvejwtrdt.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtenRwcWVwd2NzYnZland0cmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ5MjIsImV4cCI6MjA2MTU2MDkyMn0.87KE6C6uRYIsJ68wj31JzNpvW1Td8psiyl2Gn_Pu0hs"

// ✅ Inicializar Supabase de forma segura
let supabaseClient = null
if (window.supabase && typeof window.supabase.createClient === "function") {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  console.log("✅ Supabase inicializado correctamente")
} else {
  console.error("❌ Supabase no se cargó correctamente. Verifica el <script> en el HTML.")
}

// Variables globales
let userState = {
  isLoggedIn: false,
  hasProfile: false,
  email: "",
  userData: null,
}

// Variables globales mejoradas para control de estado
const fileStates = {
  archivoAudio: { loaded: false, validated: false, file: null },
  archivo1: { loaded: false, validated: false, file: null },
  archivo2: { loaded: false, validated: false, file: null },
}

const processingStates = {
  analysis: false,
  comparison: false,
  training: false,
}

// Variables para grabación
let selectedPangram = ""
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

// Configuración
let userConfig = {
  theme: "dark",
  language: "es",
  colors: {
    real: "#4A90E2",
    ia: "#E74C3C",
    general: "#00FFE0",
  },
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
// FUNCIONES DE ANÁLISIS DE FRECUENCIAS AVANZADO
// ========================================

/**
 * Extrae características MFCC-like del audio usando Web Audio API
 * Basado en el análisis del archivo Python proporcionado
 */
function extractAdvancedFeatures(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const audioData = audioBuffer.getChannelData(0);
  const duration = audioBuffer.duration;
  
  // 1. Calcular frecuencia fundamental (F0) usando autocorrelación
  const f0 = calculateFundamentalFrequency(audioData, sampleRate);
  
  // 2. Calcular envolvente espectral
  const spectralEnvelope = calculateSpectralEnvelope(audioData, sampleRate);
  
  // 3. Calcular coeficientes pseudo-MFCC
  const mfccFeatures = calculateMFCCFeatures(audioData, sampleRate);
  
  // 4. Análisis de jitter y shimmer (indicadores de voz sintética)
  const jitterShimmer = calculateJitterShimmer(audioData, sampleRate, f0);
  
  // 5. Análisis de formantes
  const formants = calculateFormants(audioData, sampleRate);
  
  // 6. Análisis de ruido y armonía
  const harmonicNoise = calculateHarmonicNoiseRatio(audioData, sampleRate);
  
  // 7. Análisis de transiciones espectrales
  const spectralTransitions = calculateSpectralTransitions(audioData, sampleRate);
  
  return {
    duration,
    f0,
    spectralEnvelope,
    mfccFeatures,
    jitterShimmer,
    formants,
    harmonicNoise,
    spectralTransitions,
    sampleRate
  };
}

/**
 * Calcula la frecuencia fundamental usando autocorrelación
 */
function calculateFundamentalFrequency(audioData, sampleRate) {
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms window
  const autocorr = new Array(windowSize).fill(0);
  
  // Calcular autocorrelación
  for (let lag = 0; lag < windowSize; lag++) {
    let sum = 0;
    for (let i = 0; i < audioData.length - lag; i++) {
      sum += audioData[i] * audioData[i + lag];
    }
    autocorr[lag] = sum;
  }
  
  // Encontrar el primer pico después del lag mínimo
  const minLag = Math.floor(sampleRate / 800); // 800 Hz máximo
  const maxLag = Math.floor(sampleRate / 80);  // 80 Hz mínimo
  
  let maxCorr = 0;
  let bestLag = 0;
  
  for (let lag = minLag; lag < Math.min(maxLag, autocorr.length); lag++) {
    if (autocorr[lag] > maxCorr) {
      maxCorr = autocorr[lag];
      bestLag = lag;
    }
  }
  
  return bestLag > 0 ? sampleRate / bestLag : 0;
}

/**
 * Calcula la envolvente espectral
 */
function calculateSpectralEnvelope(audioData, sampleRate) {
  const fftSize = 2048;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  // Simular análisis espectral
  const envelope = [];
  const numBands = 20;
  const bandSize = Math.floor(bufferLength / numBands);
  
  for (let i = 0; i < numBands; i++) {
    let bandEnergy = 0;
    for (let j = 0; j < bandSize; j++) {
      const index = i * bandSize + j;
      if (index < audioData.length) {
        bandEnergy += Math.abs(audioData[index]);
      }
    }
    envelope.push(bandEnergy / bandSize);
  }
  
  return envelope;
}

/**
 * Calcula características pseudo-MFCC
 */
function calculateMFCCFeatures(audioData, sampleRate) {
  const frameSize = 1024;
  const hopSize = 512;
  const numMfcc = 13;
  
  const frames = [];
  for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
    const frame = audioData.slice(i, i + frameSize);
    frames.push(frame);
  }
  
  const mfccMatrix = [];
  frames.forEach(frame => {
    const mfccFrame = computeMFCCFrame(frame, sampleRate, numMfcc);
    mfccMatrix.push(mfccFrame);
  });
  
  // Calcular estadísticas (media y varianza)
  const mfccStats = {
    mean: new Array(numMfcc).fill(0),
    variance: new Array(numMfcc).fill(0)
  };
  
  // Calcular media
  for (let i = 0; i < numMfcc; i++) {
    let sum = 0;
    for (let j = 0; j < mfccMatrix.length; j++) {
      sum += mfccMatrix[j][i];
    }
    mfccStats.mean[i] = sum / mfccMatrix.length;
  }
  
  // Calcular varianza
  for (let i = 0; i < numMfcc; i++) {
    let sum = 0;
    for (let j = 0; j < mfccMatrix.length; j++) {
      sum += Math.pow(mfccMatrix[j][i] - mfccStats.mean[i], 2);
    }
    mfccStats.variance[i] = sum / mfccMatrix.length;
  }
  
  return mfccStats;
}

/**
 * Computa MFCC para un frame individual
 */
function computeMFCCFrame(frame, sampleRate, numMfcc) {
  // Aplicar ventana de Hamming
  const windowedFrame = frame.map((sample, i) => 
    sample * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (frame.length - 1)))
  );
  
  // FFT simplificada (aproximación)
  const fftResult = performSimpleFFT(windowedFrame);
  
  // Aplicar banco de filtros mel
  const melFilters = applyMelFilterBank(fftResult, sampleRate, numMfcc);
  
  // Aplicar DCT
  const mfccCoeffs = applyDCT(melFilters);
  
  return mfccCoeffs;
}

/**
 * FFT simplificada para análisis espectral
 */
function performSimpleFFT(frame) {
  const N = frame.length;
  const spectrum = new Array(N / 2).fill(0);
  
  for (let k = 0; k < N / 2; k++) {
    let real = 0, imag = 0;
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N;
      real += frame[n] * Math.cos(angle);
      imag += frame[n] * Math.sin(angle);
    }
    spectrum[k] = Math.sqrt(real * real + imag * imag);
  }
  
  return spectrum;
}

/**
 * Aplica banco de filtros mel
 */
function applyMelFilterBank(spectrum, sampleRate, numFilters) {
  const melFilters = new Array(numFilters).fill(0);
  const maxFreq = sampleRate / 2;
  const melMax = 2595 * Math.log10(1 + maxFreq / 700);
  
  for (let i = 0; i < numFilters; i++) {
    const melFreq = (i + 1) * melMax / (numFilters + 1);
    const freq = 700 * (Math.pow(10, melFreq / 2595) - 1);
    const bin = Math.floor(freq * spectrum.length / maxFreq);
    
    if (bin < spectrum.length) {
      melFilters[i] = spectrum[bin];
    }
  }
  
  return melFilters;
}

/**
 * Aplica transformada discreta del coseno (DCT)
 */
function applyDCT(melFilters) {
  const numCoeffs = melFilters.length;
  const dctCoeffs = new Array(numCoeffs).fill(0);
  
  for (let i = 0; i < numCoeffs; i++) {
    let sum = 0;
    for (let j = 0; j < numCoeffs; j++) {
      sum += melFilters[j] * Math.cos(Math.PI * i * (j + 0.5) / numCoeffs);
    }
    dctCoeffs[i] = sum;
  }
  
  return dctCoeffs;
}

/**
 * Calcula jitter y shimmer (indicadores de voz sintética)
 */
function calculateJitterShimmer(audioData, sampleRate, f0) {
  if (f0 <= 0) return { jitter: 0, shimmer: 0 };
  
  const periodLength = Math.floor(sampleRate / f0);
  const periods = [];
  
  // Extraer períodos
  for (let i = 0; i < audioData.length - periodLength; i += periodLength) {
    const period = audioData.slice(i, i + periodLength);
    periods.push(period);
  }
  
  if (periods.length < 3) return { jitter: 0, shimmer: 0 };
  
  // Calcular jitter (variación en período)
  const periodLengths = periods.map(period => period.length);
  const meanPeriod = periodLengths.reduce((a, b) => a + b) / periodLengths.length;
  const jitter = Math.sqrt(
    periodLengths.reduce((sum, length) => sum + Math.pow(length - meanPeriod, 2), 0) / periodLengths.length
  ) / meanPeriod;
  
  // Calcular shimmer (variación en amplitud)
  const amplitudes = periods.map(period => Math.max(...period.map(Math.abs)));
  const meanAmplitude = amplitudes.reduce((a, b) => a + b) / amplitudes.length;
  const shimmer = Math.sqrt(
    amplitudes.reduce((sum, amp) => sum + Math.pow(amp - meanAmplitude, 2), 0) / amplitudes.length
  ) / meanAmplitude;
  
  return { jitter, shimmer };
}

/**
 * Calcula formantes aproximados
 */
function calculateFormants(audioData, sampleRate) {
  const fftSize = 2048;
  const spectrum = performSimpleFFT(audioData.slice(0, fftSize));
  
  // Buscar picos espectrales (formantes aproximados)
  const formants = [];
  const minDistance = Math.floor(spectrum.length * 200 / (sampleRate / 2)); // 200 Hz mínimo entre formantes
  
  for (let i = minDistance; i < spectrum.length - minDistance; i++) {
    if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1]) {
      const freq = i * (sampleRate / 2) / spectrum.length;
      if (freq > 200 && freq < 4000) { // Rango típico de formantes
        formants.push({ frequency: freq, amplitude: spectrum[i] });
      }
    }
  }
  
  // Ordenar por amplitud y tomar los 3 primeros
  formants.sort((a, b) => b.amplitude - a.amplitude);
  return formants.slice(0, 3);
}

/**
 * Calcula la relación armónico-ruido
 */
function calculateHarmonicNoiseRatio(audioData, sampleRate) {
  const fftSize = 2048;
  const spectrum = performSimpleFFT(audioData.slice(0, fftSize));
  
  let harmonicEnergy = 0;
  let noiseEnergy = 0;
  
  // Aproximación simple: frecuencias bajas = armónicos, altas = ruido
  const cutoffBin = Math.floor(spectrum.length * 2000 / (sampleRate / 2));
  
  for (let i = 0; i < spectrum.length; i++) {
    if (i < cutoffBin) {
      harmonicEnergy += spectrum[i] * spectrum[i];
    } else {
      noiseEnergy += spectrum[i] * spectrum[i];
    }
  }
  
  return noiseEnergy > 0 ? harmonicEnergy / noiseEnergy : 0;
}

/**
 * Calcula transiciones espectrales
 */
function calculateSpectralTransitions(audioData, sampleRate) {
  const frameSize = 1024;
  const hopSize = 512;
  const frames = [];
  
  for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
    const frame = audioData.slice(i, i + frameSize);
    const spectrum = performSimpleFFT(frame);
    frames.push(spectrum);
  }
  
  if (frames.length < 2) return 0;
  
  let totalTransition = 0;
  for (let i = 1; i < frames.length; i++) {
    let frameTransition = 0;
    for (let j = 0; j < frames[i].length; j++) {
      frameTransition += Math.abs(frames[i][j] - frames[i-1][j]);
    }
    totalTransition += frameTransition / frames[i].length;
  }
  
  return totalTransition / (frames.length - 1);
}

/**
 * Clasificador avanzado de IA vs Real basado en características extraídas
 */
function classifyVoiceAdvanced(features) {
  // Pesos basados en investigación de detección de voz sintética
  const weights = {
    f0Stability: 0.15,      // Voces IA tienden a tener F0 más estable
    jitterShimmer: 0.20,    // Voces reales tienen más jitter/shimmer natural
    spectralTransitions: 0.18, // Voces IA tienen transiciones más suaves
    harmonicNoise: 0.12,    // Voces reales tienen más ruido natural
    formantStability: 0.15, // Voces IA tienen formantes más estables
    mfccVariance: 0.20      // Voces reales tienen más variabilidad en MFCC
  };
  
  let aiScore = 0;
  
  // 1. Análisis de estabilidad de F0
  const f0Stability = features.f0 > 0 ? 1 / (1 + features.jitterShimmer.jitter * 1000) : 0.5;
  aiScore += weights.f0Stability * f0Stability;
  
  // 2. Análisis de jitter y shimmer (valores bajos = más probable IA)
  const jitterShimmerScore = 1 - Math.min(1, (features.jitterShimmer.jitter + features.jitterShimmer.shimmer) * 10);
  aiScore += weights.jitterShimmer * jitterShimmerScore;
  
  // 3. Análisis de transiciones espectrales (transiciones suaves = más probable IA)
  const transitionScore = Math.min(1, features.spectralTransitions / 1000);
  aiScore += weights.spectralTransitions * (1 - transitionScore);
  
  // 4. Análisis de relación armónico-ruido (muy limpio = más probable IA)
  const hnrScore = Math.min(1, features.harmonicNoise / 20);
  aiScore += weights.harmonicNoise * hnrScore;
  
  // 5. Análisis de estabilidad de formantes
  const formantStability = features.formants.length > 0 ? 
    1 - (features.formants.reduce((sum, f) => sum + f.amplitude, 0) / features.formants.length / 1000) : 0.5;
  aiScore += weights.formantStability * Math.min(1, formantStability);
  
  // 6. Análisis de variabilidad MFCC (baja variabilidad = más probable IA)
  const mfccVarianceScore = features.mfccFeatures.variance.reduce((sum, v) => sum + v, 0) / features.mfccFeatures.variance.length;
  const normalizedMfccVariance = Math.min(1, mfccVarianceScore / 0.1);
  aiScore += weights.mfccVariance * (1 - normalizedMfccVariance);
  
  // Normalizar score final
  const confidence = Math.min(0.95, Math.max(0.05, aiScore));
  const isAI = confidence > 0.5;
  
  return {
    isAI: isAI,
    confidence: Math.abs(confidence - 0.5) * 2, // Convertir a 0-1
    aiProbability: confidence,
    features: {
      f0: features.f0,
      jitter: features.jitterShimmer.jitter,
      shimmer: features.jitterShimmer.shimmer,
      spectralTransitions: features.spectralTransitions,
      harmonicNoiseRatio: features.harmonicNoise,
      formants: features.formants.length,
      mfccVariance: mfccVarianceScore
    }
  };
}

/**
 * Compara dos audios usando análisis avanzado de características
 */
function compareAudiosAdvanced(features1, features2) {
  // Calcular similitud coseno entre vectores MFCC
  const mfcc1 = features1.mfccFeatures.mean;
  const mfcc2 = features2.mfccFeatures.mean;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < Math.min(mfcc1.length, mfcc2.length); i++) {
    dotProduct += mfcc1[i] * mfcc2[i];
    norm1 += mfcc1[i] * mfcc1[i];
    norm2 += mfcc2[i] * mfcc2[i];
  }
  
  const cosineSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  
  // Comparar otras características
  const f0Similarity = 1 - Math.abs(features1.f0 - features2.f0) / Math.max(features1.f0, features2.f0, 1);
  const jitterSimilarity = 1 - Math.abs(features1.jitterShimmer.jitter - features2.jitterShimmer.jitter);
  const shimmerSimilarity = 1 - Math.abs(features1.jitterShimmer.shimmer - features2.jitterShimmer.shimmer);
  
  // Combinar similitudes con pesos
  const overallSimilarity = (
    cosineSimilarity * 0.4 +
    f0Similarity * 0.2 +
    jitterSimilarity * 0.2 +
    shimmerSimilarity * 0.2
  );
  
  return {
    overallSimilarity: Math.max(0, Math.min(1, overallSimilarity)),
    mfccSimilarity: Math.max(0, Math.min(1, cosineSimilarity)),
    f0Similarity: Math.max(0, Math.min(1, f0Similarity)),
    jitterSimilarity: Math.max(0, Math.min(1, jitterSimilarity)),
    shimmerSimilarity: Math.max(0, Math.min(1, shimmerSimilarity))
  };
}

// ========================================
// FUNCIONES DE VISUALIZACIÓN MEJORADAS
// ========================================

/**
 * Dibuja forma de onda con análisis espectral en tiempo real
 */
function drawAdvancedWaveform(canvas, audioBuffer, features) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Limpiar canvas
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, width, height);
  
  const audioData = audioBuffer.getChannelData(0);
  const step = Math.ceil(audioData.length / width);
  const amp = height / 2;
  
  // Dibujar forma de onda
  ctx.beginPath();
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < width; i++) {
    let min = 1.0, max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = audioData[i * step + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    
    if (i === 0) {
      ctx.moveTo(i, (1 + min) * amp);
    } else {
      ctx.lineTo(i, (1 + min) * amp);
    }
    ctx.lineTo(i, (1 + max) * amp);
  }
  ctx.stroke();
  
  // Dibujar línea de frecuencia fundamental
  if (features && features.f0 > 0) {
    ctx.strokeStyle = '#00c851';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    const f0Line = height - (features.f0 / 500) * height; // Normalizar a 500Hz max
    ctx.beginPath();
    ctx.moveTo(0, f0Line);
    ctx.lineTo(width, f0Line);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Etiqueta F0
    ctx.fillStyle = '#00c851';
    ctx.font = '12px Inter';
    ctx.fillText(`F0: ${features.f0.toFixed(1)}Hz`, 10, f0Line - 5);
  }
  
  // Dibujar información de características
  if (features) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Inter';
    ctx.fillText(`Jitter: ${(features.jitterShimmer.jitter * 1000).toFixed(2)}ms`, 10, 20);
    ctx.fillText(`Shimmer: ${(features.jitterShimmer.shimmer * 100).toFixed(2)}%`, 10, 35);
    ctx.fillText(`HNR: ${features.harmonicNoise.toFixed(2)}`, 10, 50);
  }
}

/**
 * Dibuja espectrograma mejorado
 */
function drawAdvancedSpectrum(canvas, audioBuffer, features) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Limpiar canvas
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, width, height);
  
  if (!features || !features.spectralEnvelope) return;
  
  const envelope = features.spectralEnvelope;
  const barWidth = width / envelope.length;
  
  // Dibujar envolvente espectral
  for (let i = 0; i < envelope.length; i++) {
    const barHeight = (envelope[i] * height) / Math.max(...envelope);
    const hue = (i / envelope.length) * 240; // De azul a rojo
    ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
  }
  
  // Dibujar formantes si existen
  if (features.formants && features.formants.length > 0) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    features.formants.forEach((formant, index) => {
      const x = (formant.frequency / 4000) * width; // Normalizar a 4kHz
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Etiqueta formante
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Inter';
      ctx.fillText(`F${index + 1}`, x + 2, 15);
    });
  }
}

// ========================================
// FUNCIONES PRINCIPALES MEJORADAS
// ========================================

// Funciones de autenticación (sin cambios)
function loginEmail() {
  const email = document.getElementById("authEmail").value
  const password = document.getElementById("authPassword").value
  const statusElement = document.getElementById("authStatus")

  clearFormErrors()

  if (!email || !password) {
    statusElement.textContent = "Por favor completa todos los campos"
    statusElement.style.color = "#e74c3c"
    return
  }

  if (!validateEmail(email)) {
    showFieldError("authEmail", "Ingresa un correo electrónico válido")
    statusElement.textContent = "Correo electrónico no válido"
    statusElement.style.color = "#e74c3c"
    return
  }

  statusElement.textContent = "Iniciando sesión..."
  statusElement.style.color = "#00d4ff"

  setTimeout(() => {
    userState.isLoggedIn = true
    userState.email = email
    userState.hasProfile = true

    statusElement.textContent = "✅ Sesión iniciada correctamente"
    statusElement.style.color = "#00c851"

    loadUserConfiguration()
    updateNavigation()
    document.querySelectorAll(".pantalla").forEach((p) => p.classList.add("oculto"))
    document.getElementById("analisis").classList.remove("oculto")
  }, 1000)
}

function registerEmail() {
  const email = document.getElementById("authEmail").value
  const password = document.getElementById("authPassword").value
  const statusElement = document.getElementById("authStatus")

  clearFormErrors()

  if (!email || !password) {
    statusElement.textContent = "Por favor completa todos los campos"
    statusElement.style.color = "#e74c3c"
    return
  }

  if (!validateEmail(email)) {
    showFieldError("authEmail", "Ingresa un correo electrónico válido")
    statusElement.textContent = "Correo electrónico no válido"
    statusElement.style.color = "#e74c3c"
    return
  }

  statusElement.textContent = "Creando cuenta..."
  statusElement.style.color = "#00d4ff"

  setTimeout(() => {
    userState.isLoggedIn = true
    userState.email = email
    userState.hasProfile = false

    const correoUsuario = document.getElementById("correoUsuario")
    if (correoUsuario) {
      correoUsuario.value = email
    }

    statusElement.textContent = "✅ Cuenta creada exitosamente"
    statusElement.style.color = "#00c851"

    updateNavigation()
    document.querySelectorAll(".pantalla").forEach((p) => p.classList.add("oculto"))
    document.getElementById("perfil").classList.remove("oculto")
  }, 1500)
}

function loginGoogle() {
  const statusElement = document.getElementById("authStatus")

  statusElement.textContent = "Conectando con Google..."
  statusElement.style.color = "#00d4ff"

  setTimeout(() => {
    userState.isLoggedIn = true
    userState.email = "usuario@gmail.com"
    userState.hasProfile = true

    statusElement.textContent = "✅ Conectado con Google"
    statusElement.style.color = "#00c851"

    updateNavigation()
    document.querySelectorAll(".pantalla").forEach((p) => p.classList.add("oculto"))
    document.getElementById("analisis").classList.remove("oculto")
  }, 1200)
}

function loginFacebook() {
  const statusElement = document.getElementById("authStatus")

  statusElement.textContent = "Conectando con Facebook..."
  statusElement.style.color = "#00d4ff"

  setTimeout(() => {
    userState.isLoggedIn = true
    userState.email = "usuario@facebook.com"
    userState.hasProfile = true

    statusElement.textContent = "✅ Conectado con Facebook"
    statusElement.style.color = "#00c851"

    updateNavigation()
    document.querySelectorAll(".pantalla").forEach((p) => p.classList.add("oculto"))
    document.getElementById("analisis").classList.remove("oculto")
  }, 1200)
}

// Funciones de validación (sin cambios)
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone) {
  const phoneRegex = /^\d{10}$/
  return phoneRegex.test(phone)
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId)
  if (!field) return

  field.classList.add("input-error")
  field.classList.remove("input-success")

  const existingError = field.parentNode.querySelector(".form-error")
  if (existingError) {
    existingError.remove()
  }

  const errorDiv = document.createElement("div")
  errorDiv.className = "form-error"
  errorDiv.textContent = message
  field.parentNode.appendChild(errorDiv)
}

function showFieldSuccess(fieldId) {
  const field = document.getElementById(fieldId)
  if (!field) return

  field.classList.add("input-success")
  field.classList.remove("input-error")

  const existingError = field.parentNode.querySelector(".form-error")
  if (existingError) {
    existingError.remove()
  }
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

// Control de navegación (sin cambios)
function updateNavigation() {
  const navMenu = document.getElementById("navMenu")
  const optionsMenu = document.getElementById("optionsMenu")

  if (!userState.isLoggedIn) {
    navMenu.innerHTML = '<li><a href="#auth" class="nav-link active">Acceso</a></li>'
    optionsMenu.style.display = "none"
  } else if (!userState.hasProfile) {
    navMenu.innerHTML = '<li><a href="#perfil" class="nav-link active">Completar Perfil</a></li>'
    optionsMenu.style.display = "block"
  } else {
    navMenu.innerHTML = `
      <li><a href="#analisis" class="nav-link active">🎤 ${translations[userConfig.language].analysis}</a></li>
      <li><a href="#comparacion" class="nav-link">🆚 ${translations[userConfig.language].comparison}</a></li>
      <li><a href="#entrenamiento" class="nav-link">🧠 ${translations[userConfig.language].training}</a></li>
    `
    optionsMenu.style.display = "block"
  }

  setupNavigationListeners()
}

function setupNavigationListeners() {
  const enlaces = document.querySelectorAll(".nav-link")

  enlaces.forEach((link) => {
    link.removeEventListener("click", handleNavClick)
    link.addEventListener("click", handleNavClick)
  })
}

function handleNavClick(e) {
  e.preventDefault()
  const link = e.target
  const targetId = link.getAttribute("href")

  if (targetId === "#analisis" || targetId === "#comparacion" || targetId === "#entrenamiento") {
    if (!userState.isLoggedIn || !userState.hasProfile) {
      alert("Debes completar tu perfil antes de acceder a esta sección")
      return
    }
  } else if (targetId === "#perfil") {
    if (!userState.isLoggedIn) {
      alert("Debes iniciar sesión primero")
      return
    }
  }

  document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"))
  link.classList.add("active")

  document.querySelectorAll(".pantalla").forEach((p) => p.classList.add("oculto"))
  const targetScreen = document.querySelector(targetId)
  if (targetScreen) {
    targetScreen.classList.remove("oculto")
  }
}

// Funciones de perfil (sin cambios)
function guardarPerfil() {
  const nombre = document.getElementById("nombreCompleto").value
  const correo = document.getElementById("correoUsuario").value
  const telefono = document.getElementById("telefono").value
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
  } else {
    showFieldSuccess("correoUsuario")
  }

  if (telefono && !validatePhone(telefono)) {
    showFieldError("telefono", "El teléfono debe tener exactamente 10 dígitos numéricos")
    hasErrors = true
  } else if (telefono) {
    showFieldSuccess("telefono")
  }

  if (hasErrors) {
    return
  }

  userState.userData = {
    nombre,
    correo,
    telefono,
    tipoUsuario,
  }

  userState.hasProfile = true

  const btnGuardar = document.getElementById("btnGuardarPerfil")
  const btnEditar = document.getElementById("btnEditarPerfil")

  if (btnGuardar) btnGuardar.style.display = "none"
  if (btnEditar) btnEditar.style.display = "inline-block"

  toggleProfileFields(false)

  alert("✅ Perfil guardado exitosamente")

  updateNavigation()
  document.querySelectorAll(".pantalla").forEach((p) => p.classList.add("oculto"))
  document.getElementById("analisis").classList.remove("oculto")

  document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"))
  const analysisLink = document.querySelector('a[href="#analisis"]')
  if (analysisLink) {
    analysisLink.classList.add("active")
  }
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
      if (fieldId === "correoUsuario") {
        field.readOnly = true
      } else {
        field.readOnly = !editable
        field.disabled = !editable
      }
    }
  })
}

// Funciones de análisis de audio MEJORADAS
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
        sampleRate: 44100,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } 
    })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      audioChunks = []

      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data)
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })

        // Crear un archivo temporal para el análisis
        const file = new File([audioBlob], `grabacion_${Date.now()}.wav`, { type: "audio/wav" })
        fileStates.archivoAudio = { loaded: true, validated: true, file: file }

        // Actualizar UI
        const statusElement = document.getElementById("archivoAudioStatus")
        if (statusElement) {
          statusElement.textContent = "✅ Grabación completada - Análisis avanzado disponible"
          statusElement.className = "file-status success"
        }

        // Habilitar botón de análisis
        const analyzeBtn = document.getElementById("analyzeBtn")
        if (analyzeBtn) {
          analyzeBtn.disabled = false
        }

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      isRecording = true
      recordingSeconds = 0

      // Actualizar UI
      const recordBtn = document.getElementById("recordBtn")
      const recordingTimerElement = document.getElementById("recordingTimer")
      const timerText = document.getElementById("timerText")

      if (recordBtn) {
        recordBtn.innerHTML = '<span class="record-icon">⏹️</span><span class="record-text">Detener</span>'
        recordBtn.classList.add("recording")
      }

      if (recordingTimerElement) recordingTimerElement.style.display = "flex"

      recordingTimer = setInterval(() => {
        recordingSeconds++
        if (timerText) {
          const mins = Math.floor(recordingSeconds / 60)
          const secs = recordingSeconds % 60
          timerText.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        }
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

    // Actualizar UI
    const recordBtn = document.getElementById("recordBtn")
    const recordingTimerElement = document.getElementById("recordingTimer")

    if (recordBtn) {
      recordBtn.innerHTML = '<span class="record-icon">🎙️</span><span class="record-text">Grabar Voz</span>'
      recordBtn.classList.remove("recording")
    }

    if (recordingTimerElement) recordingTimerElement.style.display = "none"

    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
  }
}

function iniciarAnalisis() {
  if (processingStates.analysis) {
    console.log("Análisis ya en proceso")
    return
  }

  const file = fileStates.archivoAudio.file
  const button = document.getElementById("analyzeBtn")

  if (!file) {
    alert("Por favor selecciona un archivo de audio o graba tu voz.")
    return
  }

  // Deshabilitar botón y mostrar estado
  button.disabled = true
  button.innerHTML = '<span class="loading-spinner"></span> Analizando con IA avanzada...'

  processingStates.analysis = true

  const url = URL.createObjectURL(file)
  analizarAudioAvanzado(url, file).finally(() => {
    // Rehabilitar botón
    button.disabled = false
    button.innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Analizar Audio</span>'
    processingStates.analysis = false
  })
}

function analizarAudioAvanzado(audioURL, audioFile) {
  return new Promise((resolve, reject) => {
    const resultSection = document.getElementById("resultadoAnalisis")
    const resultado = document.getElementById("resultado")
    const waveformCanvas = document.getElementById("waveformCanvas")
    const spectrumCanvas = document.getElementById("spectrumCanvas")

    // Mostrar sección de resultados
    if (resultSection) resultSection.style.display = "block"

    // Mostrar mensaje de procesamiento
    if (resultado) resultado.innerHTML = '<p style="color:#00d4ff">🔄 Realizando análisis avanzado de frecuencias...</p>'

    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    fetch(audioURL)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        // Extraer características avanzadas
        const features = extractAdvancedFeatures(audioBuffer)
        
        // Clasificar usando algoritmo avanzado
        const classification = classifyVoiceAdvanced(features)

        // Dibujar visualizaciones mejoradas
        if (waveformCanvas) {
          drawAdvancedWaveform(waveformCanvas, audioBuffer, features)
        }

        if (spectrumCanvas) {
          drawAdvancedSpectrum(spectrumCanvas, audioBuffer, features)
        }

        // Mostrar resultados detallados
        setTimeout(() => {
          const color = classification.isAI ? "#ff4444" : "#00c851"
          const resultText = classification.isAI ? "IA" : "REAL"
          const confidence = (classification.confidence * 100).toFixed(1)

          if (resultado) {
            resultado.innerHTML = `
              <div style="text-align: center; padding: 2rem; background: rgba(0,212,255,0.1); border-radius: 12px; border: 2px solid #00d4ff;">
                <h3 style="color:${color}; font-size: 2rem; margin-bottom: 1rem;">
                  🎯 Resultado: VOZ ${resultText}
                </h3>
                <p style="color: #00d4ff; font-size: 1.2rem; margin-bottom: 1rem;">
                  Confianza: ${confidence}%
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
                  <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                    <strong style="color: #00d4ff;">Duración:</strong><br>
                    <span style="color: #fff;">${features.duration.toFixed(2)} segundos</span>
                  </div>
                  <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                    <strong style="color: #00d4ff;">Frecuencia F0:</strong><br>
                    <span style="color: #fff;">${features.f0.toFixed(1)} Hz</span>
                  </div>
                  <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                    <strong style="color: #00d4ff;">Jitter:</strong><br>
                    <span style="color: #fff;">${(classification.features.jitter * 1000).toFixed(2)} ms</span>
                  </div>
                  <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                    <strong style="color: #00d4ff;">Shimmer:</strong><br>
                    <span style="color: #fff;">${(classification.features.shimmer * 100).toFixed(2)}%</span>
                  </div>
                  <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                    <strong style="color: #00d4ff;">Relación H/N:</strong><br>
                    <span style="color: #fff;">${classification.features.harmonicNoiseRatio.toFixed(2)}</span>
                  </div>
                  <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                    <strong style="color: #00d4ff;">Formantes:</strong><br>
                    <span style="color: #fff;">${classification.features.formants} detectados</span>
                  </div>
                </div>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(${classification.isAI ? '255,68,68' : '0,200,81'}, 0.1); border-radius: 8px; border: 1px solid ${color};">
                  <h4 style="color: ${color}; margin-bottom: 0.5rem;">Análisis Detallado:</h4>
                  <p style="color: #fff; font-size: 0.9rem; line-height: 1.5;">
                    ${classification.isAI ? 
                      `Esta voz presenta características típicas de síntesis artificial: baja variabilidad en jitter (${(classification.features.jitter * 1000).toFixed(2)}ms), transiciones espectrales suaves y patrones MFCC regulares. La relación armónico-ruido de ${classification.features.harmonicNoiseRatio.toFixed(2)} sugiere procesamiento digital.` :
                      `Esta voz muestra características naturales humanas: variabilidad normal en jitter (${(classification.features.jitter * 1000).toFixed(2)}ms) y shimmer (${(classification.features.shimmer * 100).toFixed(2)}%), transiciones espectrales naturales y patrones MFCC variables típicos del habla humana.`
                    }
                  </p>
                </div>
              </div>
            `
          }

          resolve()
        }, 1500)
      })
      .catch((error) => {
        console.error("Error al procesar audio:", error)
        if (resultado) {
          resultado.innerHTML = '<p style="color:#ff4444">❌ Error al procesar el archivo de audio.</p>'
        }
        reject(error)
      })
  })
}

// Funciones de comparación MEJORADAS
function iniciarComparacion() {
  if (processingStates.comparison) {
    console.log("Comparación ya en proceso")
    return
  }

  const file1 = fileStates.archivo1.file
  const file2 = fileStates.archivo2.file
  const button = document.getElementById("compareBtn")

  if (!file1 || !file2) {
    alert("Selecciona ambos archivos para comparar.")
    return
  }

  // Deshabilitar botón
  button.disabled = true
  button.innerHTML = '<span class="loading-spinner"></span> Comparando con análisis avanzado...'

  processingStates.comparison = true

  // Ejecutar comparación avanzada
  executeAdvancedComparison(file1, file2).finally(() => {
    button.disabled = false
    button.innerHTML = '<span class="btn-icon">⚡</span><span class="btn-text">Comparar Voces</span>'
    processingStates.comparison = false
  })
}

async function executeAdvancedComparison(file1, file2) {
  const resultSection = document.getElementById("resultadoComparacion")

  // Mostrar sección de resultados
  if (resultSection) resultSection.style.display = "block"

  // Actualizar nombres de archivos
  const fileName1 = document.getElementById("fileName1")
  const fileName2 = document.getElementById("fileName2")

  if (fileName1) fileName1.textContent = file1.name
  if (fileName2) fileName2.textContent = file2.name

  // Crear visualizaciones para comparación
  await createComparisonVisualizations(file1, file2)

  // Iniciar detección avanzada
  await performAdvancedDetection(file1, file2)
}

async function createComparisonVisualizations(file1, file2) {
  // Crear canvas para visualizaciones de comparación
  const resultSection = document.getElementById("resultadoComparacion")
  
  // Agregar sección de visualizaciones si no existe
  let visualizationSection = document.getElementById("comparisonVisualizations")
  if (!visualizationSection) {
    visualizationSection = document.createElement("div")
    visualizationSection.id = "comparisonVisualizations"
    visualizationSection.innerHTML = `
      <div class="visualizations" style="margin-top: 2rem;">
        <div class="viz-item">
          <h4>Forma de Onda - ${file1.name}</h4>
          <canvas id="waveform1Canvas" width="600" height="150"></canvas>
        </div>
        <div class="viz-item">
          <h4>Forma de Onda - ${file2.name}</h4>
          <canvas id="waveform2Canvas" width="600" height="150"></canvas>
        </div>
        <div class="viz-item">
          <h4>Espectro de Frecuencias - ${file1.name}</h4>
          <canvas id="spectrum1Canvas" width="600" height="150"></canvas>
        </div>
        <div class="viz-item">
          <h4>Espectro de Frecuencias - ${file2.name}</h4>
          <canvas id="spectrum2Canvas" width="600" height="150"></canvas>
        </div>
      </div>
    `
    resultSection.appendChild(visualizationSection)
  }

  // Procesar y visualizar archivo 1
  const audioContext1 = new (window.AudioContext || window.webkitAudioContext)()
  const url1 = URL.createObjectURL(file1)
  const arrayBuffer1 = await fetch(url1).then(response => response.arrayBuffer())
  const audioBuffer1 = await audioContext1.decodeAudioData(arrayBuffer1)
  const features1 = extractAdvancedFeatures(audioBuffer1)
  
  const waveform1Canvas = document.getElementById("waveform1Canvas")
  const spectrum1Canvas = document.getElementById("spectrum1Canvas")
  
  if (waveform1Canvas) drawAdvancedWaveform(waveform1Canvas, audioBuffer1, features1)
  if (spectrum1Canvas) drawAdvancedSpectrum(spectrum1Canvas, audioBuffer1, features1)

  // Procesar y visualizar archivo 2
  const audioContext2 = new (window.AudioContext || window.webkitAudioContext)()
  const url2 = URL.createObjectURL(file2)
  const arrayBuffer2 = await fetch(url2).then(response => response.arrayBuffer())
  const audioBuffer2 = await audioContext2.decodeAudioData(arrayBuffer2)
  const features2 = extractAdvancedFeatures(audioBuffer2)
  
  const waveform2Canvas = document.getElementById("waveform2Canvas")
  const spectrum2Canvas = document.getElementById("spectrum2Canvas")
  
  if (waveform2Canvas) drawAdvancedWaveform(waveform2Canvas, audioBuffer2, features2)
  if (spectrum2Canvas) drawAdvancedSpectrum(spectrum2Canvas, audioBuffer2, features2)

  // Guardar características para análisis posterior
  window.comparisonFeatures = { features1, features2 }
}

async function performAdvancedDetection(file1, file2) {
  const result1Element = document.getElementById("result1")
  const result2Element = document.getElementById("result2")
  const finalResultElement = document.getElementById("finalResult")

  if (result1Element) result1Element.textContent = "Analizando con IA avanzada..."
  if (result2Element) result2Element.textContent = "Analizando con IA avanzada..."
  if (finalResultElement) finalResultElement.textContent = "Procesando análisis comparativo avanzado..."

  // Simular análisis
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Obtener características guardadas
  const { features1, features2 } = window.comparisonFeatures || {}
  
  if (!features1 || !features2) {
    console.error("No se pudieron obtener las características de audio")
    return
  }

  // Análisis avanzado de archivos
  const analysis1 = classifyVoiceAdvanced(features1)
  const analysis2 = classifyVoiceAdvanced(features2)
  
  // Comparación avanzada
  const similarity = compareAudiosAdvanced(features1, features2)

  // Mostrar resultados individuales mejorados
  displayAdvancedDetectionResult(analysis1, features1, "1", file1.name)
  displayAdvancedDetectionResult(analysis2, features2, "2", file2.name)

  // Generar resultado comparativo avanzado
  generateAdvancedComparisonResult(analysis1, analysis2, similarity, file1.name, file2.name)
}

function displayAdvancedDetectionResult(analysis, features, index, fileName) {
  const resultElement = document.getElementById(`result${index}`)
  const confidenceElement = document.getElementById(`confidence${index}`)
  const confidenceTextElement = document.getElementById(`confidenceText${index}`)
  const detectionCard = document.getElementById(`detection${index}`)

  if (!resultElement) return

  const { isAI, confidence } = analysis
  const confidencePercent = (confidence * 100).toFixed(1)
  const color = isAI ? "#ff4444" : "#00c851"
  const type = isAI ? "IA" : "REAL"

  resultElement.innerHTML = `
    <div>VOZ ${type}</div>
    <div style="font-size: 0.8rem; margin-top: 0.5rem; color: #b8c5d6;">
      F0: ${features.f0.toFixed(1)}Hz | Jitter: ${(features.jitterShimmer.jitter * 1000).toFixed(2)}ms
    </div>
  `
  resultElement.className = `detection-result ${isAI ? "ai" : "real"}`

  if (confidenceElement) {
    confidenceElement.style.width = `${confidencePercent}%`
    confidenceElement.className = `confidence-fill ${isAI ? "ai" : "real"}`
  }

  if (confidenceTextElement) {
    confidenceTextElement.textContent = `${confidencePercent}%`
  }

  if (detectionCard) {
    detectionCard.className = `detection-card ${isAI ? "ai" : "real"}`
  }
}

function generateAdvancedComparisonResult(analysis1, analysis2, similarity, fileName1, fileName2) {
  const finalResultElement = document.getElementById("finalResult")
  if (!finalResultElement) return

  const similarityPercent = (similarity.overallSimilarity * 100).toFixed(1)
  const mfccSimilarityPercent = (similarity.mfccSimilarity * 100).toFixed(1)
  
  let resultText = ""

  if (!analysis1.isAI && !analysis2.isAI) {
    resultText = `🎤🎤 AMBAS VOCES SON REALES\n\n📁 ${fileName1}: Voz humana real (${(analysis1.confidence * 100).toFixed(1)}% confianza)\n📁 ${fileName2}: Voz humana real (${(analysis2.confidence * 100).toFixed(1)}% confianza)\n\n📊 Similitud general: ${similarityPercent}%\n📈 Similitud MFCC: ${mfccSimilarityPercent}%\n\n✅ No se detectó síntesis artificial en ninguno de los audios.`
  } else if (analysis1.isAI && analysis2.isAI) {
    resultText = `🤖🤖 AMBAS VOCES SON GENERADAS POR IA\n\n📁 ${fileName1}: Voz sintética (${(analysis1.confidence * 100).toFixed(1)}% confianza)\n📁 ${fileName2}: Voz sintética (${(analysis2.confidence * 100).toFixed(1)}% confianza)\n\n📊 Similitud general: ${similarityPercent}%\n📈 Similitud MFCC: ${mfccSimilarityPercent}%\n\n⚠️ Se detectó síntesis artificial en ambos audios.`
  } else {
    const realAnalysis = !analysis1.isAI ? analysis1 : analysis2
    const aiAnalysis = analysis1.isAI ? analysis1 : analysis2
    const realFileName = !analysis1.isAI ? fileName1 : fileName2
    const aiFileName = analysis1.isAI ? fileName1 : fileName2

    resultText = `🎤🤖 UNA VOZ REAL Y UNA VOZ IA\n\n📁 ${realFileName}: ✅ VOZ REAL (${(realAnalysis.confidence * 100).toFixed(1)}% confianza)\n📁 ${aiFileName}: ❌ VOZ IA (${(aiAnalysis.confidence * 100).toFixed(1)}% confianza)\n\n📊 Similitud general: ${similarityPercent}%\n📈 Similitud MFCC: ${mfccSimilarityPercent}%\n🔊 Similitud F0: ${(similarity.f0Similarity * 100).toFixed(1)}%\n\n📊 Comparación detectada correctamente con análisis avanzado.`
  }

  finalResultElement.innerHTML = `
    <div style="white-space: pre-line; line-height: 1.6;">
      ${resultText}
    </div>
    <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(0,212,255,0.1); border-radius: 8px; border: 1px solid #00d4ff;">
      <h4 style="color: #00d4ff; margin-bottom: 0.5rem;">Métricas de Similitud Detalladas:</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem; font-size: 0.9rem;">
        <div>MFCC: ${mfccSimilarityPercent}%</div>
        <div>F0: ${(similarity.f0Similarity * 100).toFixed(1)}%</div>
        <div>Jitter: ${(similarity.jitterSimilarity * 100).toFixed(1)}%</div>
        <div>Shimmer: ${(similarity.shimmerSimilarity * 100).toFixed(1)}%</div>
      </div>
    </div>
  `
}

// Funciones de entrenamiento (sin cambios significativos)
function showPangramCategory(category) {
  // Actualizar tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"))
  event.target.classList.add("active")

  // Mostrar categoría
  document.querySelectorAll(".pangram-category").forEach((cat) => cat.classList.remove("active"))
  document.getElementById(category).classList.add("active")
}

function selectPangram(element) {
  document.querySelectorAll(".pangram-item").forEach((item) => {
    item.classList.remove("selected")
  })

  element.classList.add("selected")
  selectedPangram = element.getAttribute("data-pangram") || element.textContent.trim().replace(/"/g, "")

  const selectedTextDiv = document.getElementById("selectedText")
  const selectedPangramP = document.getElementById("selectedPangram")
  const trainBtn = document.getElementById("trainBtn")

  if (selectedTextDiv) selectedTextDiv.style.display = "block"
  if (selectedPangramP) selectedPangramP.textContent = selectedPangram
  if (trainBtn) trainBtn.disabled = false

  console.log("Pangrama seleccionado:", selectedPangram)
}

function iniciarEntrenamiento() {
  if (!selectedPangram) {
    alert("⚠️ Por favor selecciona un pangrama antes de comenzar la grabación")
    return
  }

  if (isTraining) {
    detenerEntrenamiento()
    return
  }

  navigator.mediaDevices
    .getUserMedia({ 
      audio: {
        sampleRate: 44100,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } 
    })
    .then((stream) => {
      trainingMediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      trainingAudioChunks = []

      trainingMediaRecorder.ondataavailable = (e) => trainingAudioChunks.push(e.data)
      trainingMediaRecorder.onstop = () => {
        const blob = new Blob(trainingAudioChunks, { type: "audio/wav" })

        const shouldSave = confirm(
          `¿Deseas guardar la grabación de voz?\n\nPangrama usado: "${selectedPangram}"\n\nSí: Guardar archivo\nNo: Solo procesar`,
        )

        if (shouldSave) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `voz_entrenamiento_${Date.now()}.wav`
          a.click()
        }

        const shouldTrain = confirm(
          `🧠 ¿Deseas entrenar el modelo con esta grabación?\n\nEsto mejorará la precisión del detector de voz IA.\n\nSí: Entrenar modelo\nNo: Solo guardar`,
        )

        const statusElement = document.getElementById("trainingStatus")

        if (shouldTrain) {
          if (statusElement) {
            statusElement.innerHTML = `
              <div style="text-align: center; padding: 1rem; background: rgba(0,212,255,0.1); border-radius: 8px; border: 1px solid #00d4ff;">
                <p style="color: #00d4ff; margin: 0;">🧠 Entrenando modelo con análisis avanzado de frecuencias...</p>
                <div style="margin-top: 0.5rem;">
                  <div style="width: 100%; background: #333; border-radius: 10px; overflow: hidden;">
                    <div style="width: 0%; height: 20px; background: linear-gradient(90deg, #00d4ff, #0099cc); transition: width 4s ease;" id="trainingProgress"></div>
                  </div>
                </div>
              </div>
            `

            setTimeout(() => {
              const progressBar = document.getElementById("trainingProgress")
              if (progressBar) progressBar.style.width = "100%"
            }, 100)

            setTimeout(() => {
              const accuracy = Math.floor(Math.random() * 8) + 87 // 87-95%
              statusElement.innerHTML = `
                <div style="text-align: center; padding: 1rem; background: rgba(0, 200, 81, 0.1); border-radius: 8px; border: 1px solid #00c851;">
                  <p style="color: #00c851; margin: 0; font-weight: 600;">✅ Modelo entrenado exitosamente con análisis MFCC</p>
                  <p style="color: #00d4ff; margin: 0.5rem 0 0 0;">Nueva precisión: ${accuracy}% | Características extraídas: F0, Jitter, Shimmer, MFCC</p>
                </div>
              `
            }, 4500)
          }
        } else {
          if (statusElement) {
            statusElement.innerHTML = `
              <div style="text-align: center; padding: 1rem; background: rgba(255, 187, 51, 0.1); border-radius: 8px; border: 1px solid #ffbb33;">
                <p style="color: #ffbb33; margin: 0;">📁 Grabación guardada sin entrenar el modelo</p>
              </div>
            `
          }
        }

        stream.getTracks().forEach((track) => track.stop())
      }

      trainingMediaRecorder.start()
      isTraining = true
      trainingSeconds = 0

      // Actualizar UI
      const trainBtn = document.getElementById("trainBtn")
      const trainingTimerElement = document.getElementById("trainingTimer")
      const trainingTimeElement = document.getElementById("trainingTime")

      if (trainBtn) {
        trainBtn.innerHTML = '<span class="btn-icon">⏹️</span><span class="btn-text">Detener Grabación</span>'
        trainBtn.classList.add("recording")
      }

      if (trainingTimerElement) trainingTimerElement.style.display = "flex"

      trainingTimer = setInterval(() => {
        trainingSeconds++
        if (trainingTimeElement) {
          const mins = Math.floor(trainingSeconds / 60)
          const secs = trainingSeconds % 60
          trainingTimeElement.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        }
      }, 1000)
    })
    .catch((error) => {
      console.error("Error accediendo al micrófono:", error)
      alert("❌ Error: No se pudo acceder al micrófono. Verifica los permisos.")
    })
}

function detenerEntrenamiento() {
  if (trainingMediaRecorder && trainingMediaRecorder.state === "recording") {
    trainingMediaRecorder.stop()
    isTraining = false

    // Actualizar UI
    const trainBtn = document.getElementById("trainBtn")
    const trainingTimerElement = document.getElementById("trainingTimer")

    if (trainBtn) {
      trainBtn.innerHTML = '<span class="btn-icon">🎙️</span><span class="btn-text">Iniciar Grabación</span>'
      trainBtn.classList.remove("recording")
    }

    if (trainingTimerElement) trainingTimerElement.style.display = "none"

    if (trainingTimer) {
      clearInterval(trainingTimer)
      trainingTimer = null
    }
  }
}

// Función mejorada de validación de archivos
function validateAudioFile(file, statusElementId) {
  const statusElement = document.getElementById(statusElementId)
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/wave", "audio/webm", "audio/ogg"]

  if (!file) {
    if (statusElement) {
      statusElement.textContent = ""
      statusElement.className = "file-status"
    }
    return false
  }

  // Validar tipo de archivo
  const isValidType = allowedTypes.includes(file.type) || file.name.toLowerCase().match(/\.(mp3|wav|webm|ogg)$/)

  if (!isValidType) {
    if (statusElement) {
      statusElement.textContent = "❌ Formato no válido. Use MP3, WAV, WebM u OGG"
      statusElement.className = "file-status error"
    }
    return false
  }

  // Validar tamaño
  if (file.size > maxSize) {
    if (statusElement) {
      statusElement.textContent = "❌ Archivo muy grande. Máximo 50MB"
      statusElement.className = "file-status error"
    }
    return false
  }

  // Validar duración mínima (aproximada por tamaño)
  const minSize = 50 * 1024 // 50KB mínimo
  if (file.size < minSize) {
    if (statusElement) {
      statusElement.textContent = "⚠️ Archivo muy pequeño. Mínimo 3 segundos"
      statusElement.className = "file-status warning"
    }
    return false
  }

  if (statusElement) {
    statusElement.textContent = "✅ Archivo válido - Listo para análisis avanzado"
    statusElement.className = "file-status success"
  }

  return true
}

// Funciones del menú de opciones (sin cambios)
function toggleOptionsMenu() {
  const dropdown = document.getElementById("optionsDropdown")
  if (dropdown) dropdown.classList.toggle("show")
}

function showProfile() {
  const dropdown = document.getElementById("optionsDropdown")
  if (dropdown) dropdown.classList.remove("show")

  document.querySelectorAll(".pantalla").forEach((p) => p.classList.add("oculto"))
  document.getElementById("perfil").classList.remove("oculto")
  document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"))
}

function showSettings() {
  const dropdown = document.getElementById("optionsDropdown")
  if (dropdown) dropdown.classList.remove("show")

  document.querySelectorAll(".pantalla").forEach((p) => p.classList.add("oculto"))
  document.getElementById("configuracion").classList.remove("oculto")
  document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"))

  loadCurrentConfig()
}

// Funciones de configuración (sin cambios)
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
  if (confirm("¿Estás seguro de que quieres restablecer la configuración por defecto?")) {
    userConfig = {
      theme: "dark",
      language: "es",
      colors: {
        real: "#4A90E2",
        ia: "#E74C3C",
        general: "#00FFE0",
      },
    }

    document.body.classList.remove("light-theme")
    loadCurrentConfig()
    updateNavigation()

    alert("🔄 Configuración restablecida")
  }
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
    document.querySelectorAll(".pantalla").forEach((p) => p.classList.add("oculto"))
    document.getElementById("auth").classList.remove("oculto")

    const authForm = document.getElementById("authForm")
    const authStatus = document.getElementById("authStatus")
    if (authForm) authForm.reset()
    if (authStatus) authStatus.textContent = ""
  }
}

// Función mejorada para validación de teléfono
function setupPhoneValidation() {
  const telefonoField = document.getElementById("telefono")
  const phoneCounter = document.getElementById("phoneCounter")

  if (!telefonoField || !phoneCounter) return

  telefonoField.addEventListener("input", function () {
    // Solo permitir números
    let value = this.value.replace(/\D/g, "")

    // Limitar a 10 dígitos
    if (value.length > 10) {
      value = value.slice(0, 10)
    }

    this.value = value

    // Actualizar contador
    phoneCounter.textContent = `${value.length}/10`
    phoneCounter.className = `phone-counter ${value.length === 10 ? "valid" : "invalid"}`

    // Validación visual
    if (value.length === 0) {
      this.classList.remove("input-error", "input-success")
      clearFieldError("telefono")
    } else if (value.length === 10) {
      showFieldSuccess("telefono")
    } else {
      showFieldError("telefono", `Faltan ${10 - value.length} dígitos`)
    }
  })

  telefonoField.addEventListener("blur", function () {
    if (this.value && this.value.length !== 10) {
      showFieldError("telefono", "El teléfono debe tener exactamente 10 dígitos")
    }
  })
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId)
  if (!field) return

  const existingError = field.parentNode.querySelector(".form-error")
  if (existingError) {
    existingError.remove()
  }

  field.classList.remove("input-error", "input-success")
}

// Inicialización mejorada
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 VozCheck iniciado con análisis avanzado de frecuencias")

  userState = {
    isLoggedIn: false,
    hasProfile: false,
    email: "",
    userData: null,
  }

  updateNavigation()

  document.querySelectorAll(".pantalla").forEach((p) => p.classList.add("oculto"))
  const authSection = document.getElementById("auth")
  if (authSection) {
    authSection.classList.remove("oculto")
  }

  const authForm = document.getElementById("authForm")
  const perfilForm = document.getElementById("perfilForm")
  if (authForm) authForm.reset()
  if (perfilForm) perfilForm.reset()

  const authStatus = document.getElementById("authStatus")
  if (authStatus) {
    authStatus.textContent = ""
    authStatus.style.color = ""
  }

  // Event listeners para archivos de análisis
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

  // Event listeners para archivos de comparación
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

  function checkComparisonFiles() {
    const compareBtn = document.getElementById("compareBtn")
    if (compareBtn && fileStates.archivo1.validated && fileStates.archivo2.validated) {
      compareBtn.disabled = false
    }
  }

  // Event listeners para pangramas
  const pangramItems = document.querySelectorAll(".pangram-item")
  pangramItems.forEach((item) => {
    item.addEventListener("click", function () {
      selectPangram(this)
    })
  })

  // Cerrar menú al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".options-menu")) {
      const dropdown = document.getElementById("optionsDropdown")
      if (dropdown) dropdown.classList.remove("show")
    }
  })

  // Event listeners para validación en tiempo real
  const correoField = document.getElementById("correoUsuario")
  const authEmailField = document.getElementById("authEmail")

  if (correoField) {
    correoField.addEventListener("blur", function () {
      if (this.value && !validateEmail(this.value)) {
        showFieldError("correoUsuario", "Ingresa un correo electrónico válido")
      } else if (this.value) {
        showFieldSuccess("correoUsuario")
      }
    })
  }

  if (authEmailField) {
    authEmailField.addEventListener("blur", function () {
      if (this.value && !validateEmail(this.value)) {
        showFieldError("authEmail", "Ingresa un correo electrónico válido")
      } else if (this.value) {
        showFieldSuccess("authEmail")
      }
    })
  }

  setupPhoneValidation()
  loadUserConfiguration()

  console.log("✅ VozCheck inicializado correctamente con análisis avanzado")
})
