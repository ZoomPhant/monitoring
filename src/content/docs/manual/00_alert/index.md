---
title: Alerting & Notifications
parent: References
nav_order: 0
type: basic
has_children: true
---

# Alerting & Notifications

----
One of the most important functions of a monitoring system is to identify exceptional or abnormal conditions. When something unexpected happens, the monitoring system generates alerts and notifies users. 

In this section, we will explain how ZoomPhant allows users to define alerts and stay updated when they are triggered.

## Alerting & Delivery Process

The diagram below describes how ZoomPhant generates alerts and delivers notifications to users:

![image-20240406105102101](./image-20240406105102101.png)

As shown in the diagram above, ZoomPhant first evaluates alerting rules against incoming time-series data. When an alert is triggered, it is delivered to end users according to your configured delivery channels and escalation stages.

### Alert Evaluation

ZoomPhant uses **alert evaluators** to analyze time-series data in real-time, identifying exceptions or anomalies according to user-defined **Alerting Rules**. Once an exception is identified, a stateful **alert** is generated and queued for delivery.

Please refer to [Alert Settings](./alert) to learn more about defining alerting rules.

### Alert Delivery

Alert delivery in ZoomPhant is a staged escalation process centered around the **Alert Delivery Chain**. Each chain consists of one or more stages linked to specific **Alert Channels**. Within each channel, you can define one or more recipients to receive notifications via email, Webhooks, SMS, or voice calls.

When an alert is generated, the first stage is activated, and notifications are sent to the recipients defined in those channels. The alert will then escalate along the defined stages if no acknowledgment or action is detected within the specified period.

Please refer to [Alert Delivery](./delivery) to learn how to manage your alert channels, configure delivery chains, and manage the escalation process.
