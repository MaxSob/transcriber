// Clase para manejar el reproductor de audio en la página principal
class AudioPlayer {
    constructor() {
        this.audioElement = null;
        this.playerSection = null;
        this.currentRecording = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.audioElement = document.getElementById('audioPlayer');
        this.playerSection = document.getElementById('audioPlayerSection');
        this.downloadButton = document.getElementById('downloadRecording');
        this.newRecordingButton = document.getElementById('newRecording');
        
        // Elementos de información
        this.projectNameSpan = document.getElementById('recordingProjectName');
        this.durationSpan = document.getElementById('recordingDuration');
        this.dateSpan = document.getElementById('recordingDate');
    }

    setupEventListeners() {
        if (this.downloadButton) {
            this.downloadButton.addEventListener('click', () => this.downloadRecording());
        }
        
        if (this.newRecordingButton) {
            this.newRecordingButton.addEventListener('click', () => this.startNewRecording());
        }

        if (this.audioElement) {
            // Event listeners para el elemento de audio
            this.audioElement.addEventListener('play', () => this.onPlay());
            this.audioElement.addEventListener('pause', () => this.onPause());
            this.audioElement.addEventListener('ended', () => this.onEnded());
            this.audioElement.addEventListener('timeupdate', () => this.onTimeUpdate());
            this.audioElement.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        }
    }

    showPlayer(recordingInfo) {
        if (!this.playerSection || !this.audioElement) return;

        this.currentRecording = recordingInfo;
        
        // Configurar la fuente del audio
        this.audioElement.src = `/uploads/${recordingInfo.filename}`;
        
        // Actualizar información de la grabación
        this.updateRecordingInfo(recordingInfo);
        
        // Mostrar la sección del reproductor
        this.playerSection.style.display = 'block';
        
        // Hacer scroll suave hacia el reproductor
        this.playerSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });

        // Reproducir automáticamente (opcional)
        // this.audioElement.play();
        
        app.showNotification('Grabación lista para reproducir', 'success');
    }

    hidePlayer() {
        if (this.playerSection) {
            this.playerSection.style.display = 'none';
        }
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.audioElement.src = '';
        }
        
        this.currentRecording = null;
    }

    updateRecordingInfo(recordingInfo) {
        if (this.projectNameSpan) {
            this.projectNameSpan.textContent = recordingInfo.project_name || 'Proyecto sin nombre';
        }
        
        if (this.durationSpan) {
            this.durationSpan.textContent = `${recordingInfo.duration || 0} segundos`;
        }
        
        if (this.dateSpan) {
            const date = recordingInfo.created_at ? new Date(recordingInfo.created_at) : new Date();
            this.dateSpan.textContent = date.toLocaleString('es-ES');
        }
    }

    downloadRecording() {
        if (!this.currentRecording) {
            app.showNotification('No hay grabación para descargar', 'warning');
            return;
        }

        const link = document.createElement('a');
        link.href = `/uploads/${this.currentRecording.filename}`;
        link.download = this.currentRecording.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        app.showNotification('Descarga iniciada', 'success');
    }

    startNewRecording() {
        // Ocultar el reproductor
        this.hidePlayer();
        
        // Limpiar formulario
        const projectNameInput = document.getElementById('projectName');
        if (projectNameInput) {
            projectNameInput.value = '';
        }
        
        // Resetear temporizador
        if (window.timer) {
            window.timer.reset();
        }
        
        // Hacer scroll hacia arriba
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        app.showNotification('Listo para nueva grabación', 'info');
    }

    // Event handlers del elemento de audio
    onPlay() {
        console.log('Reproducción iniciada');
        // Aquí se pueden agregar efectos visuales o sonoros
    }

    onPause() {
        console.log('Reproducción pausada');
    }

    onEnded() {
        console.log('Reproducción terminada');
        // Opcional: mostrar mensaje cuando termine la reproducción
        app.showNotification('Reproducción completada', 'info');
    }

    onTimeUpdate() {
        // Se ejecuta mientras se reproduce el audio
        // Aquí se pueden actualizar elementos de UI como barras de progreso
    }

    onLoadedMetadata() {
        // Se ejecuta cuando se cargan los metadatos del audio
        console.log('Metadatos del audio cargados');
        
        if (this.audioElement) {
            const duration = this.audioElement.duration;
            if (duration && this.durationSpan) {
                this.durationSpan.textContent = `${Math.round(duration)} segundos`;
            }
        }
    }

    // Métodos de control del reproductor
    play() {
        if (this.audioElement) {
            this.audioElement.play();
        }
    }

    pause() {
        if (this.audioElement) {
            this.audioElement.pause();
        }
    }

    stop() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
    }

    setVolume(volume) {
        if (this.audioElement) {
            this.audioElement.volume = Math.max(0, Math.min(1, volume));
        }
    }

    seekTo(time) {
        if (this.audioElement) {
            this.audioElement.currentTime = time;
        }
    }

    // Método para obtener información del audio actual
    getCurrentRecording() {
        return this.currentRecording;
    }

    // Método para verificar si hay una grabación cargada
    hasRecording() {
        return this.currentRecording !== null;
    }

    // Método para obtener el tiempo actual de reproducción
    getCurrentTime() {
        return this.audioElement ? this.audioElement.currentTime : 0;
    }

    // Método para obtener la duración total
    getDuration() {
        return this.audioElement ? this.audioElement.duration : 0;
    }

    // Método para verificar si está reproduciéndose
    isPlaying() {
        return this.audioElement ? !this.audioElement.paused : false;
    }
}

// Inicializar el reproductor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.audioPlayer = new AudioPlayer();
});

// Función global para mostrar el reproductor (usada desde recorder.js)
window.showAudioPlayer = function(recordingInfo) {
    if (window.audioPlayer) {
        window.audioPlayer.showPlayer(recordingInfo);
    }
};

// Función global para ocultar el reproductor
window.hideAudioPlayer = function() {
    if (window.audioPlayer) {
        window.audioPlayer.hidePlayer();
    }
}; 