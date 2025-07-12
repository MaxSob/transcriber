// Funciones para manejar la página de grabaciones
let currentRecording = null;

function playRecording(filename) {
    // Buscar la información de la grabación
    const recording = findRecordingByFilename(filename);
    if (!recording) {
        app.showNotification('Grabación no encontrada', 'error');
        return;
    }

    currentRecording = recording;
    
    // Configurar el modal
    document.getElementById('modalProjectName').textContent = recording.project_name;
    document.getElementById('modalDuration').textContent = recording.duration + ' segundos';
    document.getElementById('modalDate').textContent = formatDate(recording.created_at);
    
    // Configurar el reproductor de audio
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.src = `/uploads/${filename}`;
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('audioModal'));
    modal.show();
}

function downloadRecording(filename) {
    const link = document.createElement('a');
    link.href = `/uploads/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    app.showNotification('Descarga iniciada', 'success');
}

function deleteRecording(filename) {
    if (confirm('¿Estás seguro de que quieres eliminar esta grabación? Esta acción no se puede deshacer.')) {
        // Aquí se implementaría la llamada al backend para eliminar
        // Por ahora solo simulamos la eliminación
        app.showNotification('Grabación eliminada', 'success');
        
        // Recargar la página para actualizar la lista
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

function downloadFromModal() {
    if (currentRecording) {
        downloadRecording(currentRecording.filename);
    }
}

function refreshRecordings() {
    location.reload();
}

function findRecordingByFilename(filename) {
    // Esta función buscaría en la lista de grabaciones
    // Por ahora retornamos null, se implementaría con los datos reales
    return null;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

// Event listeners para el modal
document.addEventListener('DOMContentLoaded', () => {
    const audioModal = document.getElementById('audioModal');
    if (audioModal) {
        audioModal.addEventListener('hidden.bs.modal', () => {
            // Limpiar el reproductor cuando se cierre el modal
            const audioPlayer = document.getElementById('audioPlayer');
            if (audioPlayer) {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
            }
            currentRecording = null;
        });
    }

    // Configurar tooltips para los botones de acción
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Función para buscar grabaciones
function searchRecordings(query) {
    const rows = document.querySelectorAll('tbody tr');
    const searchTerm = query.toLowerCase();
    
    rows.forEach(row => {
        const projectName = row.querySelector('td:first-child strong').textContent.toLowerCase();
        const filename = row.querySelector('td:first-child small').textContent.toLowerCase();
        
        if (projectName.includes(searchTerm) || filename.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Función para filtrar grabaciones por fecha
function filterByDate(dateRange) {
    const rows = document.querySelectorAll('tbody tr');
    const today = new Date();
    const filterDate = new Date();
    
    switch (dateRange) {
        case 'today':
            filterDate.setDate(today.getDate() - 1);
            break;
        case 'week':
            filterDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            filterDate.setMonth(today.getMonth() - 1);
            break;
        default:
            // Mostrar todas
            rows.forEach(row => row.style.display = '');
            return;
    }
    
    rows.forEach(row => {
        const dateCell = row.querySelector('td:nth-child(2)');
        const dateText = dateCell.textContent.trim();
        
        if (dateText !== 'N/A') {
            const rowDate = new Date(dateText);
            if (rowDate >= filterDate) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Función para ordenar grabaciones
function sortRecordings(column, direction = 'asc') {
    const tbody = document.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        let aValue, bValue;
        
        switch (column) {
            case 'project':
                aValue = a.querySelector('td:first-child strong').textContent;
                bValue = b.querySelector('td:first-child strong').textContent;
                break;
            case 'date':
                aValue = new Date(a.querySelector('td:nth-child(2)').textContent);
                bValue = new Date(b.querySelector('td:nth-child(2)').textContent);
                break;
            case 'duration':
                aValue = parseInt(a.querySelector('td:nth-child(3) .badge').textContent);
                bValue = parseInt(b.querySelector('td:nth-child(3) .badge').textContent);
                break;
            default:
                return 0;
        }
        
        if (direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    // Reordenar las filas en el DOM
    rows.forEach(row => tbody.appendChild(row));
}

// Función para exportar lista de grabaciones
function exportRecordingsList() {
    const rows = document.querySelectorAll('tbody tr');
    const recordings = [];
    
    rows.forEach(row => {
        const projectName = row.querySelector('td:first-child strong').textContent;
        const filename = row.querySelector('td:first-child small').textContent;
        const date = row.querySelector('td:nth-child(2)').textContent;
        const duration = row.querySelector('td:nth-child(3) .badge').textContent;
        
        recordings.push({
            project: projectName,
            filename: filename,
            date: date,
            duration: duration
        });
    });
    
    const csvContent = 'data:text/csv;charset=utf-8,' 
        + 'Proyecto,Archivo,Fecha,Duración\n'
        + recordings.map(r => `${r.project},${r.filename},${r.date},${r.duration}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'grabaciones.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    app.showNotification('Lista de grabaciones exportada', 'success');
} 