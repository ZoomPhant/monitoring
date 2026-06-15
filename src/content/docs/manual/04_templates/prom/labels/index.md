---
title: Customize Labels
parent: Prometheus Plugins
grand_parent: References
nav_order: 3
has_children: false
---

In a Proometheus Scraper, the data sometimes have some special and / or user defined labels. ZoomPhant may remove some of the labels and may allow you to define extra custom labels to manage and presenting your data.

## Removed Labels

Usually a Prometheus Scraper would generate data with following two labels
* job: a name to identify the task of collecting the data
* instance: used to identify source of the data, the value usu. is the host:port part of address or url of the target

In ZoomPhant, since we collecting data in monitoring plugins in an integrated way, above labels no longer has any meaning and would thus be removed or replaced with ZoomPhant internal labels.

## Custom Labels

Prometheus Scraper allows user to add custom labels in scraper configurations, like:

    static_configs:
        - targets: ['app.mysite.com']
          labels:
            application: 'Awesome App'

In ZoomPhant, you can still add your custom labels when creating the monitoring service. This is done by adding a custom param with name been prefixed with "**custom.**", and the value of the param will then be taken as the label value:

    custom.\<labelName\>

As an example, a custom label is defined in the monitoring service configuration.

If you have already created your monitoring service, you can edit your monitoring service to add / modify custom labels, but the changes will only be reflected in data collected after your change.

### Custom Label Values

When creating custom labels, you can reference existing variables to define the label value as \{\{<variable Name>}}.

ZoomPhant has following variable been pre-defined:

* _account: A unique identifier to represent current user account.
* _accountName：Name of current user account.
* _agent：A unique identifier of the collector running the data collecting tasks.
* _agentName：Name of the collector
* _product：A unique identifier of the monitoring plugin used to define the collecting task
* _productName：Name of the monitoring plugin
* _instance：A unique identifier representing current monitoring service
* _instanceName：Name of current monitoring service
* _resource：A unique idenitifier representing the object providing the data
* _resourceName：Name of the object