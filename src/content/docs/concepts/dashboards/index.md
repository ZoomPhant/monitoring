---
title: Dashboards
parent: Concepts
nav_order: 3
---

# Dashboards


----

# Understanding Dashboards in Monitoring

Dashboards play a pivotal role in monitoring systems, providing users with a visual interface to effectively monitor, analyze, and manage their IT infrastructure. In Zoomphant, dashboards are categorized into three levels: global, service level, and independent level, each serving specific purposes tailored to the user's needs.

## The Importance of Dashboards in Monitoring Systems

1. **Overview of System Health:**
    - Dashboards offer a comprehensive overview of the system's health and performance metrics, allowing users to quickly identify trends, anomalies, and potential issues across their entire infrastructure.

2. **Real-time Monitoring:**
    - Dashboards provide real-time visibility into key performance indicators (KPIs), enabling users to monitor critical metrics and respond promptly to changes or incidents as they occur.

3. **Data Visualization:**
    - Dashboards utilize data visualization techniques to present complex information in an easy-to-understand format, enabling users to gain insights at a glance and make informed decisions.

4. **Customization and Flexibility:**
    - Dashboards can be customized to meet the specific needs of users and organizations, allowing them to tailor the layout, content, and metrics displayed based on their preferences and priorities.

## Types of Dashboards in Zoomphant

1. **Global Dashboard:**
    - The global dashboard provides a centralized view of the entire system on a single page, allowing users to monitor and manage multiple services and components across their infrastructure from one location.
    - Click Dashboard > Manage > Add to create a new global dashboard.
   ![img.png](img.png)
    - In a custom dashboard, you can add widgets to the dashboard by clicking on the "+ Widget" icon in the top left corner of the screen.
   ![img_1.png](img_1.png)

2. **Service Level Dashboard:**
    - Service level dashboards are specific to individual services or components within the infrastructure. Once created, a service level dashboard is accessible across all instances of the same service, providing consistent monitoring and analysis capabilities.
    - Click Dashboard > Add in a service page to create a dashboard.
    ![img_3.png](img_3.png)
    - If the toggle is set to "Service", it would be a service level dashboard.
      ![img_4.png](img_4.png)
    - You can not only see the dashboard on this service page, but also see the dashboard on other same type services.
   ![img_6.png](img_6.png)

3. **Independent Level Dashboard:**
    - Independent level dashboards are unique to the service or component they are created for and are not shared with other instances of the same service. They offer focused monitoring and analysis tailored to the specific requirements of the service.
    - Click Dashboard > Add in a service page to create a dashboard.
    - If the toggle is set to "Current", it would be an independent level dashboard.
   ![img_5.png](img_5.png)
    - You can only see the dashboard on this service page.
   ![img_7.png](img_7.png)
    

## Understanding Widgets in Zoomphant Dashboards

Widgets are the building blocks of dashboards in Zoomphant, allowing users to visualize and analyze monitoring data in various formats. Zoomphant offers a wide range of widgets, including:
When you are in a custom dashboard, you can add widgets to the dashboard by clicking on the "Add Widget" icon.
![img_8.png](img_8.png)
All the widgets contain two configuration tabs:
- **Basic Information:** 
  - Display: The name of the widget.
  - Global Time Range: The time range for the widget would follow the global time range.
  - Query Step: The time interval between each data point. 
  - Grouping: You need to set grouping in the dashboard. 
  - Description: The description of the widget.
![img_9.png](img_9.png)
- **Data Information:** Different widgets have different data information. Almost all widgets need the "Add Data Series".
  - **Graph Widget:** Displays time-series data in line, area, or bar charts, allowing users to track trends and patterns over time.
    - You can set the Y-axis label.Or just click on the "Add Data Series" button.
    ![img_10.png](img_10.png)
    - When adding data series, normally you just need to set the metric. If you are already familiar with our data query syntax, you can also use some advanced features.
    ![img_11.png](img_11.png)
    - The widget seems like this.
    ![img_12.png](img_12.png)
  - **Pie Widget:** Represents data in a circular graph, illustrating the distribution of values as proportions of a whole.
    - You can set how many slices you want. Or just click on the "Add Data Series" button.
    ![img_14.png](img_14.png)
    - The widget seems like this.
    ![img_13.png](img_13.png)
  - **Statistic Widget:** Displays key performance metrics such as average response time, error rate, or throughput in a numerical format.
    - You can add at most 4 data series for the statistic widget.
    ![img_15.png](img_15.png)
    - There are 3 queries in one data series configuration. 
      - The basic query is the same as the other series configuration.
    ![img_17.png](img_17.png)
      - And there are Sum Query and Background Query. For the Sum Query, it would show the Total in the widget. And for the Background Query, it would base on the result to set the background color.
      ![img_18.png](img_18.png)
    - The widget seems like this.
    
    ![img_16.png](img_16.png)
  - **Text Widget:** Allows users to add custom text or annotations to the dashboard to provide additional context or information.
    - Multiple texts and styles can be set here, and the display of each configuration is determined based on the comparison of the query result and the threshold
    ![img_21.png](img_21.png)
    - The widget seems like this.
    ![img_19.png](img_19.png)
  - **Monitor Table Widget:** Presents tabular data, such as server status, resource utilization, or service availability, in a structured format.
    - The widget seems like this.
    ![img_22.png](img_22.png)
  - **Log Viewer Widget:** Enables users to view and analyze log data from monitored services or components, facilitating troubleshooting and debugging.
    - The widget seems like this.
    

## Conclusion

Dashboards are essential components of monitoring systems, providing users with a centralized, real-time view of their IT infrastructure's health and performance. In Zoomphant, dashboards are customizable and flexible, offering global, service level, and independent level views tailored to the user's needs. By leveraging a variety of widgets, Zoomphant enables users to visualize and analyze monitoring data effectively, empowering them to make informed decisions and ensure the reliability and availability of their systems.
