"""
Grabador de Audio con Temporizador y Transcripción
Copyright (c) 2024

This file is part of the Grabador de Audio project.
Licensed under the MIT License. See LICENSE file for details.
"""

from flask import Flask, render_template, request, jsonify, session, send_from_directory
from flask_wtf.csrf import CSRFProtect
import os
from datetime import datetime
import json
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
csrf = CSRFProtect(app)

# Configuración de la aplicación
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Crear directorio de uploads si no existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    """Página principal con el temporizador y grabación de audio"""
    return render_template('index.html')

@app.route('/config')
def config():
    """Página de configuración del temporizador"""
    return render_template('config.html')

@app.route('/recordings')
def recordings():
    """Página para ver grabaciones guardadas"""
    recordings = get_recordings()
    return render_template('recordings.html', recordings=recordings)

@app.route('/upload')
def upload():
    """Página para subir archivos a la nube"""
    return render_template('upload.html')

@app.route('/test-icons')
def test_icons():
    """Página de prueba para iconos"""
    return send_from_directory('.', 'test_icons.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Servir archivos de audio desde el directorio uploads"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/start-recording', methods=['POST'])
def start_recording():
    """API para iniciar la grabación de audio"""
    try:
        # Verificar que el contenido sea JSON
        if not request.is_json:
            return jsonify({'success': False, 'error': 'Content-Type debe ser application/json'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No se recibieron datos JSON'}), 400
        
        duration = data.get('duration', 60)  # duración en segundos
        project_name = data.get('project_name', 'Proyecto sin nombre')
        
        # Validar datos
        if not project_name or project_name.strip() == '':
            return jsonify({'success': False, 'error': 'El nombre del proyecto es requerido'}), 400
        
        if not isinstance(duration, (int, float)) or duration <= 0:
            return jsonify({'success': False, 'error': 'La duración debe ser un número positivo'}), 400
        
        # Generar nombre único para el archivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{project_name}_{timestamp}.wav"
        
        session['recording_info'] = {
            'filename': filename,
            'duration': duration,
            'project_name': project_name,
            'start_time': timestamp
        }
        
        print(f"Grabación iniciada: {project_name}, duración: {duration}s, archivo: {filename}")
        
        return jsonify({
            'success': True,
            'message': 'Grabación iniciada',
            'filename': filename,
            'duration': duration
        })
    except Exception as e:
        print(f"Error en start_recording: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stop-recording', methods=['POST'])
def stop_recording():
    """API para detener la grabación de audio"""
    try:
        recording_info = session.get('recording_info')
        if not recording_info:
            return jsonify({'success': False, 'error': 'No hay grabación activa'}), 400
        
        # Aquí se procesaría el archivo de audio
        # Por ahora solo simulamos el guardado
        save_recording_info(recording_info)
        
        session.pop('recording_info', None)
        
        return jsonify({
            'success': True,
            'message': 'Grabación detenida y guardada',
            'filename': recording_info['filename']
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/save-audio', methods=['POST'])
def save_audio():
    """API para guardar el archivo de audio"""
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No se recibió archivo de audio'}), 400
        
        audio_file = request.files['audio']
        recording_info = session.get('recording_info')
        
        if not recording_info:
            return jsonify({'success': False, 'error': 'No hay información de grabación'}), 400
        
        # Guardar archivo de audio
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], recording_info['filename'])
        audio_file.save(filepath)
        
        return jsonify({
            'success': True,
            'message': 'Audio guardado correctamente',
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/upload-to-cloud', methods=['POST'])
def upload_to_cloud():
    """API para subir archivos a servicios en la nube"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No se recibió archivo'}), 400
        
        file = request.files['file']
        provider = request.form.get('provider')
        credentials_json = request.form.get('credentials')
        
        if not file or file.filename == '':
            return jsonify({'success': False, 'error': 'Archivo no válido'}), 400
        
        if not provider:
            return jsonify({'success': False, 'error': 'Proveedor no especificado'}), 400
        
        if not credentials_json:
            return jsonify({'success': False, 'error': 'Credenciales no proporcionadas'}), 400
        
        try:
            credentials = json.loads(credentials_json)
        except json.JSONDecodeError:
            return jsonify({'success': False, 'error': 'Credenciales en formato JSON inválido'}), 400
        
        # Validar archivo de audio
        if not file.content_type.startswith('audio/'):
            return jsonify({'success': False, 'error': 'El archivo debe ser de audio'}), 400
        
        # Generar nombre único para el archivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{file.filename}"
        
        result = None
        
        if provider == 'aws-s3':
            result = upload_to_aws_s3(file, filename, credentials)
        elif provider == 'google-cloud':
            result = upload_to_google_cloud(file, filename, credentials)
        else:
            return jsonify({'success': False, 'error': 'Proveedor no soportado'}), 400
        
        if result and result.get('success'):
            return jsonify({
                'success': True,
                'message': 'Archivo subido correctamente',
                'url': result.get('url'),
                'filename': filename
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Error desconocido al subir archivo')
            }), 500
            
    except Exception as e:
        print(f"Error en upload_to_cloud: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    """API para transcribir audio usando OpenAI"""
    try:
        data = request.get_json()
        filename = data.get('filename')
        aws_credentials = data.get('aws_credentials')
        openai_api_key = data.get('openai_api_key')
        
        if not filename:
            return jsonify({'success': False, 'error': 'Nombre de archivo no proporcionado'}), 400
        
        if not aws_credentials:
            return jsonify({'success': False, 'error': 'Credenciales de AWS no proporcionadas'}), 400
        
        if not openai_api_key:
            return jsonify({'success': False, 'error': 'API key de OpenAI no proporcionada'}), 400
        
        # Buscar el archivo en el directorio de uploads
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if not os.path.exists(filepath):
            return jsonify({'success': False, 'error': 'Archivo no encontrado'}), 404
        
        # Subir archivo a S3
        with open(filepath, 'rb') as file:
            from werkzeug.datastructures import FileStorage
            file_storage = FileStorage(
                stream=file,
                filename=filename,
                content_type='audio/wav'
            )
            
            upload_result = upload_to_aws_s3(file_storage, filename, aws_credentials)
            
            if not upload_result['success']:
                return jsonify({
                    'success': False,
                    'error': f"Error al subir a S3: {upload_result['error']}"
                }), 500
        
        # Transcribir con OpenAI
        audio_url = upload_result['url']
        transcript_result = transcribe_with_openai(audio_url, openai_api_key)
        
        if not transcript_result['success']:
            return jsonify({
                'success': False,
                'error': f"Error en transcripción: {transcript_result['error']}"
            }), 500
        
        # Guardar transcripción
        transcript_filename = filename.replace('.wav', '_transcript.txt')
        transcript_filepath = os.path.join(app.config['UPLOAD_FOLDER'], transcript_filename)
        
        with open(transcript_filepath, 'w', encoding='utf-8') as f:
            f.write(transcript_result['transcript'])
        
        return jsonify({
            'success': True,
            'message': 'Transcripción completada',
            'transcript': transcript_result['transcript'],
            'transcript_file': transcript_filename,
            'audio_url': audio_url
        })
        
    except Exception as e:
        print(f"Error en transcribe_audio: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/transcribe-direct', methods=['POST'])
def transcribe_direct():
    """API para transcribir audio directamente usando OpenAI Whisper"""
    try:
        # Verificar que se recibió un archivo
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No se recibió archivo de audio'}), 400
        
        audio_file = request.files['audio']
        if not audio_file or audio_file.filename == '':
            return jsonify({'success': False, 'error': 'Archivo no válido'}), 400
        
        # Verificar que es un archivo de audio
        if not audio_file.content_type.startswith('audio/'):
            return jsonify({'success': False, 'error': 'El archivo debe ser de audio'}), 400
        
        # Obtener API key de OpenAI desde variables de entorno
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key or openai_api_key == 'your-openai-api-key-here':
            return jsonify({
                'success': False, 
                'error': 'OPENAI_API_KEY no configurada. Por favor, edita el archivo .env y añade tu API key de OpenAI.'
            }), 500
        
        # Transcribir directamente
        transcript_result = transcribe_file_with_openai(audio_file, openai_api_key)
        
        if transcript_result['success']:
            # Generar nombre para el archivo de transcripción
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            transcript_filename = f"transcript_{timestamp}.txt"
            transcript_filepath = os.path.join(app.config['UPLOAD_FOLDER'], transcript_filename)
            
            # Guardar transcripción
            with open(transcript_filepath, 'w', encoding='utf-8') as f:
                f.write(transcript_result['transcript'])
            
            return jsonify({
                'success': True,
                'message': 'Transcripción completada',
                'transcript': transcript_result['transcript'],
                'transcript_file': transcript_filename
            })
        else:
            return jsonify({
                'success': False,
                'error': transcript_result['error']
            }), 500
            
    except Exception as e:
        print(f"Error en transcribe_direct: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def get_recordings():
    """Obtener lista de grabaciones guardadas"""
    recordings = []
    recordings_file = os.path.join(app.config['UPLOAD_FOLDER'], 'recordings.json')
    
    if os.path.exists(recordings_file):
        try:
            with open(recordings_file, 'r') as f:
                recordings = json.load(f)
        except:
            recordings = []
    
    return recordings

def save_recording_info(recording_info):
    """Guardar información de la grabación"""
    recordings_file = os.path.join(app.config['UPLOAD_FOLDER'], 'recordings.json')
    recordings = get_recordings()
    
    recording_info['created_at'] = datetime.now().isoformat()
    recordings.append(recording_info)
    
    with open(recordings_file, 'w') as f:
        json.dump(recordings, f, indent=2)

def upload_to_aws_s3(file, filename, credentials):
    """Subir archivo a AWS S3"""
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        # Configurar cliente S3
        s3_client = boto3.client(
            's3',
            aws_access_key_id=credentials['accessKey'],
            aws_secret_access_key=credentials['secretKey'],
            region_name=credentials['region']
        )
        
        # Subir archivo
        bucket_name = credentials['bucket']
        s3_key = f"audio/{filename}"
        
        s3_client.upload_fileobj(
            file,
            bucket_name,
            s3_key,
            ExtraArgs={'ContentType': file.content_type}
        )
        
        # Generar URL del archivo
        url = f"https://{bucket_name}.s3.{credentials['region']}.amazonaws.com/{s3_key}"
        
        return {
            'success': True,
            'url': url,
            's3_key': s3_key
        }
        
    except ClientError as e:
        print(f"Error de AWS S3: {e}")
        return {
            'success': False,
            'error': f"Error de AWS S3: {str(e)}"
        }
    except Exception as e:
        print(f"Error al subir a S3: {e}")
        return {
            'success': False,
            'error': f"Error al subir a S3: {str(e)}"
        }

def upload_to_google_cloud(file, filename, credentials):
    """Subir archivo a Google Cloud Storage"""
    try:
        from google.cloud import storage
        from google.oauth2 import service_account
        import tempfile
        
        # Crear archivo temporal con las credenciales
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(credentials['credentials'])
            credentials_file = f.name
        
        # Configurar cliente de Google Cloud Storage
        storage_client = storage.Client.from_service_account_json(credentials_file)
        bucket = storage_client.bucket(credentials['bucket'])
        
        # Subir archivo
        blob = bucket.blob(f"audio/{filename}")
        blob.upload_from_file(file, content_type=file.content_type)
        
        # Generar URL del archivo
        url = f"https://storage.googleapis.com/{credentials['bucket']}/audio/{filename}"
        
        # Limpiar archivo temporal
        os.unlink(credentials_file)
        
        return {
            'success': True,
            'url': url,
            'gcs_path': f"audio/{filename}"
        }
        
    except Exception as e:
        print(f"Error al subir a Google Cloud: {e}")
        return {
            'success': False,
            'error': f"Error al subir a Google Cloud: {str(e)}"
        }

def transcribe_with_openai(audio_url, api_key):
    """Transcribir audio usando OpenAI Whisper API"""
    try:
        import openai
        
        # Configurar cliente de OpenAI
        client = openai.OpenAI(api_key=api_key)
        
        # Descargar el archivo de audio
        import requests
        response = requests.get(audio_url)
        response.raise_for_status()
        
        # Crear archivo temporal
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_file.write(response.content)
            temp_file_path = temp_file.name
        
        try:
            # Transcribir con OpenAI
            with open(temp_file_path, 'rb') as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            
            return {
                'success': True,
                'transcript': transcript
            }
            
        finally:
            # Limpiar archivo temporal
            os.unlink(temp_file_path)
            
    except Exception as e:
        print(f"Error en transcripción: {e}")
        return {
            'success': False,
            'error': f"Error en transcripción: {str(e)}"
        }

def transcribe_file_with_openai(audio_file, api_key):
    """Transcribir archivo de audio directamente usando OpenAI Whisper API"""
    try:
        import openai
        
        # Configurar cliente de OpenAI
        client = openai.OpenAI(api_key=api_key)
        
        # Guardar el archivo temporalmente y luego enviarlo
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            audio_file.save(temp_file.name)
            temp_file_path = temp_file.name
        
        try:
            # Transcribir el archivo temporal
            with open(temp_file_path, 'rb') as file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=file,
                    response_format="text"
                )
            
            return {
                'success': True,
                'transcript': transcript
            }
            
        finally:
            # Limpiar archivo temporal
            os.unlink(temp_file_path)
        
    except Exception as e:
        print(f"Error en transcripción directa: {e}")
        return {
            'success': False,
            'error': f"Error en transcripción directa: {str(e)}"
        }

if __name__ == '__main__':
    # Excluir rutas de API de la protección CSRF
    csrf.exempt(app.view_functions['start_recording'])
    csrf.exempt(app.view_functions['stop_recording'])
    csrf.exempt(app.view_functions['save_audio'])
    csrf.exempt(app.view_functions['upload_to_cloud'])
    csrf.exempt(app.view_functions['transcribe_audio'])
    csrf.exempt(app.view_functions['transcribe_direct'])
    
    app.run(debug=True, host='0.0.0.0', port=5000) 