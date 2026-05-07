'use client'

interface LectureOption {
  id: string
  title: string
  eventName: string
}

interface LectureFilterProps {
  lectures: LectureOption[]
  selectedLectureId: string | null
  temperatureFilter: 'all' | 'hot' | 'warm' | 'cold'
  searchQuery: string
  leadCount: number
  onLectureChange: (id: string | null) => void
  onTemperatureChange: (temp: 'all' | 'hot' | 'warm' | 'cold') => void
  onSearchChange: (query: string) => void
}

export function LectureFilter({
  lectures,
  selectedLectureId,
  temperatureFilter,
  searchQuery,
  leadCount,
  onLectureChange,
  onTemperatureChange,
  onSearchChange,
}: LectureFilterProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Lecture selector */}
        <select
          value={selectedLectureId ?? 'all'}
          onChange={(e) => onLectureChange(e.target.value === 'all' ? null : e.target.value)}
          className="bg-bg3 border border-border-subtle rounded-xl px-3.5 py-2.5 text-[13px] text-text focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 min-w-[200px] flex-1 sm:flex-initial"
        >
          <option value="all">Todas as palestras</option>
          {lectures.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} — {l.eventName}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 sm:flex-initial">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-bg3 border border-border-subtle rounded-xl px-3.5 py-2.5 text-[13px] text-text placeholder:text-text3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 w-full sm:w-52"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Temperature filter */}
        <div className="flex gap-1.5">
          {([
            { value: 'all', label: 'Todos' },
            { value: 'hot', label: 'Quentes' },
            { value: 'warm', label: 'Mornos' },
            { value: 'cold', label: 'Frios' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onTemperatureChange(opt.value)}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                temperatureFilter === opt.value
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-bg3 text-text2 hover:bg-bg3/80 hover:text-text'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <span className="text-[11px] text-text3 font-medium">{leadCount} leads</span>
      </div>
    </div>
  )
}
