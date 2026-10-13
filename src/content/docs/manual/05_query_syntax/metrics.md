---
title: Metrics Query Syntax
parent: Query Syntax
grand_parent: References
nav_order: 1
has_children: false
---

# Prometheus Query Syntax Support

----

This document describes the support for Prometheus (PromQL) query syntax in our system.

## Overview

Our system implements a complete PromQL parser based on ANTLR4, supporting standard PromQL query syntax.

**Core Mechanism:** All queries use the unified `_metric` label format: `{_metric="metric_name", other_labels...}`.

### Query Examples

```promql
# Basic query
{_metric="http_requests_total", env="prod"}

# Query with aggregation
sum({_metric="http_requests_total"}) by (method)

# Query with function
rate({_metric="http_requests_total"}[5m])

# Complex calculation
sum(rate({_metric="http_requests_total"}[5m])) by (path) > 100
```

## Supported Syntax Features

### 1. Basic Queries

#### Instant Vector Selector

```promql
# Basic metric query
{_metric="http_requests_total"}

# With label filtering
{_metric="http_requests_total", method="GET", status="200"}

# Multiple label conditions
{_metric="cpu_usage", env="prod", region="us-west"}
```

#### Range Vector Selector

```promql
# Query last 5 minutes of data
{_metric="http_requests_total"}[5m]

# Range query with label filtering
{_metric="http_requests_total", method="GET"}[1h]
```

#### Time Offset

```promql
# Query data from 1 hour ago
{_metric="http_requests_total"} offset 1h

# Time offset for range queries
{_metric="http_requests_total"}[5m] offset 1h
```

#### Subquery

```promql
# Subquery syntax
rate({_metric="http_requests_total"}[5m])[30m:1m]
```

### 2. Label Matching Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Exact match | `method="GET"` |
| `!=` | Not equal | `status!="200"` |
| `=~` | Regex match | `path=~"/api/.*"` |
| `!~` | Regex not match | `path!~"/internal/.*"` |

**Examples:**

```promql
# Exact match
{_metric="http_requests_total", method="GET"}

# Not equal
{_metric="http_requests_total", status!="200"}

# Regex match
{_metric="http_requests_total", path=~"/api/.*"}

# Regex not match
{_metric="http_requests_total", path!~"/internal/.*"}
```

### 3. Arithmetic Operators

Supported binary arithmetic operators (by precedence):

| Precedence | Operator | Description |
|------------|----------|-------------|
| 1 (highest) | `^` | Power |
| 2 | `*`, `/`, `%` | Multiply, divide, modulo |
| 3 | `+`, `-` | Add, subtract |

Supported unary operators:
- `+` Positive
- `-` Negative

**Examples:**

```promql
# Calculate memory usage percentage
({_metric="node_memory_MemTotal_bytes"} - {_metric="node_memory_MemAvailable_bytes"}) / {_metric="node_memory_MemTotal_bytes"} * 100

# Power operation
rate({_metric="http_requests_total"}[5m]) ^ 2

# Division
{_metric="total_bytes"} / {_metric="total_requests"}
```

### 4. Comparison Operators

| Operator | Description |
|----------|-------------|
| `==` | Equal |
| `!=` | Not equal |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or equal |
| `<=` | Less than or equal |

Comparison operators can use the `bool` modifier to return 0 or 1:

```promql
# Return boolean value
{_metric="http_requests_total"} > bool 100

# Filter results
{_metric="cpu_usage"} > 80

# Equal comparison
{_metric="up"} == 1
```

### 5. Logical/Set Operators

| Operator | Description |
|----------|-------------|
| `and` | Intersection |
| `or` | Union |
| `unless` | Difference |

**Examples:**

```promql
# Union
{_metric="up", job="api"} or {_metric="up", job="db"}

# Intersection
{_metric="cpu_usage"} > 80 and {_metric="memory_usage"} > 80

# Difference
{_metric="up"} unless {_metric="maintenance_mode"}
```

### 6. Vector Matching

#### One-to-One Matching

```promql
# by: match on specified labels
{_metric="requests_rate"} * by(method) {_metric="request_size"}

# not by: match ignoring specified labels
{_metric="requests_rate"} * not by(instance) {_metric="request_size"}
```

