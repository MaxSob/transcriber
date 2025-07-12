// Clase para visualizar el audio en tiempo real
class AudioVisualizer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        this.isActive = false;
        
        this.initializeCanvas();
    }

    initializeCanvas() {
        this.canvas = document.getElementById('audioVisualizer');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Escuchar cambios de tamaño de ventana
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.canvas) return;

        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    start() {
        if (this.isActive || !window.audioRecorder?.audioStream) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(window.audioRecorder.audioStream);
            
            microphone.connect(this.analyser);
            this.analyser.fftSize = 256;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.isActive = true;
            this.draw();
            
        } catch (error) {
            console.error('Error al iniciar visualizador:', error);
        }
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Limpiar canvas
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    draw() {
        if (!this.isActive || !this.analyser || !this.ctx || !this.canvas) return;

        this.animationId = requestAnimationFrame(() => this.draw());

        this.analyser.getByteFrequencyData(this.dataArray);

        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Limpiar canvas
        this.ctx.clearRect(0, 0, width, height);

        // Configurar gradiente de fondo
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        // Dibujar barras de frecuencia
        const barWidth = (width / this.dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            barHeight = (this.dataArray[i] / 255) * height;

            // Crear gradiente para cada barra
            const barGradient = this.ctx.createLinearGradient(0, height - barHeight, 0, height);
            barGradient.addColorStop(0, '#00ff88');
            barGradient.addColorStop(0.5, '#00cc66');
            barGradient.addColorStop(1, '#00994d');

            this.ctx.fillStyle = barGradient;
            this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);

            // Agregar efecto de brillo
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(x, height - barHeight, barWidth, 2);

            x += barWidth + 1;
        }

        // Dibujar línea de tiempo
        this.drawTimeline();
    }

    drawTimeline() {
        if (!this.ctx || !this.canvas) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Línea de tiempo en la parte inferior
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, height - 20);
        this.ctx.lineTo(width, height - 20);
        this.ctx.stroke();

        // Marcadores de tiempo
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';

        const totalTime = window.timer ? window.timer.getRemainingTime() : 60;
        const elapsedTime = window.timer ? window.timer.duration - totalTime : 0;

        // Mostrar tiempo transcurrido
        const timeText = app.formatTime(elapsedTime);
        this.ctx.fillText(timeText, width / 2, height - 5);
    }

    // Método para obtener el nivel de audio actual
    getAudioLevel() {
        if (!this.analyser || !this.dataArray) return 0;

        this.analyser.getByteFrequencyData(this.dataArray);
        const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
        return average / 255; // Normalizar entre 0 y 1
    }

    // Método para cambiar el tipo de visualización
    setVisualizationType(type) {
        // Por ahora solo tenemos barras, pero se puede expandir
        this.visualizationType = type || 'bars';
    }
}

// Inicializar el visualizador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.audioVisualizer = new AudioVisualizer();
}); 