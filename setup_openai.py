#!/usr/bin/env python3
"""
Script para configurar la API key de OpenAI
"""

import os
import getpass

def setup_openai_key():
    """Configurar la API key de OpenAI"""
    print("🔧 Configuración de OpenAI API Key")
    print("=" * 40)
    
    # Verificar si ya existe un archivo .env
    env_file = '.env'
    env_content = []
    
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            env_content = f.readlines()
    
    # Buscar si ya existe OPENAI_API_KEY
    openai_key_exists = False
    for i, line in enumerate(env_content):
        if line.startswith('OPENAI_API_KEY='):
            openai_key_exists = True
            current_key = line.split('=', 1)[1].strip()
            if current_key and current_key != 'your-openai-api-key-here':
                print(f"✅ API Key ya configurada: {current_key[:10]}...")
                replace = input("¿Deseas reemplazarla? (y/N): ").lower().strip()
                if replace != 'y':
                    print("Configuración cancelada.")
                    return
                break
    
    # Solicitar nueva API key
    print("\n📝 Para obtener tu API key de OpenAI:")
    print("1. Ve a https://platform.openai.com/api-keys")
    print("2. Crea una nueva API key")
    print("3. Copia la key (comienza con 'sk-')")
    print()
    
    api_key = getpass.getpass("Ingresa tu API key de OpenAI (sk-...): ").strip()
    
    if not api_key:
        print("❌ No se ingresó una API key.")
        return
    
    if not api_key.startswith('sk-'):
        print("❌ La API key debe comenzar con 'sk-'")
        return
    
    # Actualizar o crear archivo .env
    if openai_key_exists:
        # Reemplazar línea existente
        for i, line in enumerate(env_content):
            if line.startswith('OPENAI_API_KEY='):
                env_content[i] = f'OPENAI_API_KEY={api_key}\n'
                break
    else:
        # Añadir nueva línea
        env_content.append(f'OPENAI_API_KEY={api_key}\n')
    
    # Asegurar que SECRET_KEY esté presente
    secret_key_exists = any(line.startswith('SECRET_KEY=') for line in env_content)
    if not secret_key_exists:
        env_content.append('SECRET_KEY=dev-secret-key-change-in-production\n')
    
    # Escribir archivo
    with open(env_file, 'w') as f:
        f.writelines(env_content)
    
    print(f"✅ API key configurada exitosamente!")
    print(f"📁 Archivo actualizado: {env_file}")
    print("\n🚀 Ahora puedes usar la transcripción directa en la aplicación.")

if __name__ == '__main__':
    setup_openai_key() 