#### Many-to-One/One-to-Many Matching

```promql
# group_left: left side matches to right (many-to-one)
{_metric="requests_rate"} * by(method) group_left {_metric="method_info"}

# group_right: right side matches to left (one-to-many)
{_metric="method_info"} * by(method) group_right {_metric="requests_rate"}
```

### 7. Aggregation Operators

Supported aggregation operators (case-insensitive):

| Operator | Description |
|----------|-------------|
| `sum` | Sum |
| `min` | Minimum |
| `max` | Maximum |
| `avg` | Average |
| `group` | Group (value=1) |
| `stddev` | Standard deviation |
| `stdvar` | Variance |
| `count` | Count |
| `count_values` | Count distinct values |
| `top` | Top K largest values |
| `bottom` | Top K smallest values |
| `quantile` | Quantile |

**Aggregation Syntax:**

```promql
# Basic aggregation
sum({_metric="http_requests_total"})

# Aggregate by labels (by)
sum({_metric="http_requests_total"}) by (method, status)
sum by (method, status) ({_metric="http_requests_total"})

# Aggregate without labels (without)
sum({_metric="http_requests_total"}) without (instance)
sum without (instance) ({_metric="http_requests_total"})

# top/bottom
top(5, {_metric="http_requests_total"})
bottom(3, {_metric="http_requests_total"})

# quantile
quantile(0.95, {_metric="http_response_time"})
quantile by (method) (0.99, {_metric="http_response_time"})
```

### 8. Built-in Functions

We support **55** standard PromQL functions (function names are case-insensitive):

#### Math Functions

- `abs()` - Absolute value
- `ceil()` - Round up
- `floor()` - Round down
- `round()` - Round to nearest
- `exp()` - Exponential
- `ln()` - Natural logarithm
- `log2()` - Logarithm base 2
- `log10()` - Logarithm base 10
- `sqrt()` - Square root

**Examples:**

```promql
abs({_metric="temperature_diff"})
ceil({_metric="request_duration_seconds"})
round({_metric="cpu_usage"})
sqrt({_metric="variance"})
```

#### Rate and Change Functions

- `rate()` - Per-second average rate of increase
- `irate()` - Instantaneous rate of increase
- `increase()` - Total increase over range
- `delta()` - Difference over range
- `idelta()` - Difference between last two samples
- `deriv()` - Derivative (linear regression slope)
- `resets()` - Counter resets
- `changes()` - Number of value changes

**Examples:**

```promql
# Calculate requests per second
rate({_metric="http_requests_total"}[5m])

# Instantaneous rate
irate({_metric="http_requests_total"}[5m])

# Total increase
increase({_metric="http_requests_total"}[1h])

# Delta
delta({_metric="cpu_temp"}[5m])

# Counter resets
resets({_metric="http_requests_total"}[1h])
```

#### Type Conversion Functions

- `scalar()` - Vector to scalar
- `vector()` - Scalar to vector

**Examples:**

```promql
scalar(sum({_metric="total_requests"}))
vector(100)
```

#### Existence Check

- `absent()` - Check if vector is empty
- `absent_over_time()` - Check if no data in range

**Examples:**

```promql
absent({_metric="up", job="api"})
absent_over_time({_metric="http_requests_total"}[5m])
```

#### Over Time Aggregation Functions

These functions aggregate range vectors:

- `avg_over_time()` - Average over time
- `min_over_time()` - Minimum over time
- `max_over_time()` - Maximum over time
- `sum_over_time()` - Sum over time
- `count_over_time()` - Sample count over time
- `quantile_over_time()` - Quantile over time
- `stddev_over_time()` - Standard deviation over time
- `stdvar_over_time()` - Variance over time
- `last_over_time()` - Last value over time

**Examples:**

```promql
# Average CPU usage over 1 hour
avg_over_time({_metric="cpu_usage"}[1h])

# Max memory usage in 5 minutes
max_over_time({_metric="memory_usage"}[5m])

# Sum of samples in range
sum_over_time({_metric="request_count"}[10m])

# 95th percentile
quantile_over_time(0.95, {_metric="response_time"}[5m])
```

## Complete Query Examples

### Example 1: Simple Metric Query

```promql
{_metric="up", env="prod"}
```

