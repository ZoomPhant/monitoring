---
title: Why ZoomPhant
parent: About
nav_order: 1
---

# Why ZoomPhant

---

## Why Do We Create ZoomPhant?

*Monitoring is important, it's intrinsic in our nature to make sure everything is under control, especially for a business.* A monitoring system would

* Help us understand what's going on
* More important, when things are wrong, we can find out why
* Even better, based on past information, what would happen and what should we do in advance

It is obvious that such a system won't be simple! No wonder in our journey of servicing enterprise customers over the past decade, one common comment we heard from the customers is: "*All monitoring software is a mess; we're just trying to find the least awful one.*"

This is interesting and it makes us to think about what a monitoring solution should be for the modern age. After experimenting with various monitoring softwares ourselves, combining our background and experience, we have come up with ZoomPhant as our answer. 

Let's first try classifying the existing monitoring systems into generations for a better understanding.

### First Generation Monitoring Systems: Locally Deployed Dedicated Systems

Initially, monitoring systems were designed to manage computer systems, providing performance metrics and reporting functionalities. Subsequently, standards and protocols for network management, such as SNMP, emerged, followed by commercial monitoring software like IBM's Netview and HP's OpenView, alongside open-source solutions like Nagios and Zabbix. Despite variations in timing and features, these systems shared common traits:

- Local Deployment: Primarily deployed and managed on local servers, adding to operational overhead instead of streamlining it.
- Singular Purpose: Focused either on monitoring infrastructure performance metrics or network devices.
- Static Configuration: Manual configuration of monitoring parameters and alert rules, lacking flexibility and automation.
- Limited Visualization: Offering basic charts and reports, lacking in-depth analysis and visualization capabilities.

### Second Generation Monitoring Systems: SaaS-based Centralized Management Systems

Emerging in the era of SaaS, these systems addressed the pain points of traditional monitoring systems requiring localized operations. With just a few clicks, users could deploy a monitoring system, exemplified by cloud service providers like Amazon CloudWatch, Google Stackdriver, Microsoft Azure Monitor, and commercial SaaS companies like Datadog, New Relic, and Dynatrace. 

While promising, these systems incurred high data transmission and storage costs, compelling users to reduce monitored data and shorten its retention in the cloud. Also users are worrying about the security of the data and usage of their data, and in the era of AI, users found themselves devoid of historical data, facing challenges in data exportation or encountering exorbitant export fees. This dilemma was epitomized in headlines like "NASA: We forgot the $30m bandwidth charges!"

### Third Generation Monitoring Systems: Next-Gen Monitoring Systems

Reassessing contemporary monitoring needs, we identified key functionalities that next-gen monitoring systems should embody:

- Data Sovereignty: Empowering users with greater autonomy over data storage, processing, and security. Users should choose to store monitoring data in their own environments for enhanced control over data security and compliance, with standardized data formats facilitating seamless data integration with third-party platforms.
- Cost-effectiveness: Providing more cost-effective solutions than second-generation counterparts, potentially through flexible pricing models, lower overall costs, and enhanced value propositions.
- Autonomous Deployment Options: Offering local deployment or hybrid deployment alongside SaaS models, enabling users to store critical data locally while utilizing cloud storage for non-essential data. This approach reduces users' data storage and transmission costs.

## ZoomPhant: The Next-Gen Monitoring System

ZoomPhant is based on our past experience of creating SaaS monitoring solutions as well as our experience of servicing thousands of enterprise customers all over the world. Monitoring is valuable but complicated, we want *ZoomPhant to be an affordable enterprise-level monitoring solution* for all customers, small to large. ZoomPhant would help enterprises to solve the monitoring problems for better focusing on their businesses:

- All-in-One Image Deployment: All components are consolidated into a single image for one-click deployment. Users can effortlessly deploy via Docker locally or through cloud services like AWS ECS.
- Support for Hybrid Deployment: Systems deployed locally can be centrally managed in the cloud by registering with cloud services. Data remains stored locally, with cloud access limited to viewing, thus mitigating data transmission costs and saving on cloud storage fees.
- Standardized Local Data Usage: Metric storage utilizes Prometheus format, while log storage follows Loki format, facilitating seamless integration with various data analytics platforms without constraints.
- Built-in Visual Collector Task Management: UI interface enables direct configuration for data retrieval without the need for manual configuration files, with plugin extensions available for fetching arbitrary data.
- Plus all the functions a complete monitoring solution shall have: data collecting, processing, alerting, storing, presenting and many others! 

[Try and Explore ZoomPhant Today!](../start/) 

