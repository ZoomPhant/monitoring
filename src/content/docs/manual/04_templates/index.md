---
title: Template Plugins
parent: References
nav_order: 4
has_children: true
---

Some times users need to create custom monitoring plugins to meet their special business monitoring requirements. ZoomPhant allows advanced users to create custom plugins, but for most of the cases, users just need to create their custom monitoring plugins using one of the predefineed **Template Plugins**.

A **template plugin** is a templated monitoring plugin that users can create powerful monitoring plugins quickly by simple steps like adding parameters, importing dashboards, etc. Currently ZoomPhant support following two types of template plugins

* Prometheus Template Plugins: collect data using one of the widely used prometheus exporters.
* SNMP Template Plugins: collect data using SNMP v1, v2c & v3 protocols

Once you have created your custom monitoring plugin using one of the template plugins, you can create or import dashboards. ZoomPhant support import Grafana dashboards in a simple way, which makes your presenting data collected by your custom monitoring plugin very easy. For more information please refer to  [Importing Grafana Dashboards](./grafana/) 

