// Funciones para manejar la configuración
document.addEventListener('DOMContentLoaded', () => {
    const configForm = document.getElementById('configForm');
    
    if (configForm) {
        configForm.addEventListener('submit', handleConfigSubmit);
        loadSavedConfiguration();
    }
});

function handleConfigSubmit(event) {
    event.preventDefault();
    
    const config = {
        defaultDuration: document.getElementById('defaultDuration').value,
        countdownSound: document.getElementById('countdownSound').value,
        sampleRate: document.getElementById('sampleRate').value,
        bitDepth: document.getElementById('bitDepth').value,
        channels: document.getElementById('channels').value,
        format: document.getElementById('format').value,
        maxFileSize: document.getElementById('maxFileSize').value,
        autoSave: document.getElementById('autoSave').checked,
        timerNotifications: document.getElementById('timerNotifications').checked,
        recordingNotifications: document.getElementById('recordingNotifications').checked
    };

    // Validar configuración
    const validation = validateConfiguration(config);
    if (!validation.valid) {
        app.showNotification(validation.message, 'error');
        return;
    }

    // Guardar configuración
    app.saveConfiguration(config);
    
    // Aplicar configuración inmediatamente
    applyConfiguration(config);
}

function validateConfiguration(config) {
    // Validar duración por defecto
    const duration = parseInt(config.defaultDuration);
    if (isNaN(duration) || duration < 10 || duration > 3600) {
        return { valid: false, message: 'La duración por defecto debe estar entre 10 y 3600 segundos' };
    }

    // Validar tamaño máximo de archivo
    const maxFileSize = parseInt(config.maxFileSize);
    if (isNaN(maxFileSize) || maxFileSize < 1 || maxFileSize > 500) {
        return { valid: false, message: 'El tamaño máximo de archivo debe estar entre 1 y 500 MB' };
    }

    // Validar frecuencia de muestreo
    const sampleRate = parseInt(config.sampleRate);
    if (![22050, 44100, 48000].includes(sampleRate)) {
        return { valid: false, message: 'Frecuencia de muestreo no válida' };
    }

    // Validar profundidad de bits
    const bitDepth = parseInt(config.bitDepth);
    if (![16, 24, 32].includes(bitDepth)) {
        return { valid: false, message: 'Profundidad de bits no válida' };
    }

    // Validar canales
    const channels = parseInt(config.channels);
    if (![1, 2].includes(channels)) {
        return { valid: false, message: 'Número de canales no válido' };
    }

    return { valid: true };
}

function applyConfiguration(config) {
    // Aplicar duración por defecto al temporizador
    if (window.timer && config.defaultDuration) {
        window.timer.setDuration(parseInt(config.defaultDuration));
        
        // Actualizar el input de duración en la página principal
        const durationInput = document.getElementById('timerDuration');
        if (durationInput) {
            durationInput.value = config.defaultDuration;
        }
    }

    // Configurar notificaciones
    if (config.timerNotifications || config.recordingNotifications) {
        app.requestNotificationPermission();
    }

    // Mostrar mensaje de éxito
    app.showNotification('Configuración aplicada correctamente', 'success');
}

function loadSavedConfiguration() {
    const config = localStorage.getItem('audioRecorderConfig');
    if (config) {
        try {
            const parsedConfig = JSON.parse(config);
            
            // Aplicar valores a los campos del formulario
            Object.keys(parsedConfig).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = parsedConfig[key];
                    } else {
                        element.value = parsedConfig[key];
                    }
                }
            });
            
        } catch (error) {
            console.error('Error al cargar configuración:', error);
        }
    }
}

function resetToDefaults() {
    const defaultConfig = {
        defaultDuration: 60,
        countdownSound: 'beep',
        sampleRate: 44100,
        bitDepth: 16,
        channels: 2,
        format: 'wav',
        maxFileSize: 50,
        autoSave: true,
        timerNotifications: true,
        recordingNotifications: true
    };

    // Aplicar valores por defecto a los campos
    Object.keys(defaultConfig).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = defaultConfig[key];
            } else {
                element.value = defaultConfig[key];
            }
        }
    });

    app.showNotification('Configuración restaurada a valores por defecto', 'info');
}

function testAudio() {
    // Probar la configuración de audio
    const sampleRate = document.getElementById('sampleRate').value;
    const bitDepth = document.getElementById('bitDepth').value;
    const channels = document.getElementById('channels').value;

    const testMessage = `Configuración de audio: ${sampleRate}Hz, ${bitDepth} bits, ${channels} canal(es)`;
    app.showNotification(testMessage, 'info');

    // Reproducir sonido de prueba
    app.playNotificationSound('beep');
}

// Función para exportar configuración
function exportConfiguration() {
    const config = localStorage.getItem('audioRecorderConfig');
    if (config) {
        const blob = new Blob([config], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audio-recorder-config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        app.showNotification('Configuración exportada correctamente', 'success');
    } else {
        app.showNotification('No hay configuración para exportar', 'warning');
    }
}

// Función para importar configuración
function importConfiguration(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            
            // Validar configuración importada
            const validation = validateConfiguration(config);
            if (!validation.valid) {
                app.showNotification('Archivo de configuración inválido: ' + validation.message, 'error');
                return;
            }

            // Guardar configuración
            localStorage.setItem('audioRecorderConfig', JSON.stringify(config));
            
            // Aplicar configuración
            applyConfiguration(config);
            
            // Recargar página para aplicar cambios
            location.reload();
            
        } catch (error) {
            app.showNotification('Error al importar configuración: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Event listener para importar archivo
document.addEventListener('DOMContentLoaded', () => {
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importConfiguration(e.target.files[0]);
        }
    });
    document.body.appendChild(importInput);

    // Agregar botón de importar si no existe
    const configForm = document.getElementById('configForm');
    if (configForm && !document.getElementById('importConfig')) {
        const importButton = document.createElement('button');
        importButton.type = 'button';
        importButton.className = 'btn btn-outline-secondary me-2';
        importButton.innerHTML = '<i class="fas fa-upload me-1"></i>Importar';
        importButton.onclick = () => importInput.click();
        
        const buttonContainer = configForm.querySelector('.d-flex');
        if (buttonContainer) {
            buttonContainer.insertBefore(importButton, buttonContainer.firstChild);
        }
    }
}); 