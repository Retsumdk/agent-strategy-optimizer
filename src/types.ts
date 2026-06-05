export interface Strategy {
  id: string;
  name: string;
  description: string;
  model: string;
  params: Record<string, any>;
  metadata: Record<string, any>;
}

export interface PerformanceMetrics {
  latencyMs: number;
  tokensUsed: number;
  costUsd: number;
  success: boolean;
  score?: number; // 0 to 1
  timestamp: Date;
}

export interface HistoricalRecord {
  strategyId: string;
  taskId: string;
  taskType: string;
  metrics: PerformanceMetrics;
}

export interface OptimizationGoal {
  metric: 'latency' | 'cost' | 'score' | 'efficiency';
  direction: 'minimize' | 'maximize';
  constraints?: {
    maxCost?: number;
    maxLatency?: number;
    minScore?: number;
  };
}

export interface Recommendation {
  strategyId: string;
  reasoning: string;
  expectedMetrics: {
    latency: number;
    cost: number;
    score: number;
  };
  confidence: number;
}
