import { Strategy, HistoricalRecord, OptimizationGoal, Recommendation, PerformanceMetrics } from './types';
import { HistoricalDataStore } from './HistoricalDataStore';

export class Recommender {
  constructor(private store: HistoricalDataStore) {}

  recommend(strategies: Strategy[], taskType: string, goal: OptimizationGoal): Recommendation {
    if (strategies.length === 0) {
      throw new Error('No strategies provided for recommendation');
    }

    const scores = strategies.map(strategy => {
      const avgMetrics = this.store.getAverageMetrics(strategy.id, taskType);
      const score = this.calculateStrategyScore(strategy, avgMetrics, goal);
      return { strategy, avgMetrics, score };
    });

    // Sort by score (higher is better for our internal scoring)
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    
    return {
      strategyId: best.strategy.id,
      reasoning: this.generateReasoning(best.strategy, best.avgMetrics, goal, best.score),
      expectedMetrics: best.avgMetrics ? {
        latency: best.avgMetrics.latencyMs,
        cost: best.avgMetrics.costUsd,
        score: best.avgMetrics.score || 0
      } : {
        latency: 0,
        cost: 0,
        score: 0
      },
      confidence: this.calculateConfidence(best.strategy.id, taskType)
    };
  }

  private calculateStrategyScore(
    strategy: Strategy, 
    metrics: PerformanceMetrics | null, 
    goal: OptimizationGoal
  ): number {
    if (!metrics) {
      // Default score for new strategies to encourage exploration
      return 0.5;
    }

    // Check constraints first
    if (goal.constraints) {
      if (goal.constraints.maxCost && metrics.costUsd > goal.constraints.maxCost) return -1;
      if (goal.constraints.maxLatency && metrics.latencyMs > goal.constraints.maxLatency) return -1;
      if (goal.constraints.minScore && (metrics.score || 0) < goal.constraints.minScore) return -1;
    }

    let baseScore = 0;
    switch (goal.metric) {
      case 'latency':
        baseScore = goal.direction === 'minimize' ? 1 / (metrics.latencyMs || 1) : metrics.latencyMs;
        break;
      case 'cost':
        baseScore = goal.direction === 'minimize' ? 1 / (metrics.costUsd || 0.00001) : metrics.costUsd;
        break;
      case 'score':
        baseScore = goal.direction === 'maximize' ? (metrics.score || 0) : 1 - (metrics.score || 0);
        break;
      case 'efficiency':
        // Efficiency = score / (cost * latency)
        const efficiency = (metrics.score || 0.1) / ((metrics.costUsd || 0.00001) * (metrics.latencyMs || 1));
        baseScore = goal.direction === 'maximize' ? efficiency : 1 / efficiency;
        break;
    }

    return baseScore;
  }

  private calculateConfidence(strategyId: string, taskType: string): number {
    const records = this.store.getRecordsByStrategy(strategyId).filter(r => r.taskType === taskType);
    // Sigmoid-like function: 0 records -> 0.1, 10 records -> 0.5, 50+ records -> 0.9
    return 1 / (1 + Math.exp(-(records.length - 10) / 10));
  }

  private generateReasoning(
    strategy: Strategy, 
    metrics: PerformanceMetrics | null, 
    goal: OptimizationGoal,
    score: number
  ): string {
    if (!metrics) {
      return `Strategy "${strategy.name}" is recommended for exploration as no historical data exists for this task type.`;
    }

    const metricValue = goal.metric === 'cost' ? `$${metrics.costUsd.toFixed(4)}` : 
                       goal.metric === 'latency' ? `${metrics.latencyMs.toFixed(0)}ms` :
                       metrics.score?.toFixed(2) || 'N/A';

    return `Strategy "${strategy.name}" selected based on ${goal.metric} ${goal.direction} goal. ` +
           `Average ${goal.metric} is ${metricValue} with an overall efficiency score of ${score.toFixed(4)}.`;
  }
}
