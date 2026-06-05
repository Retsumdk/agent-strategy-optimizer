import { HistoricalRecord, PerformanceMetrics } from './types';

export class HistoricalDataStore {
  private records: HistoricalRecord[] = [];

  constructor(initialRecords: HistoricalRecord[] = []) {
    this.records = initialRecords;
  }

  addRecord(record: HistoricalRecord): void {
    this.records.push(record);
  }

  getRecordsByStrategy(strategyId: string): HistoricalRecord[] {
    return this.records.filter(r => r.strategyId === strategyId);
  }

  getRecordsByTaskType(taskType: string): HistoricalRecord[] {
    return this.records.filter(r => r.taskType === taskType);
  }

  getAverageMetrics(strategyId: string, taskType?: string): PerformanceMetrics | null {
    const filtered = this.records.filter(r => 
      r.strategyId === strategyId && (!taskType || r.taskType === taskType)
    );

    if (filtered.length === 0) return null;

    const sum = filtered.reduce((acc, curr) => ({
      latencyMs: acc.latencyMs + curr.metrics.latencyMs,
      tokensUsed: acc.tokensUsed + curr.metrics.tokensUsed,
      costUsd: acc.costUsd + curr.metrics.costUsd,
      success: acc.success && curr.metrics.success,
      score: (acc.score || 0) + (curr.metrics.score || 0),
      timestamp: new Date()
    }), {
      latencyMs: 0,
      tokensUsed: 0,
      costUsd: 0,
      success: true,
      score: 0,
      timestamp: new Date()
    });

    const count = filtered.length;
    return {
      latencyMs: sum.latencyMs / count,
      tokensUsed: sum.tokensUsed / count,
      costUsd: sum.costUsd / count,
      success: sum.success,
      score: sum.score / count,
      timestamp: new Date()
    };
  }

  clear(): void {
    this.records = [];
  }

  exportData(): string {
    return JSON.stringify(this.records, null, 2);
  }

  importData(jsonData: string): void {
    const parsed = JSON.parse(jsonData);
    if (Array.isArray(parsed)) {
      this.records = parsed.map(r => ({
        ...r,
        metrics: {
          ...r.metrics,
          timestamp: new Date(r.metrics.timestamp)
        }
      }));
    }
  }
}
