// Clase para manejar la subida de archivos a servicios en la nube
class CloudUploader {
    constructor() {
        this.supportedProviders = ['aws-s3', 'google-cloud'];
        this.currentProvider = null;
        this.uploadProgress = 0;
        this.isUploading = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadConfiguration();
    }

    initializeElements() {
        this.uploadSection = document.getElementById('uploadSection');
        this.providerSelect = document.getElementById('cloudProvider');
        this.credentialsForm = document.getElementById('credentialsForm');
        this.uploadButton = document.getElementById('uploadToCloud');
        this.progressBar = document.getElementById('uploadProgress');
        this.progressText = document.getElementById('progressText');
        this.uploadStatus = document.getElementById('uploadStatus');
        this.fileList = document.getElementById('fileList');
    }

    setupEventListeners() {
        if (this.providerSelect) {
            this.providerSelect.addEventListener('change', () => this.onProviderChange());
        }
        
        if (this.uploadButton) {
            this.uploadButton.addEventListener('click', () => this.uploadFiles());
        }

        // Event listener para drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        // Click para seleccionar archivos
        dropZone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'audio/*';
            input.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleFiles(files);
            });
            input.click();
        });
    }

    handleFiles(files) {
        const audioFiles = files.filter(file => file.type.startsWith('audio/'));
        
        if (audioFiles.length === 0) {
            app.showNotification('No se seleccionaron archivos de audio válidos', 'warning');
            return;
        }

        this.displayFiles(audioFiles);
        app.showNotification(`${audioFiles.length} archivo(s) de audio seleccionado(s)`, 'success');
    }

    displayFiles(files) {
        if (!this.fileList) return;

        this.fileList.innerHTML = '';
        
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-music me-2"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${this.formatFileSize(file.size)})</span>
                </div>
                <div class="file-actions">
                    <button class="btn btn-sm btn-outline-danger" onclick="cloudUploader.removeFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            this.fileList.appendChild(fileItem);
        });

        this.selectedFiles = files;
        this.updateUploadButton();
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displayFiles(this.selectedFiles);
    }

    onProviderChange() {
        const provider = this.providerSelect.value;
        this.currentProvider = provider;
        
        if (provider === 'aws-s3') {
            this.showAWSCredentials();
        } else if (provider === 'google-cloud') {
            this.showGoogleCredentials();
        } else {
            this.hideCredentials();
        }
        
        this.saveConfiguration();
    }

    showAWSCredentials() {
        if (!this.credentialsForm) return;
        
        this.credentialsForm.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <label for="awsAccessKey" class="form-label">Access Key ID</label>
                    <input type="text" class="form-control" id="awsAccessKey" placeholder="AKIA...">
                </div>
                <div class="col-md-6">
                    <label for="awsSecretKey" class="form-label">Secret Access Key</label>
                    <input type="password" class="form-control" id="awsSecretKey" placeholder="...">
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-6">
                    <label for="awsRegion" class="form-label">Región</label>
                    <select class="form-select" id="awsRegion">
                        <option value="us-east-1">US East (N. Virginia)</option>
                        <option value="us-west-2">US West (Oregon)</option>
                        <option value="eu-west-1">Europe (Ireland)</option>
                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label for="awsBucket" class="form-label">Bucket Name</label>
                    <input type="text" class="form-control" id="awsBucket" placeholder="mi-bucket-audio">
                </div>
            </div>
        `;
        
        this.credentialsForm.style.display = 'block';
    }

    showGoogleCredentials() {
        if (!this.credentialsForm) return;
        
        this.credentialsForm.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <label for="googleProjectId" class="form-label">Project ID</label>
                    <input type="text" class="form-control" id="googleProjectId" placeholder="mi-proyecto-123">
                </div>
                <div class="col-md-6">
                    <label for="googleBucket" class="form-label">Bucket Name</label>
                    <input type="text" class="form-control" id="googleBucket" placeholder="mi-bucket-audio">
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <label for="googleCredentials" class="form-label">Service Account JSON</label>
                    <textarea class="form-control" id="googleCredentials" rows="4" placeholder='{"type": "service_account", ...}'></textarea>
                    <small class="form-text text-muted">Pega aquí el contenido del archivo JSON de tu service account</small>
                </div>
            </div>
        `;
        
        this.credentialsForm.style.display = 'block';
    }

    hideCredentials() {
        if (this.credentialsForm) {
            this.credentialsForm.style.display = 'none';
        }
    }

    async uploadFiles() {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            app.showNotification('No hay archivos seleccionados para subir', 'warning');
            return;
        }

        if (!this.currentProvider) {
            app.showNotification('Selecciona un proveedor de nube', 'warning');
            return;
        }

        if (!this.validateCredentials()) {
            app.showNotification('Configura las credenciales correctamente', 'error');
            return;
        }

        this.isUploading = true;
        this.updateUploadButton();
        this.showProgress();

        try {
            for (let i = 0; i < this.selectedFiles.length; i++) {
                const file = this.selectedFiles[i];
                await this.uploadFile(file, i + 1, this.selectedFiles.length);
            }

            app.showNotification('Todos los archivos se subieron correctamente', 'success');
            this.resetUpload();

        } catch (error) {
            console.error('Error al subir archivos:', error);
            app.showNotification('Error al subir archivos: ' + error.message, 'error');
        } finally {
            this.isUploading = false;
            this.updateUploadButton();
        }
    }

    async uploadFile(file, current, total) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('provider', this.currentProvider);
        formData.append('credentials', JSON.stringify(this.getCredentials()));

        const xhr = new XMLHttpRequest();

        return new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    const overallProgress = ((current - 1) / total) * 100 + (percentComplete / total);
                    this.updateProgress(overallProgress, `Subiendo ${file.name}...`);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(new Error(response.error));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Error de red'));
            });

            xhr.open('POST', '/api/upload-to-cloud');
            xhr.send(formData);
        });
    }

    validateCredentials() {
        if (this.currentProvider === 'aws-s3') {
            const accessKey = document.getElementById('awsAccessKey')?.value;
            const secretKey = document.getElementById('awsSecretKey')?.value;
            const region = document.getElementById('awsRegion')?.value;
            const bucket = document.getElementById('awsBucket')?.value;

            return accessKey && secretKey && region && bucket;
        } else if (this.currentProvider === 'google-cloud') {
            const projectId = document.getElementById('googleProjectId')?.value;
            const bucket = document.getElementById('googleBucket')?.value;
            const credentials = document.getElementById('googleCredentials')?.value;

            return projectId && bucket && credentials;
        }

        return false;
    }

    getCredentials() {
        if (this.currentProvider === 'aws-s3') {
            return {
                accessKey: document.getElementById('awsAccessKey').value,
                secretKey: document.getElementById('awsSecretKey').value,
                region: document.getElementById('awsRegion').value,
                bucket: document.getElementById('awsBucket').value
            };
        } else if (this.currentProvider === 'google-cloud') {
            return {
                projectId: document.getElementById('googleProjectId').value,
                bucket: document.getElementById('googleBucket').value,
                credentials: document.getElementById('googleCredentials').value
            };
        }

        return {};
    }

    showProgress() {
        if (this.progressBar) {
            this.progressBar.style.display = 'block';
        }
        if (this.progressText) {
            this.progressText.style.display = 'block';
        }
    }

    updateProgress(percent, text) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
            this.progressBar.setAttribute('aria-valuenow', percent);
        }
        if (this.progressText) {
            this.progressText.textContent = text;
        }
    }

    updateUploadButton() {
        if (this.uploadButton) {
            this.uploadButton.disabled = this.isUploading || !this.selectedFiles || this.selectedFiles.length === 0;
            this.uploadButton.innerHTML = this.isUploading ? 
                '<i class="fas fa-spinner fa-spin me-1"></i>Subiendo...' : 
                '<i class="fas fa-cloud-upload-alt me-1"></i>Subir a la Nube';
        }
    }

    resetUpload() {
        this.selectedFiles = [];
        this.updateProgress(0, '');
        if (this.progressBar) this.progressBar.style.display = 'none';
        if (this.progressText) this.progressText.style.display = 'none';
        if (this.fileList) this.fileList.innerHTML = '';
        this.updateUploadButton();
    }

    formatFileSize(bytes) {
        return app.formatFileSize(bytes);
    }

    loadConfiguration() {
        const config = localStorage.getItem('cloudUploaderConfig');
        if (config) {
            try {
                const parsedConfig = JSON.parse(config);
                this.currentProvider = parsedConfig.provider;
                
                if (this.providerSelect && this.currentProvider) {
                    this.providerSelect.value = this.currentProvider;
                    this.onProviderChange();
                }
            } catch (error) {
                console.error('Error al cargar configuración:', error);
            }
        }
    }

    saveConfiguration() {
        try {
            const config = {
                provider: this.currentProvider
            };
            localStorage.setItem('cloudUploaderConfig', JSON.stringify(config));
        } catch (error) {
            console.error('Error al guardar configuración:', error);
        }
    }
}

// Inicializar el uploader cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando CloudUploader...');
    window.cloudUploader = new CloudUploader();
}); 