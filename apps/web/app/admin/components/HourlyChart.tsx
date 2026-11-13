'use client'

// Graphique commandes par heure — barres SVG (repas orange, colis lagune). Sans dépendance.
export interface HourBar {
  hour: number
  food_count: number
  parcel_count: number
}

export default function HourlyChart({ data }: { data: HourBar[] }) {
  const max = Math.max(1, ...data.map((d) => d.food_count + d.parcel_count))
  const W = 24 * 26
  const H = 160
  const barW = 18

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H + 24} className="min-w-full">
        {data.map((d, i) => {
          const x = i * 26 + 4
          const foodH = (d.food_count / max) * H
          const parcelH = (d.parcel_count / max) * H
          return (
            <g key={d.hour}>
              <rect x={x} y={H - parcelH} width={barW} height={parcelH} fill="#0FA3A3" />
              <rect x={x} y={H - parcelH - foodH} width={barW} height={foodH} fill="#FF6B35" />
              {d.hour % 3 === 0 && (
                <text x={x + barW / 2} y={H + 16} textAnchor="middle" className="fill-gray-500 text-[10px]">
                  {d.hour}h
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="mt-8 flex gap-16 text-[12px] text-gray-600">
        <span className="flex items-center gap-4"><span className="inline-block h-10 w-10 rounded-xs bg-orange-500" /> Repas</span>
        <span className="flex items-center gap-4"><span className="inline-block h-10 w-10 rounded-xs bg-lagune-500" /> Colis</span>
      </div>
    </div>
  )
}
