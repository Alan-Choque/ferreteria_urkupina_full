export const metadata = {
  title: "Aviso Legal | Ferretería Urkupina",
  description: "Aviso legal e información corporativa de Ferretería Urkupina",
}

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 mb-2">Aviso Legal</h1>
          <p className="text-neutral-600 mb-8">Última actualización: {new Date().toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-neutral max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">1. Datos Identificativos</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                En cumplimiento del deber de información recogido en la normativa vigente, se informa de los siguientes datos:
              </p>
              <ul className="list-none pl-0 space-y-2 text-neutral-700">
                <li><strong>Denominación social:</strong> Ferretería Urkupina</li>
                <li><strong>Dirección:</strong> Av. San Joaquín esquina Calle "A", lado del Colegio Miguel Antelo, Guayaramerin, Bolivia</li>
                <li><strong>Teléfono:</strong> +591 68464378</li>
                <li><strong>Email:</strong> info@urkupina.com</li>
                <li><strong>Sitio web:</strong> www.urkupina.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">2. Objeto</h2>
              <p className="text-neutral-700 leading-relaxed">
                El presente aviso legal regula el uso del sitio web www.urkupina.com (en adelante, el sitio web), 
                del cual es titular Ferretería Urkupina. La navegación por el sitio web de Ferretería Urkupina 
                atribuye la condición de usuario del mismo e implica la aceptación plena de todas las cláusulas incluidas 
                en este aviso legal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">3. Condiciones de Acceso y Uso</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                El acceso y uso del sitio web tiene carácter gratuito. Sin embargo, algunos servicios pueden estar sujetos 
                a condiciones particulares que requieran el pago de una cantidad, que se indicará claramente.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-3">
                El usuario se compromete a hacer un uso adecuado y lícito del sitio web y de los contenidos, 
                de conformidad con la legislación aplicable, el presente aviso legal, las buenas costumbres y el orden público.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                Queda prohibido el uso del sitio web con fines ilícitos o no autorizados, y en particular:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700 mt-3">
                <li>Reproducir, copiar, distribuir, comunicar públicamente, transformar o modificar los contenidos</li>
                <li>Utilizar los contenidos para fines comerciales o publicitarios</li>
                <li>Intentar acceder a las áreas restringidas del sitio web</li>
                <li>Introducir virus o cualquier otro código malicioso</li>
                <li>Realizar acciones que puedan dañar, inutilizar, sobrecargar o deteriorar el sitio web</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">4. Propiedad Intelectual e Industrial</h2>
              <p className="text-neutral-700 leading-relaxed">
                Todos los contenidos del sitio web, incluyendo textos, fotografías, gráficos, imágenes, iconos, tecnología, 
                software, así como su diseño gráfico y códigos fuente, constituyen una obra cuya propiedad pertenece a 
                Ferretería Urkupina, sin que puedan entenderse cedidos al usuario ninguno de los derechos de explotación 
                sobre los mismos más allá de lo estrictamente necesario para el correcto uso del sitio web.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">5. Exclusión de Garantías y Responsabilidad</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Ferretería Urkupina no garantiza la continuidad, disponibilidad y utilidad del sitio web, 
                ni de los contenidos o servicios. Ferretería Urkupina hará todo lo posible por el buen funcionamiento 
                del sitio web, sin embargo, no se responsabiliza ni garantiza que el acceso al sitio web no sea ininterrumpido 
                o que esté libre de error.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                Ferretería Urkupina no se hace responsable de los daños y perjuicios de toda naturaleza que puedan deberse 
                a la falta de disponibilidad, continuidad o calidad del funcionamiento del sitio web y de los servicios 
                ofrecidos en el mismo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">6. Enlaces</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                En el caso de que en el sitio web se dispusiesen enlaces o hipervínculos hacía otros sitios de Internet, 
                Ferretería Urkupina no ejercerá ningún tipo de control sobre dichos sitios y contenidos.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                En ningún caso Ferretería Urkupina asumirá responsabilidad alguna por los contenidos de algún enlace 
                perteneciente a un sitio web ajeno, ni garantizará la disponibilidad técnica, calidad, fiabilidad, 
                exactitud, amplitud, veracidad, validez y constitucionalidad de cualquier material o información contenida 
                en ninguno de dichos hipervínculos u otros sitios de Internet.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">7. Modificaciones</h2>
              <p className="text-neutral-700 leading-relaxed">
                Ferretería Urkupina se reserva el derecho de efectuar sin previo aviso las modificaciones que considere 
                oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se 
                presten a través de la misma como la forma en la que éstos aparezcan presentados o localizados en su portal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">8. Legislación Aplicable y Jurisdicción</h2>
              <p className="text-neutral-700 leading-relaxed">
                La relación entre Ferretería Urkupina y el usuario se regirá por la normativa vigente y aplicable en el territorio boliviano. 
                Si surgiera cualquier controversia las partes se someterán a los Juzgados y Tribunales de Bolivia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">9. Contacto</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Para cualquier consulta o comunicación relacionada con este aviso legal, puede contactarnos:
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

