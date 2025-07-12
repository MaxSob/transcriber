/**
 * Grabador de Audio con Temporizador y Transcripción
 * Copyright (c) 2024
 * 
 * This file is part of the Grabador de Audio project.
 * Licensed under the MIT License. See LICENSE file for details.
 */

// Funciones principales de la aplicación
class AudioRecorderApp {
    constructor() {
        this.initializeApp();
    }

    initializeApp() {
        // Inicializar componentes cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.loadConfiguration();
        });
    }

    setupEventListeners() {
        // Event listeners globales
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-toggle="tooltip"]')) {
                this.initializeTooltips();
            }
        });
    }

    loadConfiguration() {
        // Cargar configuración desde localStorage
        const config = localStorage.getItem('audioRecorderConfig');
        if (config) {
            try {
                const parsedConfig = JSON.parse(config);
                this.applyConfiguration(parsedConfig);
            } catch (error) {
                console.error('Error al cargar configuración:', error);
            }
        }
    }

    applyConfiguration(config) {
        // Aplicar configuración a los elementos del DOM
        Object.keys(config).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = config[key];
                } else {
                    element.value = config[key];
                }
            }
        });
    }

    saveConfiguration(config) {
        // Guardar configuración en localStorage
        try {
            localStorage.setItem('audioRecorderConfig', JSON.stringify(config));
            this.showNotification('Configuración guardada correctamente', 'success');
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            this.showNotification('Error al guardar configuración', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Mostrar notificación al usuario
        const alertClass = type === 'error' ? 'danger' : type;
        const alertHtml = `
            <div class="alert alert-${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.querySelector('main .container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', alertHtml);
            
            // Auto-dismiss después de 5 segundos
            setTimeout(() => {
                const alert = container.querySelector('.alert');
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, 5000);
        }
    }

    initializeTooltips() {
        // Inicializar tooltips de Bootstrap
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    formatTime(seconds) {
        // Formatear tiempo en formato MM:SS
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        // Formatear tamaño de archivo
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async makeRequest(url, options = {}) {
        // Función helper para hacer requests HTTP
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            // Añadir token CSRF si está disponible
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken;
            }
            
            const requestOptions = {
                headers,
                ...options
            };
            
            console.log('Enviando request a:', url);
            console.log('Opciones:', requestOptions);
            
            const response = await fetch(url, requestOptions);

            console.log('Respuesta recibida:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response body:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Datos de respuesta:', data);
            return data;
        } catch (error) {
            console.error('Error en request:', error);
            throw error;
        }
    }

    validateProjectName(name) {
        // Validar nombre del proyecto
        if (!name || name.trim().length === 0) {
            return { valid: false, message: 'El nombre del proyecto es requerido' };
        }
        if (name.length > 100) {
            return { valid: false, message: 'El nombre del proyecto no puede exceder 100 caracteres' };
        }
        return { valid: true };
    }

    validateDuration(duration) {
        // Validar duración del temporizador
        const num = parseInt(duration);
        if (isNaN(num) || num < 10 || num > 3600) {
            return { valid: false, message: 'La duración debe estar entre 10 y 3600 segundos' };
        }
        return { valid: true, value: num };
    }

    playNotificationSound(type = 'beep') {
        // Reproducir sonido de notificación
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(type === 'bell' ? 800 : 1000, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    requestNotificationPermission() {
        // Solicitar permiso para notificaciones del navegador
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Permiso de notificaciones concedido');
                }
            });
        }
    }

    sendNotification(title, options = {}) {
        // Enviar notificación del navegador
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/static/images/icon.png',
                badge: '/static/images/badge.png',
                ...options
            });
        }
    }
}

// Inicializar la aplicación
const app = new AudioRecorderApp();

// Funciones globales para uso en otros archivos
window.AudioRecorderApp = AudioRecorderApp;
window.app = app; 