import { useState, useEffect } from "react"
import { simulationStore, type Simulation, type SimulationParameters } from "@/lib/simulation-store"

export function useSimulationStore() {
  const [simulations, setSimulations] = useState<Simulation[]>([])

  useEffect(() => {
    setSimulations(simulationStore.getSimulations())

    const unsubscribe = simulationStore.subscribe(() => {
      setSimulations(simulationStore.getSimulations())
    })

    return unsubscribe
  }, [])

  return {
    simulations,
    getSimulation: (id: string) => simulationStore.getSimulation(id),
    addSimulation: (name: string, parameters: SimulationParameters, options?: any) =>
      simulationStore.addSimulation(name, parameters, options),
    updateSimulation: (id: string, name: string, parameters: SimulationParameters) =>
      simulationStore.updateSimulation(id, name, parameters),
    deleteSimulation: (id: string) => simulationStore.deleteSimulation(id),
    calculateResults: (parameters: SimulationParameters) => simulationStore.calculateResults(parameters),
    markAsExecuted: (id: string, batchId: string) => simulationStore.markAsExecuted(id, batchId),
    duplicateSimulation: (id: string) => simulationStore.duplicateSimulation(id),
  }
}
