import { Toggle } from '@/components/ui/toggle'

interface QuizSectionProps {
  label: string
  helperText: string
  options: readonly string[]
  value: string[]
  onChange: (next: string[]) => void
  error?: string
  maxSelections?: number
}

export function QuizSection({ label, helperText, options, value, onChange, error, maxSelections }: QuizSectionProps) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{label}</h2>
        <p className="text-sm text-muted-foreground">{helperText}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option)
          const atMax = maxSelections !== undefined && value.length >= maxSelections && !isSelected
          return (
            <Toggle
              key={option}
              pressed={isSelected}
              onPressedChange={() => toggle(option)}
              disabled={atMax}
              aria-label={option}
            >
              {option}
            </Toggle>
          )
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  )
}
