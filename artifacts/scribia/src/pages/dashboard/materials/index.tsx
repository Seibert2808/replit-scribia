import { FileText } from 'lucide-react'

export default function MaterialsPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Materiais</h1>
        <p className="text-[13px] text-text3 mt-0.5">E-books, playbooks e cards gerados</p>
      </div>
      <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
        <FileText className="w-10 h-10 text-text3 mx-auto mb-3" />
        <p className="text-text2">Materiais gerados pelas palestras aparecerão aqui.</p>
      </div>
    </div>
  )
}
