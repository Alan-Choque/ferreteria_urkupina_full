"""Script para probar si las URLs de placeholder.com funcionan"""
import requests

url = "https://via.placeholder.com/800x800/718096/FFFFFF?text=TEST"
try:
    r = requests.get(url, timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Content-Type: {r.headers.get('Content-Type')}")
    print(f"Length: {len(r.content)} bytes")
    if r.status_code == 200:
        print("✅ La URL funciona correctamente")
    else:
        print(f"❌ Error: Status {r.status_code}")
except Exception as e:
    print(f"❌ Error al cargar la imagen: {e}")

