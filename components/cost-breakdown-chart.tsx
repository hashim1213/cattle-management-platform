"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

export function CostBreakdownChart() {
  const data = [
    { name: "Feed Costs", value: 62, amount: 1145 },
    { name: "Purchase Price", value: 28, amount: 517 },
    { name: "Veterinary", value: 5, amount: 92 },
    { name: "Labor", value: 3, amount: 55 },
    { name: "Other", value: 2, amount: 38 },
  ]

  const COLORS = ["#16a34a", "#d97706", "#dc2626", "#78716c", "#a8a29e"]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string, props: { payload: { amount: number } }) => [
            `${value}% ($${props.payload.amount})`,
            name,
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
