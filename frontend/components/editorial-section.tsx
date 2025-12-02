import EditorialCard from "./editorial-card"

const articles = [
  {
    id: 1,
    title: "Guía Completa de Taladros",
    description: "Todo lo que necesitas saber para elegir el taladro perfecto para tu proyecto.",
    image: "/drill-guide-tutorial.jpg",
    link: "/guias/taladros",
  },
  {
    id: 2,
    title: "Seguridad en el Taller",
    description: "Consejos esenciales para mantener un ambiente de trabajo seguro.",
    image: "/workshop-safety-equipment.jpg",
    link: "/guias/seguridad",
  },
  {
    id: 3,
    title: "Proyectos de Carpintería",
    description: "Ideas inspiradoras para tu próximo proyecto de carpintería.",
    image: "/woodworking-projects-furniture.jpg",
    link: "/guias/proyectos",
  },
]

export default function EditorialSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16" aria-labelledby="editorial-heading">
      <h2 id="editorial-heading" className="text-3xl md:text-4xl font-bold text-neutral-900 mb-10 text-center">
        Guías y Consejos
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((article, index) => (
          <EditorialCard key={article.id} {...article} index={index} />
        ))}
      </div>
    </section>
  )
}
