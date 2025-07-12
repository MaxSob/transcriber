# Grabador de Audio con Temporizador y Transcripción

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)](https://flask.palletsprojects.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Whisper-orange.svg)](https://openai.com/)

Una aplicación web completa para grabar audio con temporizador configurable, subir archivos a la nube y transcribir audio usando OpenAI Whisper.

## Características Principales

### 🎙️ Grabación de Audio
- **Temporizador configurable**: Establece duraciones personalizadas (10-3600 segundos)
- **Grabación en tiempo real**: Visualización de audio con MediaRecorder API
- **Reproducción integrada**: Reproductor de audio en la misma página
- **Gestión de grabaciones**: Descarga, reproducción y eliminación de archivos

### ☁️ Subida a la Nube
- **Soporte para AWS S3**: Subida directa a buckets de Amazon S3
- **Soporte para Google Cloud Storage**: Integración con Google Cloud
- **Drag & Drop**: Interfaz intuitiva para seleccionar archivos
- **Progreso en tiempo real**: Barra de progreso durante la subida

### 📝 Transcripción de Audio
- **Transcripción con S3 + OpenAI**: Sube a S3 y transcribe con Whisper
- **Transcripción directa**: Usa OpenAI Whisper directamente desde el servidor
- **Configuración de credenciales**: Interfaz para configurar AWS y OpenAI
- **Descarga de transcripciones**: Guarda y descarga archivos de texto

## Instalación

### Prerrequisitos
- Python 3.8+
- Conda (recomendado)

### Configuración del Ambiente

1. **Crear ambiente conda:**
```bash
conda create -n transcriber python=3.12
conda activate transcriber
```

2. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

3. **Configurar variables de entorno:**
```bash
# Editar el archivo .env
OPENAI_API_KEY=tu-api-key-de-openai-aqui
SECRET_KEY=tu-clave-secreta-aqui
```

## Uso

### Iniciar la aplicación:
```bash
python app.py
```

La aplicación estará disponible en: `http://127.0.0.1:5000`

### Funcionalidades

#### 1. Grabación de Audio
- Ve a la página principal
- Configura el temporizador y nombre del proyecto
- Haz clic en "Iniciar Temporizador"
- Haz clic en "Iniciar Grabación"
- Habla por el micrófono
- Detén la grabación cuando termines

#### 2. Subida a la Nube
- Ve a "Subir a Nube" en el menú
- Selecciona tu proveedor (AWS S3 o Google Cloud)
- Configura las credenciales
- Arrastra archivos de audio o haz clic para seleccionar
- Haz clic en "Subir a la Nube"

#### 3. Transcripción de Audio
- Ve a "Grabaciones" en el menú
- Para cada grabación tienes dos opciones:

**Transcripción con S3:**
- Haz clic en el botón azul (📄)
- Configura credenciales de AWS S3 y OpenAI
- El archivo se subirá a S3 y luego se transcribirá

**Transcripción Directa:**
- Haz clic en el botón amarillo (⚡)
- Usa la API key de OpenAI configurada en el servidor
- Transcribe directamente sin subir a S3

## Configuración de Credenciales

### AWS S3
1. Crea un bucket en AWS S3
2. Genera Access Key ID y Secret Access Key
3. Configura permisos de bucket apropiados

### Google Cloud Storage
1. Crea un proyecto en Google Cloud
2. Crea un Service Account con permisos de Storage
3. Descarga el archivo JSON de credenciales

### OpenAI
1. Obtén una API key de OpenAI
2. Configúrala en el archivo `.env` para transcripción directa
3. O úsala en el modal de transcripción con S3

## Estructura del Proyecto

```
transcribe/
├── app.py                 # Aplicación principal Flask
├── requirements.txt       # Dependencias de Python
├── .env                  # Variables de entorno
├── templates/            # Plantillas HTML
│   ├── base.html         # Plantilla base
│   ├── index.html        # Página principal
│   ├── recordings.html   # Lista de grabaciones
│   └── upload.html       # Subida a la nube
├── static/               # Archivos estáticos
│   ├── css/
│   │   └── style.css     # Estilos personalizados
│   └── js/
│       ├── main.js       # Funciones principales
│       ├── timer.js      # Lógica del temporizador
│       ├── recorder.js   # Grabación de audio
│       ├── player.js     # Reproductor de audio
│       ├── upload.js     # Subida a la nube
│       └── transcribe.js # Transcripción de audio
└── uploads/              # Directorio de archivos subidos
```

## APIs Disponibles

### Grabación
- `POST /api/start-recording` - Iniciar grabación
- `POST /api/stop-recording` - Detener grabación
- `POST /api/save-audio` - Guardar archivo de audio

### Subida a la Nube
- `POST /api/upload-to-cloud` - Subir archivo a S3 o Google Cloud

### Transcripción
- `POST /api/transcribe` - Transcribir con S3 + OpenAI
- `POST /api/transcribe-direct` - Transcribir directamente con OpenAI

## Pruebas

### Probar Iconos
Si los iconos no se muestran correctamente, visita:
```
http://127.0.0.1:5000/test-icons
```

### Probar Grabación Básica
Para probar solo la grabación sin la aplicación completa:
```
http://127.0.0.1:5000/test.html
```

## Tecnologías Utilizadas

- **Backend**: Flask, Python
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Iconos**: Font Awesome 6
- **Audio**: MediaRecorder API, Web Audio API
- **Cloud**: AWS S3, Google Cloud Storage
- **AI**: OpenAI Whisper API

## Notas de Seguridad

- Las credenciales se envían de forma segura y no se almacenan en el servidor
- La API key de OpenAI se puede configurar como variable de entorno
- Los archivos se guardan localmente en el directorio `uploads/`
- Usa HTTPS en producción para mayor seguridad

## Solución de Problemas

### Los iconos no se muestran
1. Verifica la conexión a internet
2. Visita `/test-icons` para probar
3. Revisa la consola del navegador para errores

### Error de permisos de micrófono
1. Asegúrate de que el navegador tenga permisos
2. Prueba en modo incógnito
3. Verifica que el micrófono esté conectado

### Error de transcripción
1. Verifica que la API key de OpenAI sea válida
2. Asegúrate de que el archivo de audio sea válido
3. Revisa los logs del servidor para más detalles

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

### ¿Qué significa la Licencia MIT?

La Licencia MIT es una de las licencias de código abierto más permisivas. Te permite:

- ✅ **Usar** el software para cualquier propósito
- ✅ **Modificar** el código fuente
- ✅ **Distribuir** copias del software
- ✅ **Usar comercialmente** sin restricciones
- ✅ **Sublicenciar** el software

**Única condición:** Debes incluir la notificación de copyright y la licencia en todas las copias o porciones sustanciales del software.

### Atribución

Si usas este proyecto en tu trabajo, considera incluir una referencia:

```markdown
Grabador de Audio con Temporizador y Transcripción
https://github.com/tu-usuario/transcribe
Licencia MIT
``` 