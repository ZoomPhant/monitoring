---
title: Log Monitoring
parent: References
nav_order: 3
has_children: true
---

ZoomPhant provides built-in log monitoring, allowing you to centralize logs and metrics within a single monitoring solution.

No additional configuration is required to start monitoring logs. Simply select a log monitoring plugin and begin [collecting your logs](./add/). Within a few seconds, you can view log data on your service dashboard or via the centralized **Log & Event** browser:

![image-20240402094249365](./image-20240402094249365.png)

---

### Dashboard Tabs

#### Overview & State View
The **Overview** tab of the Log & Event page displays the overall status of your log ingestion, while the **State View** tab details each log monitoring service:

![image-20240402094436367](./image-20240402094436367.png)

From this view, you can check the status of individual log sources. Click any source to see a detailed event state:

![image-20240402094733085](./image-20240402094733085.png)

Click on any event or click the **Query** button to start querying and processing logs for that specific source:

![image-20240402094957071](./image-20240402094957071.png)

#### General Query
To query logs across all sources, click the **Query** tab on the main **Log & Event** page:

![image-20240402094541885](./image-20240402094541885.png)

To search and filter ingestion logs, refer to the [Log Processing Syntax](./syntax/) documentation.

