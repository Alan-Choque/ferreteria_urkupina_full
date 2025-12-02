export const metadata = {
  title: "Política de Privacidad | Ferretería Urkupina",
  description: "Política de privacidad y protección de datos personales de Ferretería Urkupina",
}

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 mb-2">Política de Privacidad</h1>
          <p className="text-neutral-600 mb-8">Última actualización: {new Date().toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-neutral max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">1. Introducción</h2>
              <p className="text-neutral-700 leading-relaxed">
                Ferretería Urkupina se compromete a proteger la privacidad de nuestros usuarios. 
                Esta política de privacidad explica cómo recopilamos, usamos, almacenamos y protegemos su información personal 
                cuando utiliza nuestro sitio web y servicios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">2. Información que Recopilamos</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Recopilamos los siguientes tipos de información:
              </p>
              
              <h3 className="text-xl font-semibold text-neutral-900 mb-2 mt-4">2.1. Información Personal</h3>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Dirección de entrega</li>
                <li>Número de identificación (NIT/CI) cuando sea necesario para facturación</li>
                <li>Información de pago (procesada de forma segura a través de proveedores de pago)</li>
              </ul>

              <h3 className="text-xl font-semibold text-neutral-900 mb-2 mt-4">2.2. Información Técnica</h3>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Dirección IP</li>
                <li>Tipo de navegador y versión</li>
                <li>Sistema operativo</li>
                <li>Páginas visitadas y tiempo de permanencia</li>
                <li>Referencias de sitios web</li>
              </ul>

              <h3 className="text-xl font-semibold text-neutral-900 mb-2 mt-4">2.3. Cookies y Tecnologías Similares</h3>
              <p className="text-neutral-700 leading-relaxed">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia. 
                Consulte nuestra <a href="/politica-cookies" className="text-orange-600 hover:underline">Política de Cookies</a> para más información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">3. Cómo Usamos su Información</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Utilizamos su información personal para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Procesar y gestionar sus pedidos</li>
                <li>Comunicarnos con usted sobre su cuenta y pedidos</li>
                <li>Enviar confirmaciones de pedido y actualizaciones de envío</li>
                <li>Proporcionar servicio al cliente y soporte técnico</li>
                <li>Enviar comunicaciones de marketing (con su consentimiento)</li>
                <li>Mejorar nuestro sitio web y servicios</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
                <li>Prevenir fraudes y garantizar la seguridad</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">4. Compartir Información</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                No vendemos su información personal. Podemos compartir su información con:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar nuestro negocio (procesadores de pago, servicios de envío, hosting)</li>
                <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por ley o para proteger nuestros derechos</li>
                <li><strong>Transferencias comerciales:</strong> En caso de fusión, adquisición o venta de activos</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-3">
                Todos los terceros con los que compartimos información están obligados a mantener la confidencialidad 
                y usar la información solo para los fines especificados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">5. Seguridad de los Datos</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Cifrado SSL/TLS para transmisiones de datos</li>
                <li>Almacenamiento seguro de información sensible</li>
                <li>Acceso restringido a información personal</li>
                <li>Monitoreo regular de sistemas de seguridad</li>
                <li>Actualizaciones periódicas de seguridad</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-3">
                Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro. 
                Aunque nos esforzamos por proteger su información, no podemos garantizar seguridad absoluta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">6. Retención de Datos</h2>
              <p className="text-neutral-700 leading-relaxed">
                Conservamos su información personal durante el tiempo necesario para cumplir con los fines descritos en esta política, 
                a menos que la ley requiera o permita un período de retención más largo. 
                Cuando ya no necesitemos su información, la eliminaremos de forma segura.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">7. Sus Derechos</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                De acuerdo con la Ley de Protección de Datos Personales de Bolivia, usted tiene derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li><strong>Acceso:</strong> Solicitar una copia de la información personal que tenemos sobre usted</li>
                <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta</li>
                <li><strong>Eliminación:</strong> Solicitar la eliminación de su información personal</li>
                <li><strong>Oposición:</strong> Oponerse al procesamiento de su información personal</li>
                <li><strong>Portabilidad:</strong> Recibir su información en un formato estructurado</li>
                <li><strong>Retirar consentimiento:</strong> Retirar su consentimiento en cualquier momento</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-3">
                Para ejercer estos derechos, puede contactarnos a través de los medios indicados en la sección de contacto.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">8. Menores de Edad</h2>
              <p className="text-neutral-700 leading-relaxed">
                Nuestro sitio web no está dirigido a menores de 18 años. No recopilamos intencionalmente información personal 
                de menores de edad. Si descubrimos que hemos recopilado información de un menor sin el consentimiento de los padres, 
                tomaremos medidas para eliminar esa información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">9. Enlaces a Terceros</h2>
              <p className="text-neutral-700 leading-relaxed">
                Nuestro sitio web puede contener enlaces a sitios web de terceros. No somos responsables de las prácticas 
                de privacidad de estos sitios. Le recomendamos leer las políticas de privacidad de cualquier sitio que visite.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">10. Cambios a esta Política</h2>
              <p className="text-neutral-700 leading-relaxed">
                Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos sobre cambios significativos 
                publicando la nueva política en esta página y actualizando la fecha de "última actualización". 
                Le recomendamos revisar esta política periódicamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">11. Contacto</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Si tiene preguntas, inquietudes o solicitudes relacionadas con esta política de privacidad o el manejo de sus datos personales, 
                puede contactarnos:
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

