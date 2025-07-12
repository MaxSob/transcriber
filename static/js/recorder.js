// Clase para manejar la grabación de audio
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.audioStream = null;
        this.recordingStartTime = null;
        this.recordingDuration = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.requestMicrophonePermission();
    }

    initializeElements() {
        this.startButton = document.getElementById('startRecording');
        this.stopButton = document.getElementById('stopRecording');
        this.statusElement = document.getElementById('recordingStatus');
        this.statusText = document.getElementById('statusText');
        this.projectNameInput = document.getElementById('projectName');
    }

    setupEventListeners() {
        if (this.startButton) {
            this.startButton.addEventListener('click', () => this.startRecording());
        }
        
        if (this.stopButton) {
            this.stopButton.addEventListener('click', () => this.stopRecording());
        }
    }

    async requestMicrophonePermission() {
        try {
            console.log('Solicitando permisos de micrófono...');
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 44100,
                    channelCount: 2,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            console.log('Permisos de micrófono concedidos');
            
            // Habilitar botón de grabación si el temporizador está activo
            if (window.timer && window.timer.isActive()) {
                this.startButton.disabled = false;
            }
            
            app.showNotification('Micrófono habilitado', 'success');
        } catch (error) {
            console.error('Error al acceder al micrófono:', error);
            app.showNotification('Error al acceder al micrófono. Verifica los permisos.', 'error');
            if (this.startButton) {
                this.startButton.disabled = true;
            }
        }
    }

    async startRecording() {
        if (this.isRecording) {
            console.log('Ya está grabando');
            return;
        }

        console.log('Iniciando grabación...');

        // Validar nombre del proyecto
        const projectName = this.projectNameInput ? this.projectNameInput.value.trim() : 'Proyecto sin nombre';
        const validation = app.validateProjectName(projectName);
        if (!validation.valid) {
            app.showNotification(validation.message, 'error');
            return;
        }

        // Verificar que el temporizador esté activo
        if (!window.timer || !window.timer.isActive()) {
            app.showNotification('Debes iniciar el temporizador antes de grabar', 'error');
            return;
        }

        // Verificar que tengamos acceso al micrófono
        if (!this.audioStream) {
            app.showNotification('No hay acceso al micrófono. Recargando permisos...', 'warning');
            await this.requestMicrophonePermission();
            return;
        }

        try {
            // Iniciar grabación en el backend
            console.log('Enviando solicitud al backend...');
            const response = await app.makeRequest('/api/start-recording', {
                method: 'POST',
                body: JSON.stringify({
                    project_name: projectName,
                    duration: window.timer.getRemainingTime()
                })
            });

            console.log('Respuesta del backend:', response);

            if (!response.success) {
                throw new Error(response.error || 'Error al iniciar la grabación');
            }

            // Iniciar grabación local
            this.audioChunks = [];
            this.recordingStartTime = Date.now();
            this.isRecording = true;

            console.log('Creando MediaRecorder...');
            this.mediaRecorder = new MediaRecorder(this.audioStream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.mediaRecorder.ondataavailable = (event) => {
                console.log('Datos de audio recibidos:', event.data.size, 'bytes');
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                console.log('MediaRecorder detenido, procesando grabación...');
                this.handleRecordingComplete();
            };

            this.mediaRecorder.onstart = () => {
                console.log('MediaRecorder iniciado');
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('Error en MediaRecorder:', event);
                app.showNotification('Error en la grabación de audio', 'error');
            };

            console.log('Iniciando MediaRecorder...');
            this.mediaRecorder.start(1000); // Capturar datos cada segundo
            
            this.updateUI();
            this.updateButtons();

            app.showNotification('Grabación iniciada', 'success');
            app.playNotificationSound('beep');

            // Iniciar visualización de audio
            if (window.audioVisualizer) {
                window.audioVisualizer.start();
            }

        } catch (error) {
            console.error('Error al iniciar grabación:', error);
            app.showNotification('Error al iniciar la grabación: ' + error.message, 'error');
            this.isRecording = false;
            this.updateButtons();
        }
    }

    async stopRecording() {
        if (!this.isRecording) {
            console.log('No hay grabación activa para detener');
            return;
        }

        console.log('Deteniendo grabación...');

        try {
            // Detener grabación local
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                console.log('Deteniendo MediaRecorder...');
                this.mediaRecorder.stop();
            }

            this.isRecording = false;
            this.recordingDuration = Date.now() - this.recordingStartTime;
            this.updateButtons();

            // Detener visualización de audio
            if (window.audioVisualizer) {
                window.audioVisualizer.stop();
            }

            app.showNotification('Grabación detenida', 'info');

        } catch (error) {
            console.error('Error al detener grabación:', error);
            app.showNotification('Error al detener la grabación', 'error');
        }
    }

    async handleRecordingComplete() {
        try {
            console.log('Procesando grabación completada...');
            console.log('Chunks de audio:', this.audioChunks.length);
            
            // Crear blob del audio
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            console.log('Tamaño del blob:', audioBlob.size, 'bytes');
            
            // Enviar audio al servidor
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            console.log('Enviando audio al servidor...');
            const response = await fetch('/api/save-audio', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (result.success) {
                // Detener grabación en el backend
                const stopResponse = await app.makeRequest('/api/stop-recording', {
                    method: 'POST'
                });

                if (stopResponse.success) {
                    // Obtener información de la grabación
                    const recordingInfo = {
                        filename: stopResponse.filename,
                        project_name: this.projectNameInput ? this.projectNameInput.value.trim() : 'Proyecto sin nombre',
                        duration: this.recordingDuration / 1000, // Convertir a segundos
                        created_at: new Date().toISOString()
                    };

                    this.updateUI();
                    app.showNotification('Audio guardado correctamente', 'success');
                    app.playNotificationSound('bell');

                    // Enviar notificación
                    app.sendNotification('Grabación completada', {
                        body: 'La grabación se ha guardado correctamente',
                        tag: 'recording-complete'
                    });

                    // Mostrar el reproductor de audio
                    if (window.showAudioPlayer) {
                        window.showAudioPlayer(recordingInfo);
                    }

                } else {
                    throw new Error(stopResponse.error || 'Error al finalizar la grabación');
                }

            } else {
                throw new Error(result.error || 'Error al guardar el audio');
            }

        } catch (error) {
            console.error('Error al procesar grabación:', error);
            app.showNotification('Error al procesar la grabación: ' + error.message, 'error');
        }
    }

    updateUI() {
        if (this.statusElement) {
            this.statusElement.style.display = 'block';
            
            if (this.isRecording) {
                this.statusElement.className = 'alert alert-success';
                this.statusText.textContent = 'Grabando...';
                console.log('Estado UI: Grabando');
            } else {
                this.statusElement.className = 'alert alert-info';
                this.statusText.textContent = 'Listo para grabar';
                console.log('Estado UI: Listo para grabar');
            }
        }
    }

    updateButtons() {
        if (this.startButton) {
            this.startButton.disabled = this.isRecording || !window.timer?.isActive();
            console.log('Botón iniciar grabación:', this.startButton.disabled ? 'deshabilitado' : 'habilitado');
        }
        
        if (this.stopButton) {
            this.stopButton.disabled = !this.isRecording;
            console.log('Botón detener grabación:', this.stopButton.disabled ? 'deshabilitado' : 'habilitado');
        }
    }

    getRecordingDuration() {
        return this.recordingDuration;
    }

    isRecordingActive() {
        return this.isRecording;
    }

    // Método para obtener el nivel de audio actual
    getAudioLevel() {
        if (!this.audioStream) return 0;

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(this.audioStream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        // Calcular el nivel promedio
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        return average / 255; // Normalizar entre 0 y 1
    }
}

// Inicializar el grabador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando AudioRecorder...');
    window.audioRecorder = new AudioRecorder();
}); 