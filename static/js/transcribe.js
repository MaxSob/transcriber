/**
 * Grabador de Audio con Temporizador y Transcripción
 * Copyright (c) 2024
 * 
 * This file is part of the Grabador de Audio project.
 * Licensed under the MIT License. See LICENSE file for details.
 */

// Variables globales para transcripción
let currentTranscriptionData = null;
let transcribeModal = null;

// Función para abrir el modal de transcripción
function transcribeRecording(filename, projectName) {
    console.log('Abriendo modal de transcripción para:', filename, projectName);
    
    // Guardar datos de la transcripción actual
    currentTranscriptionData = {
        filename: filename,
        projectName: projectName
    };
    
    // Mostrar modal
    if (!transcribeModal) {
        transcribeModal = new bootstrap.Modal(document.getElementById('transcribeModal'));
    }
    
    // Limpiar formulario
    document.getElementById('awsAccessKey').value = '';
    document.getElementById('awsSecretKey').value = '';
    document.getElementById('awsRegion').value = 'us-east-1';
    document.getElementById('awsBucket').value = '';
    document.getElementById('openaiApiKey').value = '';
    
    // Ocultar progreso y resultado
    document.getElementById('transcribeProgress').style.display = 'none';
    document.getElementById('transcribeResult').style.display = 'none';
    
    // Habilitar botón de inicio
    document.getElementById('startTranscribeBtn').disabled = false;
    document.getElementById('startTranscribeBtn').innerHTML = '<i class="fas fa-play me-1"></i>Iniciar Transcripción';
    
    transcribeModal.show();
}

// Función para iniciar la transcripción
async function startTranscription() {
    if (!currentTranscriptionData) {
        app.showNotification('Error: No hay datos de transcripción', 'error');
        return;
    }
    
    // Validar credenciales
    const awsAccessKey = document.getElementById('awsAccessKey').value.trim();
    const awsSecretKey = document.getElementById('awsSecretKey').value.trim();
    const awsRegion = document.getElementById('awsRegion').value;
    const awsBucket = document.getElementById('awsBucket').value.trim();
    const openaiApiKey = document.getElementById('openaiApiKey').value.trim();
    
    if (!awsAccessKey || !awsSecretKey || !awsBucket || !openaiApiKey) {
        app.showNotification('Por favor completa todas las credenciales', 'warning');
        return;
    }
    
    // Deshabilitar botón y mostrar progreso
    const startBtn = document.getElementById('startTranscribeBtn');
    startBtn.disabled = true;
    startBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Procesando...';
    
    document.getElementById('transcribeProgress').style.display = 'block';
    document.getElementById('transcribeResult').style.display = 'none';
    
    // Actualizar progreso
    updateTranscribeProgress(10, 'Iniciando transcripción...');
    
    try {
        // Preparar datos para la API
        const requestData = {
            filename: currentTranscriptionData.filename,
            aws_credentials: {
                accessKey: awsAccessKey,
                secretKey: awsSecretKey,
                region: awsRegion,
                bucket: awsBucket
            },
            openai_api_key: openaiApiKey
        };
        
        updateTranscribeProgress(20, 'Subiendo archivo a S3...');
        
        // Llamar a la API de transcripción
        const response = await app.makeRequest('/api/transcribe', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
        
        updateTranscribeProgress(100, 'Transcripción completada');
        
        if (response.success) {
            // Mostrar resultado
            document.getElementById('transcribeResult').style.display = 'block';
            document.getElementById('transcriptText').textContent = response.transcript;
            
            // Guardar datos del resultado
            currentTranscriptionData.transcript = response.transcript;
            currentTranscriptionData.transcriptFile = response.transcript_file;
            currentTranscriptionData.audioUrl = response.audio_url;
            
            app.showNotification('Transcripción completada exitosamente', 'success');
            
        } else {
            throw new Error(response.error || 'Error desconocido en la transcripción');
        }
        
    } catch (error) {
        console.error('Error en transcripción:', error);
        app.showNotification('Error en transcripción: ' + error.message, 'error');
        
        // Restaurar botón
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-play me-1"></i>Iniciar Transcripción';
        
        // Ocultar progreso
        document.getElementById('transcribeProgress').style.display = 'none';
    }
}

// Función para actualizar la barra de progreso
function updateTranscribeProgress(percent, text) {
    const progressBar = document.getElementById('transcribeProgressBar');
    const progressText = document.getElementById('transcribeProgressText');
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
        progressBar.setAttribute('aria-valuenow', percent);
    }
    
    if (progressText) {
        progressText.textContent = text;
    }
}

