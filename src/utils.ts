export function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`;
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function calculateEfficiency(score: number, cost: number, latencyMs: number): number {
  // Normalize cost and latency to prevent zero division and handle small values
  const normalizedCost = Math.max(cost, 0.000001);
  const normalizedLatency = Math.max(latencyMs / 1000, 0.001); // in seconds
  
  return score / (normalizedCost * normalizedLatency);
}

export function debounce(fn: Function, ms: number) {
  let timeoutId: any;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function groupBy<T>(array: T[], keyGetter: (item: T) => string): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const key = keyGetter(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function calculateStandardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b) / numbers.length;
  const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

export function detectAnomalies(values: number[], thresholdZ: number = 2): number[] {
  if (values.length < 3) return [];
  const mean = values.reduce((a, b) => a + b) / values.length;
  const stdDev = calculateStandardDeviation(values);
  
  if (stdDev === 0) return [];
  
  return values.filter(v => Math.abs((v - mean) / stdDev) > thresholdZ);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
