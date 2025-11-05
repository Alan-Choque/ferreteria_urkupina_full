interface EditorialCardProps {
  title: string
  description: string
  image: string
  link: string
}

export default function EditorialCard({ title, description, image, link }: EditorialCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <a href={link} className="block">
        <div className="aspect-3/2 overflow-hidden">
          <img
            src={image || "/placeholder.svg"}
            alt=""
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-3 text-balance">{title}</h3>
          <p className="text-neutral-800 leading-relaxed mb-4">{description}</p>
          <span className="text-red-600 font-medium hover:underline">Leer más →</span>
        </div>
      </a>
    </article>
  )
}
