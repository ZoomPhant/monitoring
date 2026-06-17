---
title: Import Grafana Dashboard
parent: Template Plugins
grand_parent: References
nav_order: 0
has_children: false
---

Grafana is a popular open-source visualization platform. It has excellent support for Prometheus-compatible data sources, making it easy to display metrics collected by Prometheus exporters.

This section describes how to import a Grafana dashboard into a custom ZoomPhant monitoring plugin.

---

### Finding a Grafana Dashboard

First, locate the Grafana dashboard designed for your target exporter. While a template plugin defines how data is collected, the imported dashboard defines how that data is visually presented.

For this example, let's assume we created a custom plugin for Spring Boot applications (as described in [Prometheus Template Plugins](../prom/)). By searching the Grafana dashboard library for "SpringBoot", we find a matching dashboard:

![image-20240410101925863](./image-20240410101925863.png)

Click the dashboard to find its ID or URL, which you will use in the next step.

---

### Importing the Grafana Dashboard

1. Navigate to **Settings** > **Custom Monitoring Plugins** and locate the custom plugin you created:

![image-20240410102044396](./image-20240410102044396.png)

2. Click the **Settings** icon to open the configuration dialog:

![image-20240401194638454](./image-20240401194638454.png)

3. In the dialog, you can import the dashboard using one of two methods:
   * **File Upload**: If you have downloaded the dashboard JSON file, click **Import From Grafana Dashboard File** and select the file.
   * **Direct Import**: Alternatively, click **Import From Grafana** to open the direct import dialog:

![image-20240401194940331](./image-20240401194940331.png)

4. Enter the Grafana dashboard ID (e.g., `12900` for the Spring Boot dashboard) or the full dashboard URL (e.g., `https://grafana.com/grafana/dashboards/12900-springboot-apm-dashboard`):

5. Click **Import** and wait a few seconds. The dashboard layout and panel configurations will be imported:

![image-20240410102545631](./image-20240410102545631.png)

6. Click **OK** to save. If you navigate to any monitoring service created using this custom plugin, the imported dashboard will now display the collected metrics.