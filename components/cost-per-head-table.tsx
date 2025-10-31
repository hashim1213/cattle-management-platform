"use client"

export function CostPerHeadTable() {
  const lots = [
    {
      lotNumber: "LOT-A",
      headCount: 125,
      avgPurchasePrice: 1650,
      feedCost: 1145,
      otherCosts: 52,
      totalCostPerHead: 2847,
      avgWeight: 1215,
      projectedBreakeven: 1.48,
    },
    {
      lotNumber: "LOT-B",
      headCount: 98,
      avgPurchasePrice: 1670,
      feedCost: 1089,
      otherCosts: 48,
      totalCostPerHead: 2807,
      avgWeight: 1189,
      projectedBreakeven: 1.45,
    },
    {
      lotNumber: "LOT-C",
      headCount: 24,
      avgPurchasePrice: 1625,
      feedCost: 892,
      otherCosts: 45,
      totalCostPerHead: 2562,
      avgWeight: 1098,
      projectedBreakeven: 1.42,
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Lot</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Head Count</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Purchase Price</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Feed Cost</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Other Costs</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Total Cost/Head</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Avg Weight</th>
            <th className="text-left p-4 text-sm font-semibold text-foreground">Breakeven</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {lots.map((lot) => (
            <tr key={lot.lotNumber} className="hover:bg-muted/50 transition-colors">
              <td className="p-4 font-medium text-foreground">{lot.lotNumber}</td>
              <td className="p-4 text-sm text-muted-foreground">{lot.headCount}</td>
              <td className="p-4 text-sm text-foreground">${lot.avgPurchasePrice}</td>
              <td className="p-4 text-sm text-foreground">${lot.feedCost}</td>
              <td className="p-4 text-sm text-foreground">${lot.otherCosts}</td>
              <td className="p-4 text-sm font-semibold text-foreground">${lot.totalCostPerHead.toLocaleString()}</td>
              <td className="p-4 text-sm text-muted-foreground">{lot.avgWeight} lbs</td>
              <td className="p-4 text-sm text-foreground">${lot.projectedBreakeven}/lb</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