// Función para descargar la transcripción
function downloadTranscript() {
    if (!currentTranscriptionData || !currentTranscriptionData.transcript) {
        app.showNotification('No hay transcripción para descargar', 'warning');
        return;
    }
    
    // Crear archivo de texto para descarga
    const blob = new Blob([currentTranscriptionData.transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Crear enlace de descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = currentTranscriptionData.transcriptFile || 'transcripcion.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Limpiar URL
    URL.revokeObjectURL(url);
    
    app.showNotification('Transcripción descargada', 'success');
}

// Función para cargar credenciales guardadas
function loadTranscribeCredentials() {
    try {
        const savedCredentials = localStorage.getItem('transcribeCredentials');
        if (savedCredentials) {
            const credentials = JSON.parse(savedCredentials);
            
            if (credentials.awsAccessKey) document.getElementById('awsAccessKey').value = credentials.awsAccessKey;
            if (credentials.awsRegion) document.getElementById('awsRegion').value = credentials.awsRegion;
            if (credentials.awsBucket) document.getElementById('awsBucket').value = credentials.awsBucket;
            if (credentials.openaiApiKey) document.getElementById('openaiApiKey').value = credentials.openaiApiKey;
        }
    } catch (error) {
        console.error('Error al cargar credenciales:', error);
    }
}

// Función para guardar credenciales
function saveTranscribeCredentials() {
    try {
        const credentials = {
            awsAccessKey: document.getElementById('awsAccessKey').value,
            awsRegion: document.getElementById('awsRegion').value,
            awsBucket: document.getElementById('awsBucket').value,
            openaiApiKey: document.getElementById('openaiApiKey').value
        };
        
        localStorage.setItem('transcribeCredentials', JSON.stringify(credentials));
    } catch (error) {
        console.error('Error al guardar credenciales:', error);
    }
}

// Event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando funcionalidad de transcripción...');
    
    // Cargar credenciales guardadas cuando se abra el modal
    const transcribeModalElement = document.getElementById('transcribeModal');
    if (transcribeModalElement) {
        transcribeModalElement.addEventListener('show.bs.modal', loadTranscribeCredentials);
        transcribeModalElement.addEventListener('hidden.bs.modal', saveTranscribeCredentials);
    }
});

// Función para transcripción directa
async function transcribeDirect(filename, projectName) {
    console.log('Iniciando transcripción directa para:', filename, projectName);
    
    // Mostrar notificación de inicio
    app.showNotification('Iniciando transcripción directa...', 'info');
    
    try {
        // Obtener el archivo desde el servidor
        const response = await fetch(`/uploads/${filename}`);
        if (!response.ok) {
            throw new Error('No se pudo obtener el archivo de audio');
        }
        
        const audioBlob = await response.blob();
        
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('audio', audioBlob, filename);
        
        // Llamar a la API de transcripción directa
        const transcribeResponse = await fetch('/api/transcribe-direct', {
            method: 'POST',
            body: formData
        });
        
        const result = await transcribeResponse.json();
        
        if (result.success) {
            // Mostrar resultado en un modal
            showDirectTranscriptionResult(result.transcript, result.transcript_file, filename);
            app.showNotification('Transcripción directa completada', 'success');
        } else {
            throw new Error(result.error || 'Error en transcripción directa');
        }
        
    } catch (error) {
        console.error('Error en transcripción directa:', error);
        app.showNotification('Error en transcripción directa: ' + error.message, 'error');
    }
}

// Función para mostrar el resultado de transcripción directa
function showDirectTranscriptionResult(transcript, transcriptFile, originalFile) {
    // Crear modal dinámicamente
    const modalHtml = `
        <div class="modal fade" id="directTranscribeModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-bolt me-2"></i>Transcripción Directa Completada
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle me-2"></i>
                            <strong>Archivo:</strong> ${originalFile}
                        </div>
                        <div class="mb-3">
                            <h6><i class="fas fa-file-text me-2"></i>Transcripción:</h6>
                            <div class="border rounded p-3 bg-light" style="max-height: 300px; overflow-y: auto;">
                                ${transcript}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-success" onclick="downloadDirectTranscript('${transcript}', '${transcriptFile}')">
                            <i class="fas fa-download me-1"></i>Descargar Transcripción
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const existingModal = document.getElementById('directTranscribeModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Añadir nuevo modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('directTranscribeModal'));
    modal.show();
    
    // Limpiar modal cuando se cierre
    document.getElementById('directTranscribeModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Función para descargar transcripción directa
function downloadDirectTranscript(transcript, filename) {
    // Crear archivo de texto para descarga
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Crear enlace de descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'transcripcion_directa.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Limpiar URL
    URL.revokeObjectURL(url);
    
    app.showNotification('Transcripción descargada', 'success');
} 