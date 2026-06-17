---
title: Customize Labels
parent: Prometheus Plugins
grand_parent: References
nav_order: 3
has_children: false
---

In a Prometheus scraper, collected metrics often contain special and/or user-defined labels. ZoomPhant automatically handles these labels, filtering out system-level Prometheus metadata while letting you define custom labels to organize and display your data.

---

## Removed Labels

Typically, a Prometheus scraper attaches two default labels to every metric:
* **job**: The name of the scraping job configured to collect the metrics.
* **instance**: The source target of the metrics, usually formatted as `host:port`.

Because ZoomPhant collects and organizes data via integrated monitoring services, these labels are redundant. ZoomPhant strips these labels from ingested metrics and replaces them with standard ZoomPhant metadata labels.

---

## Custom Labels

Prometheus allows you to define static labels in the scraper configuration file, for example:

```yaml
static_configs:
    - targets: ['app.mysite.com']
      labels:
        application: 'Awesome App'
```

In ZoomPhant, you can attach custom labels to a monitoring service. To do this, add a configuration parameter prefixed with `custom.`. The string following the prefix becomes the label key, and the parameter value becomes the label value:

```
custom.<labelName>
```

For example, adding a parameter named `custom.env` with the value `production` will add the label `env="production"` to all metrics ingested by that service.

You can add or modify custom labels at any time by editing the monitoring service settings. Note that changes only apply to metrics collected after the modification.

### Custom Label Values

When defining custom label values, you can use double curly braces to reference system variables (e.g., `{{_instanceName}}`).

ZoomPhant provides the following pre-defined variables:

* **_account**: A unique ID representing the user account.
* **_accountName**: The name of the user account.
* **_agent**: The unique ID of the collector agent executing the collection task.
* **_agentName**: The name of the collector agent.
* **_product**: The unique ID of the monitoring plugin.
* **_productName**: The name of the monitoring plugin.
* **_instance**: The unique ID representing the monitoring service instance.
* **_instanceName**: The name of the monitoring service instance.
* **_resource**: The unique ID representing the resource target.
* **_resourceName**: The name of the resource target.