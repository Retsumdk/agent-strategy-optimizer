# Agent Strategy Optimizer

System for comparing agent strategies and recommending the most cost-effective path based on historical performance.

## Overview

Agent Strategy Optimizer is a robust framework designed to help autonomous agents make data-driven decisions about which strategy or model to use for a given task. By tracking historical performance (latency, cost, success rate, and quality score), it provides intelligent recommendations that align with specific optimization goals.

## Features

- **Multi-Strategy Support**: Register and track multiple strategies (different models, prompts, or parameters).
- **Goal-Oriented Recommendations**: Optimize for latency, cost, score, or overall efficiency.
- **Constraint Enforcement**: Set upper bounds for cost and latency, or minimum thresholds for quality.
- **Historical Analysis**: Built-in data store for persistence and trend analysis.
- **Anomaly Detection**: Identify outliers in performance data.
- **Exploration Logic**: Automatically encourages testing new strategies when data is sparse.

## Architecture

The system is composed of several key modules:
- **StrategyOptimizer**: The main entry point and coordinator.
- **HistoricalDataStore**: Manages the persistence and retrieval of execution records.
- **Recommender**: Implements the scoring logic and constraint checking.
- **Types**: Strongly typed interfaces for consistency across the system.

## Installation

```bash
git clone https://github.com/Retsumdk/agent-strategy-optimizer.git
cd agent-strategy-optimizer
bun install
```

## Usage

### Basic Example

```typescript
import { StrategyOptimizer, Strategy, OptimizationGoal } from './src';

const optimizer = new StrategyOptimizer();

// 1. Register strategies
const fastModel: Strategy = {
  id: "fast-1",
  name: "Fast Model",
  description: "GPT-3.5 Turbo",
  model: "gpt-3.5-turbo",
  params: { temperature: 0.7 },
  metadata: {}
};

optimizer.registerStrategy(fastModel);

// 2. Record past executions
optimizer.recordExecution("fast-1", "task-abc", "summarization", {
  latencyMs: 450,
  tokensUsed: 120,
  costUsd: 0.002,
  success: true,
  score: 0.85,
  timestamp: new Date()
});

// 3. Get a recommendation
const goal: OptimizationGoal = {
  metric: 'efficiency',
  direction: 'maximize',
  constraints: {
    maxCost: 0.01
  }
};

const rec = optimizer.getRecommendation("summarization", goal);
console.log(`Recommended Strategy: ${rec.strategyId}`);
console.log(`Reasoning: ${rec.reasoning}`);
```

## API Reference

### `StrategyOptimizer`

- `registerStrategy(strategy: Strategy)`: Adds a new strategy to the system.
- `recordExecution(strategyId, taskId, taskType, metrics)`: Logs the result of an execution.
- `getRecommendation(taskType, goal)`: Returns the best strategy based on historical data.
- `getPerformanceReport(strategyId)`: Generates a detailed report for a specific strategy.
- `exportHistory()`: Returns JSON string of all records.

### `OptimizationGoal`

- `metric`: 'latency' | 'cost' | 'score' | 'efficiency'
- `direction`: 'minimize' | 'maximize'
- `constraints`: Optional limits (maxCost, maxLatency, minScore)

## Testing

Run the test suite using Bun:

```bash
bun test
```

## License

MIT License

---

Built by [Retsumdk](https://github.com/Retsumdk)
