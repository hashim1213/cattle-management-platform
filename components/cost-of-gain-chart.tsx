"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

export function CostOfGainChart() {
  const data = [
    { week: "Week 1", cog: 0.78, target: 0.8 },
    { week: "Week 2", cog: 0.82, target: 0.8 },
    { week: "Week 3", cog: 0.85, target: 0.8 },
    { week: "Week 4", cog: 0.88, target: 0.8 },
    { week: "Week 5", cog: 0.92, target: 0.8 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis domain={[0.7, 1.0]} tickFormatter={(value) => `$${value}`} />
        <Tooltip formatter={(value: number) => [`$${value}/lb`, "Cost of Gain"]} />
        <ReferenceLine y={0.8} stroke="#16a34a" strokeDasharray="3 3" label="Target" />
        <Line type="monotone" dataKey="cog" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
