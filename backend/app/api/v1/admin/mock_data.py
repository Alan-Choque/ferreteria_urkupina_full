"""
Endpoints para insertar y eliminar datos de prueba en la base de datos
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import require_role
from app.models.usuario import Usuario, Rol
from app.models.cliente import Cliente
from app.models.producto import Producto
from app.models.variante_producto import VarianteProducto, UnidadMedida
from app.models.venta import OrdenVenta, ItemOrdenVenta
from app.models.compra import OrdenCompra, ItemOrdenCompra
from app.models.proveedor import Proveedor
from app.models.categoria import Categoria
from app.models.marca import Marca
from app.core.security import get_password_hash
from datetime import datetime, timedelta
from decimal import Decimal
import random

router = APIRouter()

# IDs de datos mock para poder eliminarlos después
MOCK_DATA_IDS = {
    "users": [],
    "customers": [],
    "suppliers": [],
    "categories": [],
    "brands": [],
    "products": [],
    "variants": [],
    "sales": [],
    "purchases": [],
}

@router.post("/insert")
def insert_mock_data(
    db: Session = Depends(get_db),
    _: object = Depends(require_role("ADMIN")),
):
    """Inserta datos de prueba en la base de datos"""
    try:
        # Obtener roles necesarios
        admin_role = db.query(Rol).filter(Rol.nombre == "ADMIN").first()
        ventas_role = db.query(Rol).filter(Rol.nombre == "VENTAS").first()
        inventarios_role = db.query(Rol).filter(Rol.nombre == "INVENTARIOS").first()
        supervisor_role = db.query(Rol).filter(Rol.nombre == "SUPERVISOR").first()
        
        # Si no existen roles, usar el primero disponible o crear uno por defecto
        default_role = admin_role or ventas_role or inventarios_role or supervisor_role
        if not default_role:
            # Si no hay ningún rol, obtener el primero que exista
            default_role = db.query(Rol).first()
            if not default_role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se encontraron roles en la base de datos. Por favor, crea al menos un rol primero."
                )
        
        # Limpiar IDs anteriores
        for key in MOCK_DATA_IDS:
            MOCK_DATA_IDS[key] = []
        
        # 1. Insertar usuarios de prueba (10 usuarios) - Nombres realistas
        mock_users_data = [
            {"nombre": "Roberto Mamani", "email": "roberto.mamani@ferreteria.com", "role": admin_role or default_role},
            {"nombre": "María Choque", "email": "maria.choque@ferreteria.com", "role": ventas_role or default_role},
            {"nombre": "Carlos Fernández", "email": "carlos.fernandez@ferreteria.com", "role": inventarios_role or default_role},
            {"nombre": "Ana Rojas", "email": "ana.rojas@ferreteria.com", "role": ventas_role or default_role},
            {"nombre": "Luis García", "email": "luis.garcia@ferreteria.com", "role": supervisor_role or default_role},
            {"nombre": "Carmen López", "email": "carmen.lopez@ferreteria.com", "role": ventas_role or default_role},
            {"nombre": "Pedro Sánchez", "email": "pedro.sanchez@ferreteria.com", "role": inventarios_role or default_role},
            {"nombre": "Laura Fernández", "email": "laura.fernandez@ferreteria.com", "role": supervisor_role or default_role},
            {"nombre": "Miguel Torres", "email": "miguel.torres@ferreteria.com", "role": ventas_role or default_role},
            {"nombre": "Sofía Ramírez", "email": "sofia.ramirez@ferreteria.com", "role": inventarios_role or default_role},
        ]
        
        mock_user_ids = []
        now = datetime.now()
        for user_data in mock_users_data:
            if not db.query(Usuario).filter(Usuario.correo == user_data["email"]).first():
                user = Usuario(
                    nombre_usuario=user_data["nombre"],
                    correo=user_data["email"],
                    hash_contrasena=get_password_hash("Test1234!"),
                    activo=True,
                    fecha_creacion=now,
                    fecha_modificacion=now,
                )
                if user_data["role"]:
                    user.roles.append(user_data["role"])
                db.add(user)
                db.flush()
                MOCK_DATA_IDS["users"].append(user.id)
                mock_user_ids.append(user.id)
        
        # 2. Insertar clientes de prueba (30 clientes) - Datos realistas bolivianos
        nombres_clientes = [
            {"nombre": "Juan Carlos Mamani Quispe", "email": "juan.mamani@gmail.com", "telefono": "70123456", "nit_ci": "12345678"},
            {"nombre": "María Elena Choque Condori", "email": "maria.choque@hotmail.com", "telefono": "71234567", "nit_ci": "23456789"},
            {"nombre": "Carlos Alberto Fernández Vargas", "email": "carlos.fernandez@yahoo.com", "telefono": "72345678", "nit_ci": "34567890"},
            {"nombre": "Ana Patricia Rojas Huanca", "email": "ana.rojas@gmail.com", "telefono": "73456789", "nit_ci": "45678901"},
            {"nombre": "Luis Fernando García Morales", "email": "luis.garcia@outlook.com", "telefono": "74567890", "nit_ci": "56789012"},
            {"nombre": "Carmen Rosa López Apaza", "email": "carmen.lopez@gmail.com", "telefono": "75678901", "nit_ci": "67890123"},
            {"nombre": "Pedro Antonio Sánchez Yujra", "email": "pedro.sanchez@hotmail.com", "telefono": "76789012", "nit_ci": "78901234"},
            {"nombre": "Laura Beatriz Fernández Ticona", "email": "laura.fernandez@gmail.com", "telefono": "77890123", "nit_ci": "89012345"},
            {"nombre": "Miguel Ángel Torres Quispe", "email": "miguel.torres@yahoo.com", "telefono": "78901234", "nit_ci": "90123456"},
            {"nombre": "Sofía Alejandra Ramírez Mamani", "email": "sofia.ramirez@gmail.com", "telefono": "79012345", "nit_ci": "11223344"},
            {"nombre": "Diego Andrés Morales Condori", "email": "diego.morales@outlook.com", "telefono": "70111222", "nit_ci": "22334455"},
            {"nombre": "Elena María Castro Huanca", "email": "elena.castro@gmail.com", "telefono": "71222333", "nit_ci": "33445566"},
            {"nombre": "Roberto José Vargas Apaza", "email": "roberto.vargas@hotmail.com", "telefono": "72333444", "nit_ci": "44556677"},
            {"nombre": "Isabel Cristina Jiménez Yujra", "email": "isabel.jimenez@gmail.com", "telefono": "73444555", "nit_ci": "55667788"},
            {"nombre": "Fernando Luis Ruiz Ticona", "email": "fernando.ruiz@yahoo.com", "telefono": "74555666", "nit_ci": "66778899"},
            {"nombre": "Patricia Alejandra Herrera Quispe", "email": "patricia.herrera@gmail.com", "telefono": "75666777", "nit_ci": "77889900"},
            {"nombre": "Jorge Eduardo Mendoza Mamani", "email": "jorge.mendoza@outlook.com", "telefono": "76777888", "nit_ci": "88990011"},
            {"nombre": "Gabriela Susana Silva Condori", "email": "gabriela.silva@gmail.com", "telefono": "77888999", "nit_ci": "99001122"},
            {"nombre": "Ricardo Daniel Ortega Huanca", "email": "ricardo.ortega@hotmail.com", "telefono": "78999000", "nit_ci": "10111213"},
            {"nombre": "Natalia Fernanda Rojas Apaza", "email": "natalia.rojas@gmail.com", "telefono": "79000111", "nit_ci": "11121314"},
            {"nombre": "Andrés Felipe Moreno Yujra", "email": "andres.moreno@yahoo.com", "telefono": "70112233", "nit_ci": "12131415"},
            {"nombre": "Valentina Andrea Paredes Ticona", "email": "valentina.paredes@gmail.com", "telefono": "71223344", "nit_ci": "13141516"},
            {"nombre": "Sebastián Ignacio Vega Quispe", "email": "sebastian.vega@outlook.com", "telefono": "72334455", "nit_ci": "14151617"},
            {"nombre": "Camila Esperanza Flores Mamani", "email": "camila.flores@gmail.com", "telefono": "73445566", "nit_ci": "15161718"},
            {"nombre": "Daniel Esteban Espinoza Condori", "email": "daniel.espinoza@hotmail.com", "telefono": "74556677", "nit_ci": "16171819"},
            {"nombre": "Mariana Isabel Guzmán Huanca", "email": "mariana.guzman@gmail.com", "telefono": "75667788", "nit_ci": "17181920"},
            {"nombre": "Alejandro Martín Soto Apaza", "email": "alejandro.soto@yahoo.com", "telefono": "76778899", "nit_ci": "18192021"},
            {"nombre": "Andrea Carolina Méndez Yujra", "email": "andrea.mendez@gmail.com", "telefono": "77889900", "nit_ci": "19202122"},
            {"nombre": "Felipe Santiago Campos Ticona", "email": "felipe.campos@outlook.com", "telefono": "78990011", "nit_ci": "20212223"},
            {"nombre": "Lucía Valentina Ríos Quispe", "email": "lucia.rios@gmail.com", "telefono": "79001122", "nit_ci": "21222324"},
        ]
        
        mock_customer_ids = []
        direcciones_bolivia = [
            "Av. 16 de Julio #1234, La Paz",
            "Calle Comercio #567, El Alto",
            "Av. Mariscal Santa Cruz #890, La Paz",
            "Zona San Jorge, Calle 5 #234, El Alto",
            "Av. 6 de Marzo #456, La Paz",
            "Barrio Villa Esperanza, Calle Principal, El Alto",
            "Av. Periférica #789, La Paz",
            "Zona Alto Lima, Calle 10 #123, El Alto",
            "Av. Arce #345, La Paz",
            "Barrio Villa Adela, Av. Principal, El Alto",
            "Calle Potosí #678, La Paz",
            "Zona Villa Copacabana, Calle 3 #901, El Alto",
            "Av. Montes #234, La Paz",
            "Barrio Alto Obrajes, Calle 7 #567, La Paz",
            "Zona Villa Fátima, Av. Principal, El Alto",
            "Calle Loayza #890, La Paz",
            "Av. Illimani #123, El Alto",
            "Barrio Sopocachi, Calle 11 #456, La Paz",
            "Zona Villa San Antonio, Av. Principal, El Alto",
            "Calle Sagárnaga #789, La Paz",
            "Av. Tiahuanaco #234, El Alto",
            "Barrio Miraflores, Calle 8 #567, La Paz",
            "Zona Villa Bolívar, Av. Principal, El Alto",
            "Calle Mercado #901, La Paz",
            "Av. Buenos Aires #345, El Alto",
            "Barrio Obrajes, Calle 12 #678, La Paz",
            "Zona Villa Victoria, Av. Principal, El Alto",
            "Calle Linares #234, La Paz",
            "Av. Sucre #567, El Alto",
            "Barrio Calacoto, Calle 9 #890, La Paz",
        ]
        
        for i, customer_data in enumerate(mock_customers_data):
            if not db.query(Cliente).filter(Cliente.correo == customer_data["email"]).first():
                customer = Cliente(
                    nombre=customer_data["nombre"],
                    correo=customer_data["email"],
                    telefono=customer_data["telefono"],
                    nit_ci=customer_data["nit_ci"],
                    direccion=direcciones_bolivia[i] if i < len(direcciones_bolivia) else None,
                    fecha_registro=datetime.now() - timedelta(days=random.randint(1, 365)),
                )
                db.add(customer)
                db.flush()
                MOCK_DATA_IDS["customers"].append(customer.id)
                mock_customer_ids.append(customer.id)
        
        # 3. Insertar proveedores de prueba (15 proveedores) - Empresas realistas bolivianas
        nombres_proveedores = [
            {"nombre": "Ferretería Nacional S.A.", "email": "ventas@ferreterianacional.com.bo", "telefono": "2201234", "nit_ci": "1234567017"},
            {"nombre": "Materiales Construcción Ltda.", "email": "contacto@materialesconstruccion.bo", "telefono": "2202345", "nit_ci": "2345678018"},
            {"nombre": "Herramientas Pro SRL", "email": "info@herramientaspro.com.bo", "telefono": "2203456", "nit_ci": "3456789019"},
            {"nombre": "Distribuidora Industrial Bolivia", "email": "ventas@distribuidoraindustrial.bo", "telefono": "2204567", "nit_ci": "4567890120"},
            {"nombre": "Suministros Técnicos S.A.", "email": "contacto@suministrostecnicos.com.bo", "telefono": "2205678", "nit_ci": "5678901231"},
            {"nombre": "Importadora Ferretería del Altiplano", "email": "info@importadoraferreteria.bo", "telefono": "2206789", "nit_ci": "6789012342"},
            {"nombre": "Comercializadora Metálica Ltda.", "email": "ventas@comercializadorametalica.com.bo", "telefono": "2207890", "nit_ci": "7890123453"},
            {"nombre": "Distribuidora Eléctrica Bolivia", "email": "contacto@distribuidoraelectrica.bo", "telefono": "2208901", "nit_ci": "8901234564"},
            {"nombre": "Materiales Premium S.A.", "email": "info@materialespremium.com.bo", "telefono": "2209012", "nit_ci": "9012345675"},
            {"nombre": "Ferretería del Sur SRL", "email": "ventas@ferreteriadel sur.bo", "telefono": "2200123", "nit_ci": "1123456786"},
            {"nombre": "Construcción Express Ltda.", "email": "contacto@construccionexpress.com.bo", "telefono": "2201234", "nit_ci": "2234567897"},
            {"nombre": "Herramientas y Más S.A.", "email": "info@herramientasymas.bo", "telefono": "2202345", "nit_ci": "3345678908"},
            {"nombre": "Distribuidora Global Bolivia", "email": "ventas@distribuidoraglobal.com.bo", "telefono": "2203456", "nit_ci": "4456789019"},
            {"nombre": "Materiales del Valle SRL", "email": "contacto@materialesdelvalle.bo", "telefono": "2204567", "nit_ci": "5567890120"},
            {"nombre": "Ferretería Central Ltda.", "email": "info@ferreteriacentral.com.bo", "telefono": "2205678", "nit_ci": "6678901231"},
        ]
        
        mock_supplier_ids = []
        direcciones_proveedores = [
            "Av. 16 de Julio #2345, Zona Central, La Paz",
            "Calle Comercio #890, Zona Industrial, El Alto",
            "Av. Mariscal Santa Cruz #1234, La Paz",
            "Zona San Jorge, Calle Industrial #567, El Alto",
            "Av. 6 de Marzo #3456, La Paz",
            "Barrio Villa Esperanza, Av. Industrial, El Alto",
            "Av. Periférica #7890, La Paz",
            "Zona Alto Lima, Calle 20 #123, El Alto",
            "Av. Arce #4567, La Paz",
            "Barrio Villa Adela, Av. Comercial, El Alto",
            "Calle Potosí #8901, La Paz",
            "Zona Villa Copacabana, Av. Industrial #234, El Alto",
            "Av. Montes #5678, La Paz",
            "Barrio Alto Obrajes, Calle 15 #567, La Paz",
            "Zona Villa Fátima, Av. Comercial, El Alto",
        ]
        
        for i, supplier_data in enumerate(nombres_proveedores):
            if not db.query(Proveedor).filter(Proveedor.correo == supplier_data["email"]).first():
                supplier = Proveedor(
                    nombre=supplier_data["nombre"],
                    correo=supplier_data["email"],
                    telefono=supplier_data["telefono"],
                    nit_ci=supplier_data["nit_ci"],
                    direccion=direcciones_proveedores[i] if i < len(direcciones_proveedores) else None,
                    fecha_registro=datetime.now() - timedelta(days=random.randint(30, 365)),
                )
                db.add(supplier)
                db.flush()
                MOCK_DATA_IDS["suppliers"].append(supplier.id)
                mock_supplier_ids.append(supplier.id)
        
        # 4. Obtener o crear categorías y marcas realistas
        categorias_nombres = [
            {"nombre": "Herramientas Manuales", "descripcion": "Herramientas de mano para construcción y carpintería"},
            {"nombre": "Herramientas Eléctricas", "descripcion": "Herramientas eléctricas e inalámbricas profesionales"},
            {"nombre": "Pinturas y Acabados", "descripcion": "Pinturas, barnices, selladores y productos de acabado"},
            {"nombre": "Materiales Eléctricos", "descripcion": "Cables, interruptores, tomacorrientes y accesorios eléctricos"},
            {"nombre": "Plomería", "descripcion": "Tuberías, conexiones, válvulas y accesorios de plomería"},
            {"nombre": "Materiales de Construcción", "descripcion": "Cemento, arena, ladrillos, varillas y materiales estructurales"},
            {"nombre": "Ferretería General", "descripcion": "Tornillos, clavos, bisagras, cerraduras y accesorios generales"},
        ]
        
        categorias_map = {}
        for cat_data in categorias_nombres:
            categoria = db.query(Categoria).filter(Categoria.nombre == cat_data["nombre"]).first()
            if not categoria:
                categoria = Categoria(
                    nombre=cat_data["nombre"],
                    descripcion=cat_data["descripcion"],
                    fecha_creacion=datetime.now(),
                )
                db.add(categoria)
                db.flush()
                MOCK_DATA_IDS["categories"].append(categoria.id)
            categorias_map[cat_data["nombre"]] = categoria.id
        
        # Usar la primera categoría como default si no hay ninguna
        categoria_default = categorias_map.get("Herramientas Manuales") or list(categorias_map.values())[0] if categorias_map else None
        if not categoria_default:
            categoria_default_obj = db.query(Categoria).first()
            if categoria_default_obj:
                categoria_default = categoria_default_obj.id
        
        marcas_nombres = [
            {"nombre": "Truper", "descripcion": "Herramientas profesionales de calidad"},
            {"nombre": "Bosch", "descripcion": "Herramientas eléctricas de alta tecnología"},
            {"nombre": "Monopol", "descripcion": "Pinturas y productos de acabado premium"},
            {"nombre": "Tigre", "descripcion": "Tuberías y conexiones de PVC de calidad"},
            {"nombre": "Yale", "descripcion": "Cerraduras y sistemas de seguridad"},
            {"nombre": "Sika", "descripcion": "Materiales de construcción y selladores"},
        ]
        
        marcas_map = {}
        for marca_data in marcas_nombres:
            marca = db.query(Marca).filter(Marca.nombre == marca_data["nombre"]).first()
            if not marca:
                marca = Marca(
                    nombre=marca_data["nombre"],
                    descripcion=marca_data["descripcion"],
                    fecha_creacion=datetime.now(),
                )
                db.add(marca)
                db.flush()
                MOCK_DATA_IDS["brands"].append(marca.id)
            marcas_map[marca_data["nombre"]] = marca.id
        
        # Usar la primera marca como default
        marca_default = marcas_map.get("Truper") or list(marcas_map.values())[0] if marcas_map else None
        if not marca_default:
            marca_default_obj = db.query(Marca).first()
            if marca_default_obj:
                marca_default = marca_default_obj.id
        
        # 5. Obtener unidad de medida (usar existente o crear)
        unidad_medida = db.query(UnidadMedida).first()
        if not unidad_medida:
            unidad_medida = UnidadMedida(
                nombre="Unidad",
                simbolo="U",
                descripcion="Unidad de medida de prueba",
                fecha_creacion=datetime.now(),
            )
            db.add(unidad_medida)
            db.flush()
        
        # Validar que tenemos unidad de medida
        if not unidad_medida or not unidad_medida.id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo crear o encontrar una unidad de medida."
            )
        
        # 6. Insertar productos de prueba con variantes (50 productos) - Productos realistas de ferretería
        mock_products_data = [
            # Herramientas Manuales
            {"nombre": "Martillo de Acero Forjado 20 oz", "precio": 45.00, "descripcion": "Martillo profesional con mango de fibra de vidrio, cabeza de acero forjado de 20 onzas. Ideal para trabajos de construcción y carpintería."},
            {"nombre": "Taladro Percutor Inalámbrico 18V", "precio": 350.00, "descripcion": "Taladro percutor inalámbrico de 18V con batería de litio, incluye cargador rápido y maletín. Perfecto para perforar madera, metal y concreto."},
            {"nombre": "Set de Destornilladores Profesional 6 piezas", "precio": 25.00, "descripcion": "Set completo de destornilladores con puntas planas y Phillips en diferentes tamaños. Mangos ergonómicos antideslizantes."},
            {"nombre": "Llave Ajustable de 8 Pulgadas", "precio": 35.00, "descripcion": "Llave inglesa ajustable de 8 pulgadas, acero cromado resistente a la corrosión. Apertura máxima de 24mm."},
            {"nombre": "Alicate Universal de Corte", "precio": 28.00, "descripcion": "Alicate universal con función de corte y presión. Mango aislado, ideal para trabajos eléctricos y generales."},
            {"nombre": "Serrucho de Mano para Madera 24 pulgadas", "precio": 42.00, "descripcion": "Serrucho de mano con hoja de acero templado de 24 pulgadas. Dientes afilados para corte preciso en madera."},
            {"nombre": "Nivel de Burbuja Aluminio 60cm", "precio": 18.00, "descripcion": "Nivel de burbuja profesional de aluminio de 60cm con 3 cámaras (horizontal, vertical y 45°). Precisión garantizada."},
            {"nombre": "Cinta Métrica de 5 Metros", "precio": 12.00, "descripcion": "Cinta métrica retráctil de 5 metros con cinta de acero flexible. Gancho metálico resistente."},
            {"nombre": "Sierra Circular Eléctrica 7 1/4 pulgadas", "precio": 280.00, "descripcion": "Sierra circular eléctrica de 7 1/4 pulgadas, 1800W de potencia. Incluye hoja de corte y guía paralela."},
            {"nombre": "Pistola Neumática de Clavos", "precio": 150.00, "descripcion": "Pistola neumática para clavos de 2 pulgadas. Requiere compresor de aire. Ideal para trabajos de construcción rápida."},
            # Pinturas y Acabados
            {"nombre": "Pintura Acrílica Blanca Mate 4 Litros", "precio": 125.00, "descripcion": "Pintura acrílica blanca de acabado mate, alta cobertura. Ideal para interiores, secado rápido y fácil aplicación."},
            {"nombre": "Pintura Acrílica Beige 4 Litros", "precio": 125.00, "descripcion": "Pintura acrílica color beige mate de 4 litros. Perfecta para interiores, cubre aproximadamente 12m² por litro."},
            {"nombre": "Esmalte Sintético Blanco 1 Galón", "precio": 95.00, "descripcion": "Esmalte sintético blanco brillante de 1 galón. Resistente a la intemperie, ideal para exteriores y muebles."},
            {"nombre": "Barniz Transparente para Madera 1 Litro", "precio": 85.00, "descripcion": "Barniz transparente de alta calidad para protección de muebles y estructuras de madera. Acabado satinado."},
            {"nombre": "Primer Sellador Universal 1 Galón", "precio": 75.00, "descripcion": "Primer sellador universal de base acrílica. Mejora la adherencia y reduce el consumo de pintura. Cubre 10-12m² por litro."},
            {"nombre": "Pintura en Aerosol Color Negro 400ml", "precio": 22.00, "descripcion": "Pintura en aerosol color negro mate de 400ml. Ideal para trabajos de retoque y proyectos pequeños."},
            # Materiales Eléctricos
            {"nombre": "Cable Eléctrico THWN 2.5mm² por Metro", "precio": 20.00, "descripcion": "Cable eléctrico THWN de 2.5mm² por metro. Resistente al calor y humedad, ideal para instalaciones residenciales."},
            {"nombre": "Cable Eléctrico THWN 4mm² por Metro", "precio": 32.00, "descripcion": "Cable eléctrico THWN de 4mm² por metro. Mayor capacidad de corriente, perfecto para circuitos de mayor consumo."},
            {"nombre": "Interruptor Simple de Pared", "precio": 8.00, "descripcion": "Interruptor simple de encendido/apagado para instalación empotrada. Color blanco estándar."},
            {"nombre": "Tomacorriente Doble con Tierra", "precio": 15.00, "descripcion": "Tomacorriente doble con conexión a tierra. Incluye protección contra sobretensión. Color blanco."},
            {"nombre": "Foco LED Blanco Cálido 12W", "precio": 18.00, "descripcion": "Foco LED de 12W equivalente a 100W incandescente. Luz blanca cálida, vida útil de 25,000 horas."},
            {"nombre": "Tubo LED 18W 1.2 Metros", "precio": 35.00, "descripcion": "Tubo LED de 18W de 1.2 metros. Reemplazo directo para tubos fluorescentes. Luz blanca fría."},
            {"nombre": "Breaker Termomagnético 20 Amperios", "precio": 45.00, "descripcion": "Breaker termomagnético de 20 amperios, monofásico. Protección contra sobrecarga y cortocircuito."},
            {"nombre": "Caja Eléctrica Rectangular 4x2", "precio": 12.00, "descripcion": "Caja eléctrica rectangular de 4x2 pulgadas para instalación empotrada. Incluye tapa blanca."},
            # Materiales de Plomería
            {"nombre": "Tubería PVC Agua Potable 1/2 pulgada x 3m", "precio": 12.00, "descripcion": "Tubería de PVC para agua potable de 1/2 pulgada, 3 metros de longitud. Presión máxima 10kg/cm²."},
            {"nombre": "Tubería PVC Agua Potable 3/4 pulgada x 3m", "precio": 18.00, "descripcion": "Tubería de PVC para agua potable de 3/4 pulgada, 3 metros. Mayor diámetro para mayor flujo."},
            {"nombre": "Codo PVC 90° 1/2 pulgada", "precio": 5.00, "descripcion": "Codo de PVC de 90 grados para tubería de 1/2 pulgada. Conexión perfecta para cambios de dirección."},
            {"nombre": "Tee PVC 1/2 pulgada", "precio": 6.00, "descripcion": "Conexión en T de PVC para tubería de 1/2 pulgada. Permite derivaciones en instalaciones de agua."},
            {"nombre": "Válvula de Compuerta 1/2 pulgada", "precio": 45.00, "descripcion": "Válvula de compuerta de latón de 1/2 pulgada. Control total del flujo de agua, rosca hembra."},
            {"nombre": "Llave de Paso 1/2 pulgada", "precio": 28.00, "descripcion": "Llave de paso de latón de 1/2 pulgada. Cierre rápido y seguro, ideal para instalaciones domésticas."},
            {"nombre": "Grifo Monomando para Lavabo", "precio": 85.00, "descripcion": "Grifo monomando moderno para lavabo. Acabado cromado brillante, incluye manguera flexible."},
            {"nombre": "Ducha Telefónica con Manguera", "precio": 65.00, "descripcion": "Ducha telefónica con manguera flexible de 1.5 metros. Múltiples funciones de chorro, acabado cromado."},
            # Materiales de Construcción
            {"nombre": "Cemento Portland Tipo I 50kg", "precio": 50.00, "descripcion": "Bolsa de cemento Portland Tipo I de 50kg. Cemento de uso general para construcción y albañilería."},
            {"nombre": "Arena Fina Cernida por m³", "precio": 20.00, "descripcion": "Arena fina cernida por metro cúbico. Libre de impurezas, ideal para mezclas de concreto y mortero."},
            {"nombre": "Piedra Triturada 3/4 por m³", "precio": 25.00, "descripcion": "Piedra triturada de 3/4 de pulgada por metro cúbico. Agregado grueso para concreto estructural."},
            {"nombre": "Ladrillo Hueco 12x18x24 cm", "precio": 0.85, "descripcion": "Ladrillo hueco estándar de 12x18x24 centímetros. Ideal para muros divisorios y construcción ligera."},
            {"nombre": "Ladrillo Macizo 12x18x24 cm", "precio": 1.20, "descripcion": "Ladrillo macizo de 12x18x24 centímetros. Mayor resistencia, ideal para muros de carga."},
            {"nombre": "Bloque de Hormigón 20x20x40 cm", "precio": 2.50, "descripcion": "Bloque de hormigón de 20x20x40 centímetros. Alta resistencia, perfecto para construcción rápida."},
            {"nombre": "Varilla Corrugada #4 (1/2 pulgada) por Metro", "precio": 8.50, "descripcion": "Varilla de acero corrugado #4 (1/2 pulgada) por metro. Acero de refuerzo para concreto armado."},
            {"nombre": "Varilla Corrugada #6 (3/4 pulgada) por Metro", "precio": 12.00, "descripcion": "Varilla de acero corrugado #6 (3/4 pulgada) por metro. Mayor diámetro para estructuras más pesadas."},
            {"nombre": "Alambre de Amarre Calibre 16 1kg", "precio": 15.00, "descripcion": "Alambre de amarre de acero galvanizado calibre 16, 1 kilogramo. Para amarrar varillas en estructuras."},
            # Ferretería General
            {"nombre": "Tornillo Autorroscante #8 x 1 pulgada", "precio": 0.15, "descripcion": "Tornillo autorroscante #8 de 1 pulgada. Punta tipo phillips, cabeza plana. Paquete de 100 unidades."},
            {"nombre": "Clavo Galvanizado 2 pulgadas 1kg", "precio": 8.00, "descripcion": "Clavo galvanizado de 2 pulgadas, 1 kilogramo. Resistente a la corrosión, ideal para exteriores."},
            {"nombre": "Bisagra de Puerta 4 pulgadas", "precio": 12.00, "descripcion": "Bisagra de puerta de 4 pulgadas, acero inoxidable. Incluye tornillos, juego de 2 unidades."},
            {"nombre": "Candado de Seguridad Acero Reforzado", "precio": 45.00, "descripcion": "Candado de seguridad de acero reforzado con llave. Resistente a cortes y manipulaciones, 50mm de cuerpo."},
            {"nombre": "Cerradura de Pompa con Llave", "precio": 35.00, "descripcion": "Cerradura de pompa con mecanismo de resorte. Incluye 2 llaves, color dorado o plateado."},
            {"nombre": "Cerradura de Chapa Simple", "precio": 28.00, "descripcion": "Cerradura de chapa simple con llave. Mecanismo básico de seguridad, ideal para puertas interiores."},
            {"nombre": "Manija de Puerta Metálica", "precio": 18.00, "descripcion": "Manija de puerta metálica con acabado cromado. Diseño moderno, incluye tornillos de instalación."},
            {"nombre": "Cerradura Inteligente con Código", "precio": 120.00, "descripcion": "Cerradura inteligente con código numérico de 4 dígitos. Batería incluida, fácil instalación."},
            {"nombre": "Cinta Adhesiva Transparente 48mm", "precio": 5.00, "descripcion": "Cinta adhesiva transparente de 48mm de ancho. Alta adherencia, rollo de 50 metros."},
            {"nombre": "Silicona Sellador Transparente 280ml", "precio": 8.00, "descripcion": "Silicona sellador transparente de 280ml. Resistente a la intemperie, ideal para sellado de juntas."},
        ]
        
        # Mapear productos a categorías y marcas
        productos_categorias = {
            # Herramientas Manuales -> Truper
            "Martillo": ("Herramientas Manuales", "Truper"),
            "Set de Destornilladores": ("Herramientas Manuales", "Truper"),
            "Llave Ajustable": ("Herramientas Manuales", "Truper"),
            "Alicate": ("Herramientas Manuales", "Truper"),
            "Serrucho": ("Herramientas Manuales", "Truper"),
            "Nivel": ("Herramientas Manuales", "Truper"),
            "Cinta Métrica": ("Herramientas Manuales", "Truper"),
            # Herramientas Eléctricas -> Bosch
            "Taladro": ("Herramientas Eléctricas", "Bosch"),
            "Sierra Circular": ("Herramientas Eléctricas", "Bosch"),
            "Pistola": ("Herramientas Eléctricas", "Bosch"),
            # Pinturas -> Monopol
            "Pintura": ("Pinturas y Acabados", "Monopol"),
            "Esmalte": ("Pinturas y Acabados", "Monopol"),
            "Barniz": ("Pinturas y Acabados", "Monopol"),
            "Primer": ("Pinturas y Acabados", "Monopol"),
            # Eléctricos -> Varios
            "Cable Eléctrico": ("Materiales Eléctricos", "Bosch"),
            "Interruptor": ("Materiales Eléctricos", "Bosch"),
            "Tomacorriente": ("Materiales Eléctricos", "Bosch"),
            "Foco LED": ("Materiales Eléctricos", "Bosch"),
            "Tubo LED": ("Materiales Eléctricos", "Bosch"),
            "Breaker": ("Materiales Eléctricos", "Bosch"),
            "Caja Eléctrica": ("Materiales Eléctricos", "Bosch"),
            # Plomería -> Tigre
            "Tubería PVC": ("Plomería", "Tigre"),
            "Codo PVC": ("Plomería", "Tigre"),
            "Tee PVC": ("Plomería", "Tigre"),
            "Válvula": ("Plomería", "Tigre"),
            "Llave de Paso": ("Plomería", "Tigre"),
            "Grifo": ("Plomería", "Tigre"),
            "Ducha": ("Plomería", "Tigre"),
            # Construcción -> Sika
            "Cemento": ("Materiales de Construcción", "Sika"),
            "Arena": ("Materiales de Construcción", "Sika"),
            "Piedra": ("Materiales de Construcción", "Sika"),
            "Ladrillo": ("Materiales de Construcción", "Sika"),
            "Bloque": ("Materiales de Construcción", "Sika"),
            "Varilla": ("Materiales de Construcción", "Sika"),
            "Alambre": ("Materiales de Construcción", "Sika"),
            # Ferretería -> Yale
            "Tornillo": ("Ferretería General", "Yale"),
            "Clavo": ("Ferretería General", "Yale"),
            "Bisagra": ("Ferretería General", "Yale"),
            "Candado": ("Ferretería General", "Yale"),
            "Cerradura": ("Ferretería General", "Yale"),
            "Manija": ("Ferretería General", "Yale"),
            "Cinta Adhesiva": ("Ferretería General", "Yale"),
            "Silicona": ("Ferretería General", "Sika"),
        }
        
        # Validar que tenemos categoría y marca antes de crear productos
        if not categoria_default:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo crear o encontrar una categoría. Asegúrate de que exista al menos una categoría en la base de datos."
            )
        
        if not marca_default:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo crear o encontrar una marca. Asegúrate de que exista al menos una marca en la base de datos."
            )
        
        mock_variant_ids = []
        for product_data in mock_products_data:
            # Verificar si el producto ya existe
            existing = db.query(Producto).filter(Producto.nombre == product_data["nombre"]).first()
            if existing:
                # Usar variante existente si hay
                variant = existing.variantes[0] if existing.variantes else None
                if variant:
                    mock_variant_ids.append(variant.id)
                continue
            
            # Determinar categoría y marca según el nombre del producto
            categoria_id = categoria_default
            marca_id = marca_default
            
            for key, (cat_nombre, marca_nombre) in productos_categorias.items():
                if key.lower() in product_data["nombre"].lower():
                    categoria_id = categorias_map.get(cat_nombre, categoria_default)
                    marca_id = marcas_map.get(marca_nombre, marca_default)
                    break
            
            # Asegurar que tenemos categoría y marca (no debería ser None aquí, pero por seguridad)
            if not categoria_id:
                categoria_id = categoria_default
            if not marca_id:
                marca_id = marca_default
            
            # Validación final antes de crear el producto
            if not categoria_id or not marca_id:
                print(f"ADVERTENCIA: Saltando producto '{product_data['nombre']}' - categoria_id={categoria_id}, marca_id={marca_id}")
                continue
            
            try:
                producto = Producto(
                    nombre=product_data["nombre"],
                    descripcion=product_data["descripcion"][:500] if len(product_data["descripcion"]) > 500 else product_data["descripcion"],  # Limitar descripción a 500 caracteres
                    categoria_id=categoria_id,
                    marca_id=marca_id,
                    fecha_creacion=datetime.now() - timedelta(days=random.randint(1, 180)),
                )
                db.add(producto)
                db.flush()
                MOCK_DATA_IDS["products"].append(producto.id)
                
                # Crear variante para el producto
                variante = VarianteProducto(
                    producto_id=producto.id,
                    nombre=product_data["nombre"][:100] if len(product_data["nombre"]) > 100 else product_data["nombre"],  # Limitar nombre a 100 caracteres
                    unidad_medida_id=unidad_medida.id,
                    precio=Decimal(str(product_data["precio"])),
                    fecha_creacion=datetime.now(),
                )
                db.add(variante)
                db.flush()
                MOCK_DATA_IDS["variants"].append(variante.id)
                mock_variant_ids.append(variante.id)
            except Exception as e:
                print(f"Error creando producto '{product_data['nombre']}': {str(e)}")
                # Continuar con el siguiente producto en lugar de fallar todo
                continue
        
        # 7. Insertar órdenes de venta de prueba (80 órdenes distribuidas en 90 días)
        if mock_customer_ids and mock_variant_ids and mock_user_ids:
            estados_venta = ["PENDIENTE", "PAGADO", "ENVIADO", "ENTREGADO"]
            # Distribuir estados de forma realista: más entregados que pendientes
            estado_weights = {
                "PENDIENTE": 0.15,  # 15% pendientes
                "PAGADO": 0.20,     # 20% pagados
                "ENVIADO": 0.15,    # 15% enviados
                "ENTREGADO": 0.50,  # 50% entregados
            }
            
            for i in range(80):
                # Seleccionar estado según pesos
                rand = random.random()
                if rand < estado_weights["PENDIENTE"]:
                    estado = "PENDIENTE"
                elif rand < estado_weights["PENDIENTE"] + estado_weights["PAGADO"]:
                    estado = "PAGADO"
                elif rand < estado_weights["PENDIENTE"] + estado_weights["PAGADO"] + estado_weights["ENVIADO"]:
                    estado = "ENVIADO"
                else:
                    estado = "ENTREGADO"
                
                orden_venta = OrdenVenta(
                    cliente_id=random.choice(mock_customer_ids),
                    fecha=datetime.now() - timedelta(days=random.randint(1, 90)),
                    estado=estado,
                    usuario_id=random.choice(mock_user_ids) if mock_user_ids else None,
                )
                db.add(orden_venta)
                db.flush()
                MOCK_DATA_IDS["sales"].append(orden_venta.id)
                
                # Agregar items a la orden (1-5 items por orden)
                num_items = random.randint(1, 5)
                for _ in range(num_items):
                    variant_id = random.choice(mock_variant_ids)
                    variante = db.query(VarianteProducto).filter(VarianteProducto.id == variant_id).first()
                    if variante and variante.precio:
                        item = ItemOrdenVenta(
                            orden_venta_id=orden_venta.id,
                            variante_producto_id=variant_id,
                            cantidad=Decimal(str(random.randint(1, 10))),
                            precio_unitario=variante.precio,
                        )
                        db.add(item)
        
        # 8. Insertar órdenes de compra de prueba (40 órdenes distribuidas en 120 días)
        if mock_supplier_ids and mock_variant_ids and mock_user_ids:
            estados_compra = ["BORRADOR", "ENVIADA", "RECIBIDA"]
            estado_weights_compra = {
                "BORRADOR": 0.20,   # 20% borradores
                "ENVIADA": 0.30,    # 30% enviadas
                "RECIBIDA": 0.50,   # 50% recibidas
            }
            
            for i in range(40):
                # Seleccionar estado según pesos
                rand = random.random()
                if rand < estado_weights_compra["BORRADOR"]:
                    estado = "BORRADOR"
                elif rand < estado_weights_compra["BORRADOR"] + estado_weights_compra["ENVIADA"]:
                    estado = "ENVIADA"
                else:
                    estado = "RECIBIDA"
                
                orden_compra = OrdenCompra(
                    proveedor_id=random.choice(mock_supplier_ids),
                    fecha=datetime.now() - timedelta(days=random.randint(1, 120)),
                    estado=estado,
                    usuario_id=random.choice(mock_user_ids) if mock_user_ids else None,
                )
                db.add(orden_compra)
                db.flush()
                MOCK_DATA_IDS["purchases"].append(orden_compra.id)
                
                # Agregar items a la orden (2-8 items por orden)
                num_items = random.randint(2, 8)
                for _ in range(num_items):
                    variant_id = random.choice(mock_variant_ids)
                    variante = db.query(VarianteProducto).filter(VarianteProducto.id == variant_id).first()
                    if variante and variante.precio:
                        # Precio de compra (menor que precio de venta, entre 60-80% del precio de venta)
                        descuento_compra = Decimal(str(random.uniform(0.60, 0.80)))
                        precio_compra = variante.precio * descuento_compra
                        item = ItemOrdenCompra(
                            orden_compra_id=orden_compra.id,
                            variante_producto_id=variant_id,
                            cantidad=Decimal(str(random.randint(10, 50))),
                            precio_unitario=precio_compra,
                        )
                        db.add(item)
        
        db.commit()
        
        return {
            "message": "Datos de prueba insertados exitosamente",
            "inserted": {
                "users": len(MOCK_DATA_IDS["users"]),
                "customers": len(MOCK_DATA_IDS["customers"]),
                "suppliers": len(MOCK_DATA_IDS["suppliers"]),
                "categories": len(MOCK_DATA_IDS["categories"]),
                "brands": len(MOCK_DATA_IDS["brands"]),
                "products": len(MOCK_DATA_IDS["products"]),
                "variants": len(MOCK_DATA_IDS["variants"]),
                "sales": len(MOCK_DATA_IDS["sales"]),
                "purchases": len(MOCK_DATA_IDS["purchases"]),
            },
            "ids": MOCK_DATA_IDS,
        }
    except Exception as e:
        db.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error insertando datos de prueba: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error insertando datos de prueba: {str(e)}. Detalles: {error_trace[-500:]}"  # Últimos 500 caracteres del traceback
        )

@router.delete("/remove")
def remove_mock_data(
    db: Session = Depends(get_db),
    _: object = Depends(require_role("ADMIN")),
):
    """Elimina los datos de prueba de la base de datos"""
    try:
        removed_count = {
            "users": 0,
            "customers": 0,
            "suppliers": 0,
            "categories": 0,
            "brands": 0,
            "products": 0,
            "variants": 0,
            "sales": 0,
            "purchases": 0,
        }
        
        # Eliminar órdenes de compra primero (tienen foreign keys)
        for purchase_id in MOCK_DATA_IDS["purchases"]:
            orden = db.query(OrdenCompra).filter(OrdenCompra.id == purchase_id).first()
            if orden:
                db.delete(orden)
                removed_count["purchases"] += 1
        
        # Eliminar órdenes de venta
        for sale_id in MOCK_DATA_IDS["sales"]:
            orden = db.query(OrdenVenta).filter(OrdenVenta.id == sale_id).first()
            if orden:
                db.delete(orden)
                removed_count["sales"] += 1
        
        # Eliminar variantes de productos
        for variant_id in MOCK_DATA_IDS["variants"]:
            variant = db.query(VarianteProducto).filter(VarianteProducto.id == variant_id).first()
            if variant:
                db.delete(variant)
                removed_count["variants"] += 1
        
        # Eliminar productos
        for product_id in MOCK_DATA_IDS["products"]:
            product = db.query(Producto).filter(Producto.id == product_id).first()
            if product:
                db.delete(product)
                removed_count["products"] += 1
        
        # Eliminar proveedores
        for supplier_id in MOCK_DATA_IDS["suppliers"]:
            supplier = db.query(Proveedor).filter(Proveedor.id == supplier_id).first()
            if supplier:
                db.delete(supplier)
                removed_count["suppliers"] += 1
        
        # Eliminar clientes
        for customer_id in MOCK_DATA_IDS["customers"]:
            customer = db.query(Cliente).filter(Cliente.id == customer_id).first()
            if customer:
                db.delete(customer)
                removed_count["customers"] += 1
        
        # Eliminar usuarios de prueba
        for user_id in MOCK_DATA_IDS["users"]:
            user = db.query(Usuario).filter(Usuario.id == user_id).first()
            if user:
                db.delete(user)
                removed_count["users"] += 1
        
        # Eliminar categorías y marcas de prueba (solo las que creamos)
        for category_id in MOCK_DATA_IDS["categories"]:
            category = db.query(Categoria).filter(Categoria.id == category_id).first()
            if category:
                db.delete(category)
                removed_count["categories"] += 1
        
        for brand_id in MOCK_DATA_IDS["brands"]:
            brand = db.query(Marca).filter(Marca.id == brand_id).first()
            if brand:
                db.delete(brand)
                removed_count["brands"] += 1
        
        # Limpiar IDs
        for key in MOCK_DATA_IDS:
            MOCK_DATA_IDS[key] = []
        
        db.commit()
        
        return {
            "message": "Datos de prueba eliminados exitosamente",
            "removed": removed_count,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error eliminando datos de prueba: {str(e)}"
        )

@router.get("/status")
def get_mock_data_status(
    db: Session = Depends(get_db),
    _: object = Depends(require_role("ADMIN")),
):
    """Obtiene el estado de los datos de prueba"""
    has_data = any(len(ids) > 0 for ids in MOCK_DATA_IDS.values())
    return {
        "has_mock_data": has_data,
        "counts": {
            "users": len(MOCK_DATA_IDS["users"]),
            "customers": len(MOCK_DATA_IDS["customers"]),
            "suppliers": len(MOCK_DATA_IDS["suppliers"]),
            "categories": len(MOCK_DATA_IDS["categories"]),
            "brands": len(MOCK_DATA_IDS["brands"]),
            "products": len(MOCK_DATA_IDS["products"]),
            "variants": len(MOCK_DATA_IDS["variants"]),
            "sales": len(MOCK_DATA_IDS["sales"]),
            "purchases": len(MOCK_DATA_IDS["purchases"]),
        },
        "ids": MOCK_DATA_IDS,
    }

