#!/usr/bin/env python3
"""Script para ejecutar la optimización de base de datos."""
import sys
import os
from pathlib import Path

# Agregar el directorio raíz del proyecto al path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "backend"))

from sqlalchemy import create_engine, text
from app.core.config import settings

def execute_sql_file(file_path: Path) -> None:
    """Ejecuta un archivo SQL completo."""
    print(f"Leyendo archivo SQL: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Dividir el contenido en comandos individuales (separados por GO)
    # SQL Server usa GO como separador de lotes
    commands = []
    current_command = []
    
    for line in sql_content.split('\n'):
        line_stripped = line.strip()
        if line_stripped.upper() == 'GO':
            if current_command:
                commands.append('\n'.join(current_command))
                current_command = []
        else:
            current_command.append(line)
    
    # Agregar el último comando si existe
    if current_command:
        commands.append('\n'.join(current_command))
    
    print(f"Se encontraron {len(commands)} lotes de comandos SQL")
    print("=" * 60)
    
    try:
        engine = create_engine(settings.database_url, pool_pre_ping=True)
        with engine.begin() as conn:  # begin() crea una transacción
            for i, command in enumerate(commands, 1):
                command_clean = command.strip()
                if not command_clean or command_clean.startswith('--'):
                    continue
                
                print(f"\nEjecutando lote {i}/{len(commands)}...")
                try:
                    # Ejecutar el comando
                    result = conn.execute(text(command_clean))
                    
                    # Si hay resultados, imprimirlos (para PRINT statements)
                    # Nota: PRINT statements en SQL Server no se capturan fácilmente
                    # pero el script SQL los imprimirá en la consola del servidor
                    
                except Exception as e:
                    print(f"ERROR en lote {i}: {e}")
                    print(f"Comando que falló:\n{command_clean[:200]}...")
                    raise
        
        print("\n" + "=" * 60)
        print("✅ OPTIMIZACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 60)
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"❌ ERROR: {e}")
        print("=" * 60)
        print("\nLa transacción se revirtió automáticamente.")
        sys.exit(1)

if __name__ == "__main__":
    script_path = Path(__file__).parent / "optimize_database.sql"
    
    if not script_path.exists():
        print(f"❌ Error: No se encontró el archivo {script_path}")
        sys.exit(1)
    
    print("=" * 60)
    print("OPTIMIZACIÓN DE BASE DE DATOS")
    print("Ferretería Urkupina")
    print("=" * 60)
    print("\n⚠️  ADVERTENCIA:")
    print("   - Este script eliminará tablas no utilizadas")
    print("   - Creará índices de optimización")
    print("   - Se ejecutará en una transacción (se revierte si falla)")
    print("\n⚠️  RECOMENDACIÓN: Hacer backup antes de continuar")
    print("\n" + "=" * 60)
    
    respuesta = input("\n¿Deseas continuar? (escribe 'SI' para confirmar): ")
    if respuesta.upper() != 'SI':
        print("Operación cancelada.")
        sys.exit(0)
    
    print("\nIniciando optimización...\n")
    execute_sql_file(script_path)

