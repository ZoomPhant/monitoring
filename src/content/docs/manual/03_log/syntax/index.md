---
title: ZoomPhant Log Query Language
parent: Log Monitoring
grand_parent: References
nav_order: 1
has_children: false
---

ZoomPhant uses a stream processing language to query and analyze logs. A log processing statement typically contains three parts:

1. **Log Filtering**: Filters logs by labels or keywords to reduce the volume of data to be processed.
2. **Log Processing**: Performs transformations, extractions, grouping, or statistical analysis on the filtered log stream.
3. **Log Presentation**: Defines how to display the results, such as raw log lines, tables, or charts (e.g., line, bar, or pie charts).

For a quick reference, see the [Log Query Cheat Sheet](./Log_Query_CheatSheet.jpg).

---

## Syntax

The ZoomPhant Log Query Language is a pipe-delimited stream processing language. A query is divided into distinct stages separated by the `|` character, using the following general syntax:

```
{ streamFiltering } keywordsFiltering | processorFunc1 [args...] | processorFunc2 [args...] /as displayType
```

The first stage is a filtering stage (detailed below). While this stage is optional, it is strongly recommended for query performance. This is followed by one or more processing stages, and optionally ends with a display formatter (`/as <displayType>`).

Strings are widely used for label values, keywords, and processor arguments. You can define strings using double quotes, single quotes, or backticks to handle different quotation requirements:

### Double-Quoted Strings
This is the most common way to express strings: enclose the string in double quotes. The string itself cannot contain double quotes unless escaped.

Examples of valid double-quoted strings:
```
"error"
"Error"
"He's great"
"/api/ping"
```
It is invalid to have an unescaped double quote inside a double-quoted string:
```
"invalid "double quote""
```

### Single-Quoted Strings
Use single quotes to enclose strings that contain double quotes. The string itself cannot contain unescaped single quotes:
```
'Error'
'The "test" string is OK'
'/api/ping'
```
A single quote is not allowed inside single-quoted strings:
```
'invalid 'single quote''
```

### Tick-Quoted (Backtick) Strings
If your string contains both single and double quotes, enclose the string in backticks (ticks):
```
`Error`
`The "double quoted" string and 'single quoted' string`
`/api/ping`
```
A backtick cannot appear unescaped inside backtick-quoted strings:
```
`Illegal `back quote``
```

### RE2 Expressions
Regular expressions use the RE2 syntax and are enclosed by forward slashes (`/`):
```
/.*mysql.*/
/192\.168\.3\.\d{1,3}/
```

