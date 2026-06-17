---
title: Why ZoomPhant
parent: About
nav_order: 1
---

# Why ZoomPhant

---

## Why Did We Create ZoomPhant?

*Monitoring is important; it is intrinsic to our nature to ensure everything is under control, especially for a business.* A monitoring system should:

* Help us understand what is going on.
* More importantly, when things go wrong, help us find out why.
* Even better, use historical data to forecast what might happen and help us prepare in advance.

It is obvious that such a system is not simple! In our decade of serving enterprise customers, a common comment we heard was: "*All monitoring software is a mess; we're just trying to find the least awful one.*"

This feedback motivated us to rethink what a monitoring solution should be in the modern age. After experimenting with various monitoring tools ourselves, and combining our background and experience, we created ZoomPhant as our answer.

To better understand our approach, let's first classify existing monitoring systems into three generations.

### First Generation Monitoring Systems: Locally Deployed Dedicated Systems

Initially, monitoring systems were designed to manage computer systems by providing performance metrics and reporting. Subsequently, standards and protocols for network management (such as SNMP) emerged, followed by commercial monitoring software like IBM's Netview and HP's OpenView, alongside open-source solutions like Nagios and Zabbix. Despite variations in release times and features, these systems shared common traits:

- **Local Deployment**: Primarily deployed and managed on local servers, which added to operational overhead instead of streamlining it.
- **Singular Purpose**: Focused strictly on either infrastructure performance metrics or network devices.
- **Static Configuration**: Required manual configuration of monitoring parameters and alert rules, lacking flexibility and automation.
- **Limited Visualization**: Offered basic charts and reports, lacking in-depth analysis and modern visualization capabilities.

### Second Generation Monitoring Systems: SaaS-based Centralized Management Systems

Emerging in the era of SaaS, these systems addressed the pain points of traditional monitoring tools that required localized operations. With just a few clicks, users could deploy a monitoring system. Examples include cloud service providers like Amazon CloudWatch, Google Stackdriver, and Microsoft Azure Monitor, as well as commercial SaaS companies like Datadog, New Relic, and Dynatrace.

While promising, these systems incurred high data transmission and storage costs, compelling users to reduce the volume of monitored data and shorten its retention in the cloud. Additionally, users worried about data security and ownership. In the era of AI, users often found themselves devoid of historical data due to challenges in data exportation or exorbitant export fees. This dilemma was epitomized in headlines like "NASA: We forgot the $30m bandwidth charges!"

### Third Generation Monitoring Systems: Next-Gen Monitoring Systems

Reassessing contemporary monitoring needs, we identified key functionalities that next-generation monitoring systems must embody:

- **Data Sovereignty**: Empowering users with autonomy over data storage, processing, and security. Users should be able to store monitoring data in their own environments for enhanced control and compliance, using standardized data formats that facilitate seamless integration with third-party platforms.
- **Cost-effectiveness**: Providing more cost-effective solutions than second-generation counterparts through flexible pricing models, lower overall costs, and a stronger value proposition.
- **Autonomous Deployment Options**: Offering local or hybrid deployment alongside SaaS models. This enables users to store critical data locally while utilizing cloud storage for non-essential data, significantly reducing data transmission and storage costs.

## ZoomPhant: The Next-Gen Monitoring System

ZoomPhant is built on our extensive experience creating SaaS monitoring solutions and serving thousands of enterprise customers worldwide. Monitoring is valuable but complex; we want *ZoomPhant to be an affordable, enterprise-level monitoring solution* for businesses of all sizes. ZoomPhant helps enterprises solve their monitoring challenges so they can focus on their core business:

- **All-in-One Image Deployment**: All components are consolidated into a single image for one-click deployment. Users can effortlessly deploy via Docker locally or through cloud services like AWS ECS.
- **Support for Hybrid Deployment**: Systems deployed locally can be centrally managed in the cloud by registering with our cloud services. Data remains stored locally, while cloud access is limited to viewing, mitigating data transmission costs and saving on cloud storage fees.
- **Standardized Local Data Usage**: Metric storage utilizes the Prometheus format, while log storage follows the Loki format, facilitating seamless integration with various data analytics platforms without vendor lock-in.
- **Built-in Visual Collector Task Management**: A user-friendly UI enables direct configuration of data retrieval without manual configuration files. Plugin extensions are also available for fetching custom data.
- **Comprehensive Monitoring Features**: ZoomPhant includes all the core functionalities of a mature monitoring solution: data collection, processing, alerting, storage, presentation, and more.

[Try and Explore ZoomPhant Today!](../start/) 

