export const metadata = {
  title: "Términos y Condiciones | Ferretería Urkupina",
  description: "Términos y condiciones de uso de la plataforma de Ferretería Urkupina",
}

export default function TerminosCondicionesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 mb-2">Términos y Condiciones</h1>
          <p className="text-neutral-600 mb-8">Última actualización: {new Date().toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-neutral max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-neutral-700 leading-relaxed">
                Al acceder y utilizar el sitio web de Ferretería Urkupina, usted acepta cumplir con estos términos y condiciones. 
                Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro sitio web.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">2. Información de la Empresa</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                <strong>Ferretería Urkupina</strong> es una empresa dedicada a la comercialización de herramientas, 
                equipos y materiales para construcción, industria y hogar.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li><strong>Dirección:</strong> Av. San Joaquín esquina Calle "A", lado del Colegio Miguel Antelo, Guayaramerin, Bolivia</li>
                <li><strong>Teléfono:</strong> +591 68464378</li>
                <li><strong>Email:</strong> info@urkupina.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">3. Uso del Sitio Web</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                El sitio web está destinado para uso personal y comercial legítimo. Usted se compromete a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Proporcionar información veraz y precisa al crear una cuenta</li>
                <li>Mantener la confidencialidad de su cuenta y contraseña</li>
                <li>No utilizar el sitio para fines ilegales o no autorizados</li>
                <li>No intentar acceder a áreas restringidas del sitio</li>
                <li>No interferir con el funcionamiento del sitio web</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">4. Registro de Usuario</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Para realizar compras en nuestro sitio web, es necesario crear una cuenta. Al registrarse, usted se compromete a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Proporcionar información precisa y actualizada</li>
                <li>Ser responsable de todas las actividades que ocurran bajo su cuenta</li>
                <li>Notificarnos inmediatamente de cualquier uso no autorizado de su cuenta</li>
                <li>Mantener su información de contacto actualizada</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">5. Productos y Precios</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Nos esforzamos por proporcionar información precisa sobre nuestros productos, sin embargo:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Los precios están sujetos a cambios sin previo aviso</li>
                <li>Las imágenes de productos son ilustrativas y pueden variar del producto real</li>
                <li>Nos reservamos el derecho de corregir errores en precios o descripciones</li>
                <li>La disponibilidad de productos está sujeta a stock</li>
                <li>Todos los precios están expresados en Bolivianos (Bs.) e incluyen IVA cuando corresponda</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">6. Pedidos y Pagos</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Al realizar un pedido, usted acepta:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Proporcionar información de pago válida y autorizada</li>
                <li>Que el pedido constituye una oferta de compra</li>
                <li>Que nos reservamos el derecho de rechazar o cancelar pedidos</li>
                <li>Que los métodos de pago aceptados pueden variar</li>
                <li>Que los tiempos de procesamiento pueden variar según el método de pago</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">7. Envíos y Entregas</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Las políticas de envío incluyen:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Los tiempos de entrega son estimados y pueden variar</li>
                <li>Los costos de envío se calculan según la ubicación y peso del pedido</li>
                <li>Ofrecemos opciones de entrega express y estándar</li>
                <li>El cliente es responsable de proporcionar una dirección de entrega correcta</li>
                <li>Nos reservamos el derecho de cambiar los métodos de envío disponibles</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">8. Devoluciones y Reembolsos</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Nuestra política de devoluciones:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Los productos deben estar en su estado original y sin usar</li>
                <li>Las devoluciones deben realizarse dentro de los plazos establecidos</li>
                <li>Se requiere comprobante de compra para procesar devoluciones</li>
                <li>Los costos de envío de devolución pueden ser responsabilidad del cliente</li>
                <li>Los reembolsos se procesarán según el método de pago original</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">9. Propiedad Intelectual</h2>
              <p className="text-neutral-700 leading-relaxed">
                Todo el contenido del sitio web, incluyendo textos, gráficos, logos, imágenes y software, 
                es propiedad de Ferretería Urkupina y está protegido por las leyes de propiedad intelectual de Bolivia. 
                No se permite la reproducción, distribución o uso comercial sin autorización previa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">10. Limitación de Responsabilidad</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Ferretería Urkupina no será responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Daños indirectos, incidentales o consecuentes</li>
                <li>Pérdidas de datos o información</li>
                <li>Interrupciones en el servicio del sitio web</li>
                <li>Errores u omisiones en el contenido del sitio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">11. Modificaciones</h2>
              <p className="text-neutral-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. 
                Las modificaciones entrarán en vigor al ser publicadas en el sitio web. 
                Es su responsabilidad revisar periódicamente estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">12. Ley Aplicable</h2>
              <p className="text-neutral-700 leading-relaxed">
                Estos términos y condiciones se rigen por las leyes de Bolivia. 
                Cualquier disputa será resuelta en los tribunales competentes de Bolivia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">13. Contacto</h2>
              <p className="text-neutral-700 leading-relaxed">
                Si tiene preguntas sobre estos términos y condiciones, puede contactarnos a través de:
              </p>
              <ul className="list-none pl-0 space-y-2 text-neutral-700 mt-3">
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

