import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function CattleList() {
  // Mock data - will be replaced with real data
  const cattle = [
    {
      id: "C-1247",
      tagNumber: "1247",
      weight: "1,245 lbs",
      lastWeighed: "2 days ago",
      status: "healthy",
      dailyGain: "+2.8 lbs/day",
    },
    {
      id: "C-1248",
      tagNumber: "1248",
      weight: "1,189 lbs",
      lastWeighed: "2 days ago",
      status: "healthy",
      dailyGain: "+3.1 lbs/day",
    },
    {
      id: "C-1249",
      tagNumber: "1249",
      weight: "1,098 lbs",
      lastWeighed: "5 days ago",
      status: "attention",
      dailyGain: "+1.2 lbs/day",
    },
  ]

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {cattle.map((animal) => (
            <div key={animal.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">Tag #{animal.tagNumber}</p>
                    <Badge
                      variant={animal.status === "healthy" ? "default" : "secondary"}
                      className={
                        animal.status === "healthy"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {animal.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{animal.weight}</span>
                    <span>•</span>
                    <span>{animal.dailyGain}</span>
                    <span>•</span>
                    <span>Weighed {animal.lastWeighed}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
