export const metadata = {
  title: "Política de Cookies | Ferretería Urkupina",
  description: "Política de uso de cookies y tecnologías similares en el sitio web de Ferretería Urkupina",
}

export default function PoliticaCookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 mb-2">Política de Cookies</h1>
          <p className="text-neutral-600 mb-8">Última actualización: {new Date().toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-neutral max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">1. ¿Qué son las Cookies?</h2>
              <p className="text-neutral-700 leading-relaxed">
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (computadora, tablet o móvil) 
                cuando visita un sitio web. Las cookies permiten que el sitio web recuerde sus acciones y preferencias 
                durante un período de tiempo, por lo que no tiene que volver a configurarlas cada vez que regresa al sitio 
                o navega de una página a otra.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">2. ¿Cómo Utilizamos las Cookies?</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Utilizamos cookies para diversos propósitos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li><strong>Funcionalidad esencial:</strong> Para que el sitio web funcione correctamente</li>
                <li><strong>Autenticación:</strong> Para mantener su sesión iniciada</li>
                <li><strong>Preferencias:</strong> Para recordar sus preferencias y configuraciones</li>
                <li><strong>Carrito de compras:</strong> Para mantener los productos en su carrito</li>
                <li><strong>Análisis:</strong> Para entender cómo los usuarios interactúan con nuestro sitio</li>
                <li><strong>Marketing:</strong> Para mostrar contenido relevante y personalizado</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">3. Tipos de Cookies que Utilizamos</h2>
              
              <h3 className="text-xl font-semibold text-neutral-900 mb-2 mt-4">3.1. Cookies Estrictamente Necesarias</h3>
              <p className="text-neutral-700 leading-relaxed mb-2">
                Estas cookies son esenciales para que el sitio web funcione correctamente. No se pueden desactivar.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Cookies de sesión para mantener su sesión activa</li>
                <li>Cookies de seguridad para prevenir fraudes</li>
                <li>Cookies de carrito de compras</li>
              </ul>

              <h3 className="text-xl font-semibold text-neutral-900 mb-2 mt-4">3.2. Cookies de Funcionalidad</h3>
              <p className="text-neutral-700 leading-relaxed mb-2">
                Estas cookies permiten que el sitio web recuerde sus preferencias y proporcione funcionalidades mejoradas.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Preferencias de idioma</li>
                <li>Configuraciones de tema (claro/oscuro)</li>
                <li>Información de autenticación</li>
              </ul>

              <h3 className="text-xl font-semibold text-neutral-900 mb-2 mt-4">3.3. Cookies de Análisis</h3>
              <p className="text-neutral-700 leading-relaxed mb-2">
                Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Páginas visitadas</li>
                <li>Tiempo de permanencia</li>
                <li>Fuentes de tráfico</li>
                <li>Errores encontrados</li>
              </ul>

              <h3 className="text-xl font-semibold text-neutral-900 mb-2 mt-4">3.4. Cookies de Marketing</h3>
              <p className="text-neutral-700 leading-relaxed mb-2">
                Estas cookies se utilizan para mostrar anuncios relevantes y rastrear la efectividad de nuestras campañas.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Cookies de seguimiento de conversiones</li>
                <li>Cookies de remarketing</li>
                <li>Cookies de redes sociales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">4. Cookies de Terceros</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Algunas cookies son colocadas por servicios de terceros que aparecen en nuestras páginas. Estos incluyen:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li><strong>Google Analytics:</strong> Para análisis de tráfico web</li>
                <li><strong>Redes sociales:</strong> Para compartir contenido en redes sociales</li>
                <li><strong>Proveedores de pago:</strong> Para procesar pagos de forma segura</li>
                <li><strong>Servicios de mapas:</strong> Para mostrar ubicaciones</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-3">
                No controlamos las cookies de terceros. Le recomendamos revisar las políticas de privacidad de estos servicios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">5. Duración de las Cookies</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Utilizamos dos tipos de cookies según su duración:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li><strong>Cookies de sesión:</strong> Se eliminan cuando cierra su navegador</li>
                <li><strong>Cookies persistentes:</strong> Permanecen en su dispositivo por un período determinado o hasta que las elimine manualmente</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">6. Gestión de Cookies</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Puede controlar y gestionar las cookies de varias maneras:
              </p>
              
              <h3 className="text-xl font-semibold text-neutral-900 mb-2 mt-4">6.1. Configuración del Navegador</h3>
              <p className="text-neutral-700 leading-relaxed mb-2">
                La mayoría de los navegadores le permiten:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Ver qué cookies tiene instaladas</li>
                <li>Eliminar cookies individualmente o todas a la vez</li>
                <li>Bloquear cookies de sitios específicos</li>
                <li>Bloquear todas las cookies de terceros</li>
                <li>Eliminar todas las cookies al cerrar el navegador</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-3">
                Tenga en cuenta que bloquear o eliminar cookies puede afectar su experiencia en nuestro sitio web 
                y algunas funcionalidades pueden no estar disponibles.
              </p>

              <h3 className="text-xl font-semibold text-neutral-900 mb-2 mt-4">6.2. Enlaces de Configuración por Navegador</h3>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Microsoft Edge</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">7. Consentimiento</h2>
              <p className="text-neutral-700 leading-relaxed">
                Al continuar utilizando nuestro sitio web después de ver el aviso de cookies, 
                usted consiente el uso de cookies de acuerdo con esta política. 
                Puede retirar su consentimiento en cualquier momento ajustando la configuración de su navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">8. Actualizaciones de esta Política</h2>
              <p className="text-neutral-700 leading-relaxed">
                Podemos actualizar esta política de cookies ocasionalmente para reflejar cambios en nuestras prácticas 
                o por otras razones operativas, legales o regulatorias. Le recomendamos revisar esta página periódicamente 
                para estar informado sobre nuestro uso de cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">9. Contacto</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Si tiene preguntas sobre nuestra política de cookies, puede contactarnos:
              </p>
              <ul className="list-none pl-0 space-y-2 text-neutral-700">
                <li><strong>Email:</strong> info@urkupina.com</li>
                <li><strong>Teléfono:</strong> +591 68464378</li>
                <li><strong>Dirección:</strong> Av. San Joaquín esquina Calle "A", Guayaramerin, Bolivia</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

