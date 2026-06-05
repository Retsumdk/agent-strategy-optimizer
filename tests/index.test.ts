import { expect, test, describe, beforeEach } from "bun:test";
import { StrategyOptimizer } from "../src/StrategyOptimizer";
import { Strategy, OptimizationGoal } from "../src/types";

describe("StrategyOptimizer", () => {
  let optimizer: StrategyOptimizer;
  const strategy1: Strategy = {
    id: "s1",
    name: "Fast Model",
    description: "Optimized for speed",
    model: "gpt-3.5-turbo",
    params: {},
    metadata: {}
  };
  const strategy2: Strategy = {
    id: "s2",
    name: "Smart Model",
    description: "Optimized for quality",
    model: "gpt-4",
    params: {},
    metadata: {}
  };

  beforeEach(() => {
    optimizer = new StrategyOptimizer();
    optimizer.registerStrategy(strategy1);
    optimizer.registerStrategy(strategy2);
  });

  test("should register strategies correctly", () => {
    expect(optimizer.getStrategy("s1")).toBe(strategy1);
    expect(optimizer.getStrategy("s2")).toBe(strategy2);
  });

  test("should record execution and return report", () => {
    optimizer.recordExecution("s1", "task-1", "summarization", {
      latencyMs: 200,
      tokensUsed: 50,
      costUsd: 0.001,
      success: true,
      score: 0.8,
      timestamp: new Date()
    });

    const report = optimizer.getPerformanceReport("s1");
    expect(report.totalExecutions).toBe(1);
    expect(report.averageMetrics.latencyMs).toBe(200);
    expect(report.successRate).toBe(1);
  });

  test("should provide recommendations based on cost goal", () => {
    // Strategy 1 is cheaper
    optimizer.recordExecution("s1", "task-1", "chat", {
      latencyMs: 500,
      tokensUsed: 100,
      costUsd: 0.01,
      success: true,
      score: 0.8,
      timestamp: new Date()
    });
    // Strategy 2 is more expensive but better
    optimizer.recordExecution("s2", "task-2", "chat", {
      latencyMs: 1500,
      tokensUsed: 100,
      costUsd: 0.05,
      success: true,
      score: 0.95,
      timestamp: new Date()
    });

    const goal: OptimizationGoal = {
      metric: 'cost',
      direction: 'minimize'
    };

    const recommendation = optimizer.getRecommendation("chat", goal);
    expect(recommendation.strategyId).toBe("s1");
  });

  test("should provide recommendations based on score goal", () => {
    optimizer.recordExecution("s1", "task-1", "chat", {
      latencyMs: 500,
      tokensUsed: 100,
      costUsd: 0.01,
      success: true,
      score: 0.8,
      timestamp: new Date()
    });
    optimizer.recordExecution("s2", "task-2", "chat", {
      latencyMs: 1500,
      tokensUsed: 100,
      costUsd: 0.05,
      success: true,
      score: 0.95,
      timestamp: new Date()
    });

    const goal: OptimizationGoal = {
      metric: 'score',
      direction: 'maximize'
    };

    const recommendation = optimizer.getRecommendation("chat", goal);
    expect(recommendation.strategyId).toBe("s2");
  });

  test("should respect constraints in recommendation", () => {
    optimizer.recordExecution("s1", "task-1", "chat", {
      latencyMs: 100,
      tokensUsed: 100,
      costUsd: 0.01,
      success: true,
      score: 0.7,
      timestamp: new Date()
    });
    optimizer.recordExecution("s2", "task-2", "chat", {
      latencyMs: 1500,
      tokensUsed: 100,
      costUsd: 0.05,
      success: true,
      score: 0.95,
      timestamp: new Date()
    });

    const goal: OptimizationGoal = {
      metric: 'score',
      direction: 'maximize',
      constraints: {
        maxLatency: 500 // s2 will be excluded
      }
    };

    const recommendation = optimizer.getRecommendation("chat", goal);
    expect(recommendation.strategyId).toBe("s1");
  });

  test("should handle missing data by encouraging exploration", () => {
    // Only s1 has data
    optimizer.recordExecution("s1", "task-1", "code", {
      latencyMs: 1000,
      tokensUsed: 500,
      costUsd: 0.1,
      success: true,
      score: 0.9,
      timestamp: new Date()
    });

    // We ask for recommendation for s2 (which has no data)
    // The recommender should give it a chance
    const goal: OptimizationGoal = {
      metric: 'score',
      direction: 'maximize'
    };

    // Note: s2 (no data) gets 0.5, s1 (good data) gets 0.9
    // So s1 should be picked, but s2 is a candidate.
    const recommendation = optimizer.getRecommendation("code", goal);
    expect(recommendation.strategyId).toBe("s1");
  });
});
