// Clase para manejar el temporizador
class Timer {
    constructor() {
        this.duration = 60; // duración en segundos
        this.remainingTime = 60;
        this.isRunning = false;
        this.interval = null;
        this.onTick = null;
        this.onComplete = null;
        this.onWarning = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startButton = document.getElementById('startTimer');
        this.stopButton = document.getElementById('stopTimer');
        this.durationInput = document.getElementById('timerDuration');
        this.timerCircle = document.querySelector('.timer-circle');
    }

    setupEventListeners() {
        if (this.startButton) {
            this.startButton.addEventListener('click', () => this.start());
        }
        
        if (this.stopButton) {
            this.stopButton.addEventListener('click', () => this.stop());
        }
        
        if (this.durationInput) {
            this.durationInput.addEventListener('change', (e) => {
                this.setDuration(parseInt(e.target.value));
            });
        }
    }

    setDuration(seconds) {
        this.duration = seconds;
        this.remainingTime = seconds;
        this.updateDisplay();
    }

    start() {
        if (this.isRunning) return;

        // Validar duración
        const validation = app.validateDuration(this.duration);
        if (!validation.valid) {
            app.showNotification(validation.message, 'error');
            return;
        }

        this.isRunning = true;
        this.remainingTime = this.duration;
        this.updateDisplay();
        this.updateButtons();
        this.addRunningClass();

        // Iniciar el intervalo
        this.interval = setInterval(() => {
            this.remainingTime--;
            this.updateDisplay();
            
            // Llamar callback de tick si existe
            if (this.onTick) {
                this.onTick(this.remainingTime);
            }

            // Mostrar advertencia cuando queden 10 segundos
            if (this.remainingTime === 10) {
                this.showWarning();
            }

            // Completar cuando llegue a 0
            if (this.remainingTime <= 0) {
                this.complete();
            }
        }, 1000);

        // Habilitar botón de grabación
        const startRecordingBtn = document.getElementById('startRecording');
        if (startRecordingBtn) {
            startRecordingBtn.disabled = false;
        }

        app.showNotification('Temporizador iniciado', 'success');
        
        // Reproducir sonido de inicio
        app.playNotificationSound('beep');
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        clearInterval(this.interval);
        this.interval = null;
        this.updateButtons();
        this.removeRunningClass();
        this.removeWarningClass();

        // Deshabilitar botón de grabación
        const startRecordingBtn = document.getElementById('startRecording');
        if (startRecordingBtn) {
            startRecordingBtn.disabled = true;
        }

        app.showNotification('Temporizador detenido', 'info');
    }

    complete() {
        this.stop();
        
        // Llamar callback de completado si existe
        if (this.onComplete) {
            this.onComplete();
        }

        // Reproducir sonido de finalización
        app.playNotificationSound('bell');
        
        // Mostrar notificación
        app.showNotification('¡Tiempo completado!', 'warning');
        app.sendNotification('Temporizador completado', {
            body: 'El tiempo del temporizador ha terminado',
            tag: 'timer-complete'
        });

        // Detener grabación si está activa
        if (window.audioRecorder && window.audioRecorder.isRecording) {
            window.audioRecorder.stop();
        }
    }

    showWarning() {
        this.addWarningClass();
        
        // Llamar callback de advertencia si existe
        if (this.onWarning) {
            this.onWarning();
        }

        // Reproducir sonido de advertencia
        app.playNotificationSound('beep');
        
        // Mostrar notificación
        app.sendNotification('Temporizador - 10 segundos restantes', {
            body: 'Quedan 10 segundos en el temporizador',
            tag: 'timer-warning'
        });
    }

    updateDisplay() {
        if (this.timerDisplay) {
            this.timerDisplay.textContent = app.formatTime(this.remainingTime);
        }
    }

    updateButtons() {
        if (this.startButton) {
            this.startButton.disabled = this.isRunning;
        }
        
        if (this.stopButton) {
            this.stopButton.disabled = !this.isRunning;
        }
    }

    addRunningClass() {
        if (this.timerCircle) {
            this.timerCircle.classList.add('timer-running');
        }
    }

    removeRunningClass() {
        if (this.timerCircle) {
            this.timerCircle.classList.remove('timer-running');
        }
    }

    addWarningClass() {
        if (this.timerCircle) {
            this.timerCircle.classList.add('timer-warning');
        }
    }

    removeWarningClass() {
        if (this.timerCircle) {
            this.timerCircle.classList.remove('timer-warning');
        }
    }

    reset() {
        this.stop();
        this.remainingTime = this.duration;
        this.updateDisplay();
    }

    getRemainingTime() {
        return this.remainingTime;
    }

    isActive() {
        return this.isRunning;
    }
}

// Inicializar el temporizador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.timer = new Timer();
    
    // Configurar callbacks
    window.timer.onComplete = () => {
        console.log('Temporizador completado');
    };
    
    window.timer.onWarning = () => {
        console.log('Advertencia: 10 segundos restantes');
    };
}); 