### Example 2: CPU Usage Calculation

```promql
100 - (avg by (mode) (rate({_metric="node_cpu_seconds_total", mode!="idle"}[5m])) * 100)
```

### Example 3: Aggregated Query

```promql
sum({_metric="http_requests_total", env="prod"}) by (method)
```

### Example 4: Top K Query

```promql
top(5, sum(rate({_metric="http_requests_total"}[5m])) by (path))
```

### Example 5: Memory Usage Percentage

```promql
({_metric="node_memory_MemTotal_bytes"} - {_metric="node_memory_MemAvailable_bytes"}) / 
{_metric="node_memory_MemTotal_bytes"} * 100
```

### Example 6: Function with Time Range

```promql
avg_over_time({_metric="cpu_usage", env="production"}[1h])
```

### Example 7: Multiple Filters

```promql
{_metric="http_requests_total", method="GET", status=~"2..", path=~"/api/.*"}
```

### Example 8: Complex Aggregation and Calculation

```promql
sum(rate({_metric="http_requests_total"}[5m])) by (status) / 
sum(rate({_metric="http_requests_total"}[5m])) * 100
```

## Time Range Support

Supported time units:

| Unit | Description | Example |
|------|-------------|---------|
| `s` | Seconds | `[30s]` |
| `m` | Minutes | `[5m]` |
| `h` | Hours | `[1h]` |
| `d` | Days | `[7d]` |
| `w` | Weeks | `[2w]` |
| `y` | Years | `[1y]` |

**Examples:**

```promql
rate({_metric="http_requests_total"}[5m])      # 5 minutes
rate({_metric="http_requests_total"}[1h])      # 1 hour
rate({_metric="http_requests_total"}[7d])      # 7 days
```

Variable interpolation is supported:

```promql
rate({_metric="http_requests_total"}[${interval}])
rate({_metric="http_requests_total"}[$interval])
```

## Query Best Practices

### 1. Label Filtering

Use label filtering effectively to reduce the number of time series:

```promql
# Recommended: explicit label filtering
{_metric="http_requests_total", env="prod", region="us-west"}

# Use regex for pattern matching
{_metric="http_requests_total", path=~"/api/v[12]/.*"}
```

### 2. Aggregation Usage

Use aggregation functions to reduce data volume for high-cardinality labels:

```promql
# Aggregate by few dimensions
sum({_metric="http_requests_total"}) by (method, status)

# Exclude high-cardinality labels
sum({_metric="http_requests_total"}) without (instance, pod)
```

### 3. Time Range Selection

Choose appropriate time ranges:

```promql
# rate/irate typically use 5m or shorter
rate({_metric="http_requests_total"}[5m])

# increase can use longer ranges
increase({_metric="http_requests_total"}[1h])

# over_time functions based on needs
avg_over_time({_metric="cpu_usage"}[15m])
```

### 4. Performance Optimization

```promql
# Aggregate first, then calculate (more efficient)
sum(rate({_metric="http_requests_total"}[5m])) by (status) / 
sum(rate({_metric="http_requests_total"}[5m]))

# Use top/bottom to limit result set
top(10, sum(rate({_metric="http_requests_total"}[5m])) by (path))
```

## Unsupported Features

TODO

## Important Notes

1. **Query Format**
   - All queries use `{_metric="metric_name", ...}` format
   - `_metric` is a required label that specifies the metric name

2. **Case Sensitivity**
   - Function names and aggregation operators: **case-insensitive**
   - Metric names (_metric values) and label names: **case-sensitive**
   - Label values: **case-sensitive**

3. **Automatic Labels**
   - The system automatically adds `job="zpmetrics"` label
   - Depending on query scope, may auto-inject `_instance`, `_resource`, or `_product` labels

4. **Compatibility**
   - Supports Grafana Dashboard
   - Function names automatically normalized to lowercase
   - `topk`/`bottomk` use `top`/`bottom`

5. **Performance Recommendations**
   - Use appropriate time ranges, avoid querying excessively long periods
   - Use label filtering effectively to reduce the number of time series
   - Use aggregation functions for high-cardinality labels to reduce data volume

## Technical Support

For questions about query syntax or to request support for new query features, please contact the technical support team.

----
