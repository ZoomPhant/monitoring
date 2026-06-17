---
title: Template Plugins
parent: References
nav_order: 4
has_children: true
---

Sometimes users need to create custom monitoring plugins to meet specific business requirements. While ZoomPhant allows advanced users to develop plugins from scratch, in most cases, you can create them much faster using predefined **Template Plugins**.

A **Template Plugin** is a parameterized monitoring plugin skeleton. You can quickly configure a fully functional monitoring solution by defining connection parameters, selecting metrics, and importing dashboards. Currently, ZoomPhant supports two types of template plugins:

* **Prometheus Template Plugins**: Collect metrics via Prometheus exporters (see [Prometheus Templates](./prom/)).
* **SNMP Template Plugins**: Collect metrics using SNMP v1, v2c, or v3 protocols (see [SNMP Templates](./snmp/)).

After creating a custom plugin, you can build new dashboards or import existing ones. ZoomPhant supports importing Grafana dashboards directly, making it easy to visualize your custom metrics. For details, refer to [Importing Grafana Dashboards](./grafana/).

