import { Strategy, PerformanceMetrics, OptimizationGoal, Recommendation, HistoricalRecord } from './types';
import { HistoricalDataStore } from './HistoricalDataStore';
import { Recommender } from './Recommender';

export class StrategyOptimizer {
  private store: HistoricalDataStore;
  private recommender: Recommender;
  private strategies: Map<string, Strategy> = new Map();

  constructor(initialData?: string) {
    this.store = new HistoricalDataStore();
    if (initialData) {
      this.store.importData(initialData);
    }
    this.recommender = new Recommender(this.store);
  }

  registerStrategy(strategy: Strategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  getStrategy(id: string): Strategy | undefined {
    return this.strategies.get(id);
  }

  recordExecution(strategyId: string, taskId: string, taskType: string, metrics: PerformanceMetrics): void {
    const record: HistoricalRecord = {
      strategyId,
      taskId,
      taskType,
      metrics
    };
    this.store.addRecord(record);
  }

  getRecommendation(taskType: string, goal: OptimizationGoal): Recommendation {
    const strategyList = Array.from(this.strategies.values());
    return this.recommender.recommend(strategyList, taskType, goal);
  }

  getPerformanceReport(strategyId: string): any {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) throw new Error(`Strategy ${strategyId} not found`);

    const metrics = this.store.getAverageMetrics(strategyId);
    const records = this.store.getRecordsByStrategy(strategyId);

    return {
      strategy,
      averageMetrics: metrics,
      totalExecutions: records.length,
      successRate: records.filter(r => r.metrics.success).length / (records.length || 1),
      history: records.slice(-10) // Last 10 records
    };
  }

  exportHistory(): string {
    return this.store.exportData();
  }

  importHistory(data: string): void {
    this.store.importData(data);
  }

  // Advanced feature: Comparative analysis
  compareStrategies(ids: string[], taskType: string): any {
    return ids.map(id => {
      const strategy = this.strategies.get(id);
      const metrics = this.store.getAverageMetrics(id, taskType);
      return {
        id,
        name: strategy?.name || 'Unknown',
        metrics
      };
    });
  }

  // Utility to help generate simulated data for testing
  generateSimulatedData(strategyId: string, taskType: string, count: number, noise: number = 0.1): void {
    const baseMetrics: PerformanceMetrics = {
      latencyMs: 500 + Math.random() * 1000,
      tokensUsed: 100 + Math.random() * 500,
      costUsd: 0.01 + Math.random() * 0.05,
      success: true,
      score: 0.7 + Math.random() * 0.3,
      timestamp: new Date()
    };

    for (let i = 0; i < count; i++) {
      const noisyMetrics: PerformanceMetrics = {
        latencyMs: baseMetrics.latencyMs * (1 + (Math.random() - 0.5) * noise),
        tokensUsed: Math.floor(baseMetrics.tokensUsed * (1 + (Math.random() - 0.5) * noise)),
        costUsd: baseMetrics.costUsd * (1 + (Math.random() - 0.5) * noise),
        success: Math.random() > 0.05,
        score: Math.min(1, Math.max(0, (baseMetrics.score || 0.8) * (1 + (Math.random() - 0.5) * noise))),
        timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7) // Last week
      };

      this.recordExecution(strategyId, `sim-${i}`, taskType, noisyMetrics);
    }
  }
}
