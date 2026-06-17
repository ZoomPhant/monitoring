# About ZoomPhant
**ZoomPhant** is an **enterprise-level monitoring solution** for customers from small to large. ZoomPhant aims to provide customers a working and **all-in-one monitoring product** that Ops and DevOps team wants. 

Using ZoomPhant, customers can focus on their valuable businesses while owning their data. ZoomPhant can totally replace customers' existing expensive monitoring solutions like DataDog, Splunk and / or open source monitoring stack like Zabbix, Prometheus & Grafana (YES, no longer need to struggle with building and maintaining of an opensource stack!)

## About The Creators

ZoomPhant is created by people who have been working in the data-center and application monitoring indrustries for 10+ years. The same people had created a world known monitoring solution and had served thousands of enterprise customers world-wide (among them many of the Fortune Global 500s). It's from that unique background and experience that we know what the next generation of monitoring solution shall be and we are driving to that direction. 

*We want to help all customers be able to (and **should**) use an **affordable** and **enterprise-level** monitoring solution!*

## Term To Use

ZoomPhant is completely **FREE for personal and non-business use**.

For business use, the **Community Version is free for startups and small businesses, provided you register your deployment**. You can register on our website or contact us at [info@zervice.us](mailto:info@zervice.us). For larger enterprises, commercial licensing is required.

Note: **We are opensource supporters!** This repository hosts the official ZoomPhant landing page and documentation site. We will gradually open source other parts of ZoomPhant like data collecting and UI, etc. Please bookmark us to get updated!

## Trying ZoomPhant
Starting with ZoomPhant is simple and straightforward. Please refer to [Quick Start](https://www.zoomphant.com/docs/start) on our documentation site, or follow the simple steps below.

***Important Note: This step is for testing purposes only. All data will be lost upon restart. If you need to save data, please refer to the Quick Start documentation for startup instructions.***

1. Find a Linux host with enough space (recommended 40+GB free diskspace and 8+GB memory)

2. Ensure you have docker installed (Version > 20)

3. Run following command and follow the instructions printed in the console:
   
```
docker run zoomphant/pack:latest
```
You will be asked to open in browser a link like below:
```
http://<your docker host ip>
```
Where the IP is your started docker container IP (thus would be different!) and you shall be able to login with username **admin@zervice.local** and initial password **admin**.

Enjoy and please read our [documentation site](https://www.zoomphant.com/docs/) for more!

## Feature Requests, Suggestions & Bugs
Please open an issue for us [here](https://github.com/ZoomPhant/monitoring/issues/new), be as detailed as possible.

## Contact US
Please reach us using email at [info@zervice.us](mailto:info@zervice.us) 