For more information about RE2 syntax, refer to the [RE2 Syntax Guide](https://github.com/google/re2/wiki/Syntax).

---

## Log Filtering

Because log volumes can be extremely large, you should always filter logs as early as possible in the query to improve execution efficiency.

There are two types of filtering:
1. **Log Stream Filtering**: Filters logs by their stream labels (metadata) to narrow down which log files or containers are queried.
2. **Keyword Filtering**: Searches for specific strings or patterns within the raw log content.

Applying both filters together significantly reduces the volume of log data read from disk, improving query speed.

### Log Stream Filtering
Log stream filters target log metadata (labels). The basic syntax is:
```
labelName <Operator> labelValue
```
Depending on the operator, the label value can be:
* Double, single, or tick-quoted strings.
* RE2 regular expressions enclosed by forward slashes.

The operator can be:
1. `=` : The label value matches the given string exactly.
2. `!=` : The label value does not exactly match the given string.
3. `~` : The label value matches the given RE2 expression.
4. `!~` : The label value does not match the given RE2 expression.

Two or more label filters can be `and`-ed or `or`-ed together to create a complex log stream filter:
```
_instanceName ~ "prod.*" and _category="database"
```

### Keyword Filtering
Keyword filters scan the raw log lines. Combining keyword filters with stream filters yields the best query performance.

Keywords can be any string in double, single, or tick quotes, or an RE2 expression. The following are valid keywords:
1. Single-quoted string: `'keyword'`
2. Double-quoted string: `"keyword"`
3. RE2 expression: `/key?word/`

Like label filters, you can use **and**, **or**, and **not** keywords to create complex keyword filtering expressions:
```
"Error" or "Exception"
```
or
```  
/.*mysql.*/ and not "database"
```

### Using Filtering
ZoomPhant supports two syntax options for defining filters:
1. **Literals**: Can only be used at the very beginning of a query statement.
2. **Functions**: Applied at any stage of the pipeline using pipe delimiters.

#### Using Literals
Literal filters must appear at the beginning of the query statement. We highly recommend using them to pre-filter logs before applying processing functions.

The syntax for filtering literals is:
```
{ <stream filtering> } <keyword filtering>
```
In this syntax:
1. The stream filters are surrounded by curly braces `{}`.
2. They are followed by optional keyword filters.

Examples using literal filters:
```
{_source~/.*prod-\d+/ and _category="webserver"} "Error" or "Warn"
{level="error" or level="warn"}
"/api/ping" and "error"
```

#### Using Functions
Unlike literals, filtering functions can be chained at any stage of the pipeline. They use the following syntax:
```
funcName filterExpression
```

Here are a few examples of filtering functions in a pipeline:
```
grep "Error" | grep -v "website"
match "Error" or "Warn" | filter _category="database"
filter _source!~/.*mysql.*/ and _level="error" | grep -v "test"
```

---

## Log Processing & Displaying

Once logs are filtered, you can perform transformations, extract structured data, generate time-series metrics, or compute statistics. We use functions to do this processing, and the results can be presented in different formats using display options.

---

## Log Functions

We refer to each processing step as a function. Processing functions are grouped into three categories:

1. **Log Filtering Functions**: Filter logs using labels or keywords to achieve the same result as literal filters.
2. **Log Expanding Functions**: Generate dynamic labels, parse fields, or convert raw text formats.
3. **Log Processing Functions**: Transform log streams into numerical time-series and perform aggregations.

### Log Filtering Functions
These functions filter raw log content or stream metadata:

* **grep**: Filters log lines against a single keyword. An optional `-v` option inverts the match.
  * `grep "12345"` : Returns all log lines containing "12345".
  * `grep -v "12345"` : Returns all log lines that do not contain "12345".
* **match**: Filters log lines using keyword filtering expressions. Parentheses can be used to alter evaluation order:
  * `match ("Failed" or "failed") and /192\.168\.\d{1,3}\.\d{1,3}/` : Finds lines matching "Failed" or "failed" that also contain an IP address.
  * `match "error" and "network"` : Finds lines containing both "error" and "network".
* **filter**: Filters log streams based on label values. It accepts label filtering expressions:
  * `filter service = "finance"` : Filters streams where the `service` label is "finance".
  * `filter location != "Canada"` : Filters streams where the `location` label is not "Canada".
  * `filter name ~ /Instance .*/ and _category = "website"` : Filters streams where the `name` label matches the RE2 expression and `_category` is "website".

### Log Expanding Functions
These functions parse raw log text or existing labels to dynamically extract new labels:

* **json**: Parses log lines as JSON and extracts fields as labels.
  * `json` : Extracts all top-level JSON fields as labels.
  * `json location, size` : Extracts only the `location` and `size` fields.
* **pattern**: Extracts fields from log lines using a pattern structure, using whitespace as a delimiter (similar to Grafana Loki's pattern function). Use `<labelName>` to name a captured field, or `<_>` to ignore it:
  * `pattern '<ip> - - <_> "<method> <uri> <_>" <status> <size> <_>'` : Extracts IP, HTTP method, URI, status code, and size from Nginx-style logs.
* **regexp**: Extracts labels using named RE2 capture groups:
  * `regexp /POST (?P<uri>.*) .* (?P<code>\d+) (?P<size>\d+)/` : Extracts `uri`, `code`, and `size` from matching POST requests.
* **logfmt**: Parses log lines formatted in the logfmt style (`key=value` pairs) into labels. For details, see the [logfmt specification](https://www.brandur.org/logfmt).

### Log Processing Functions
To visualize trends or count events, you can convert (vectorize) log lines into numerical time-series data. This process typically follows three steps:

1. **Vectorization**: Convert raw logs into initial time-series data using a range interval.
2. **Aggregation**: Apply statistical aggregation or filtering functions.
3. **Data Presentation**: Formatter options to display the data as charts or lists.

#### Log Vectorization Functions
ZoomPhant uses the `range` function to convert logs into a time-series based on a specified time interval:
```
range <vectorizingRange or step> use convertingFunc [<convertingParam1> ...]
range <labelName> <vectorizingRange or step> use convertingFunc [<convertingParam1> ...] [without|by (labelSet)]
```
In this syntax:
* The first form vectorizes based on log lines.
* The second form vectorizes based on a specific label value (aggregating across a `labelSet` if `by` or `without` is provided).
* **vectorizingRange** specifies the interval (e.g., `5m`, `1h`, or `auto` for auto-scaling).
* **convertingFunc** determines the conversion function:

##### Converting Functions for Log Lines:
* **rate**: Average number of log lines generated per second over the specified time range.
* **count**: Total count of log lines generated within the time range.
* **bytes_rate**: Average log volume in bytes per second over the time range.
* **bytes_count**: Total log volume in bytes generated within the time range.
* **absent**: Returns `1` if no logs were generated during the interval, and an empty vector otherwise.

##### Converting Functions for Log Labels:
Interprets the specified label value as a numeric value:
* **rate**: Calculates the per-second rate of change over the interval.
* **sum**: Calculates the sum of the numeric label values over the interval.
* **avg**: Calculates the average value over the interval.
* **max**: Calculates the maximum value over the interval.
* **min**: Calculates the minimum value over the interval.
* **first**: Returns the first non-null value in the interval.
* **last**: Returns the last non-null value in the interval.
* **stdvar**: Calculates the standard variance over the interval.
* **stddev**: Calculates the standard deviation over the interval.
* **quantile**: Calculates the specified percentile (e.g., `quantile 90` for the 90th percentile).
* **absent**: Returns `1` if no label values are present in the interval, and an empty vector otherwise.

#### Log Aggregation Functions
Once data is vectorized into a time-series, you can perform aggregations using the following syntax:
```
<funcName> [<funcParam1> ...] (without|by) (labelSet)
```
Supported aggregation functions:
* **sum**: Calculates the accumulated sum aggregated by the label set.
* **avg**: Calculates the average value aggregated by the label set.
* **min**: Gets the minimum value aggregated by the label set.
* **max**: Gets the maximum value aggregated by the label set.
* **stdvar**: Calculates the standard variance aggregated by the label set.
* **stddev**: Calculates the standard deviation aggregated by the label set.
* **count**: Counts the number of active streams aggregated by the label set.
* **top**: Returns the top N series; `N` defaults to 3 if not specified (e.g., `top 5`).
* **bottom**: Returns the bottom N series; `N` defaults to 3 if not specified (e.g., `bottom 5`).

#### Log Display Options
By default, raw log data is displayed as text lines, and time-series data is rendered as a line chart. Use the `/as` display option to override this behavior:
```
/as <displayOption>
```
Supported display options:
* **line** or **lines**: Displays the time-series as a line chart (default).
* **pie** or **pies**: Displays the time-series as a pie chart.
* **bar** or **bars**: Displays the time-series as a bar chart.
* **area** or **areas**: Displays the time-series as an area chart.
* **stack** or **stacks**: Displays the time-series as a stacked area chart.
