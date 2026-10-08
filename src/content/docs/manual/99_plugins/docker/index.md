---
title: Docker Container Monitoring
parent: Application & Service Monitoring
grand_parent: References
nav_order: 112
type: application
has_children: true
---

# Docker Container Monitoring

----

Docker Container Monitoring utilizes the Docker API to monitor the status of Docker containers. You can not only use it to monitor the running status of local Docker containers, but also to monitor containers on each node of Kubernetes, as well as containers on EC2 instances of AWS ECS, to obtain more comprehensive data. It provides insights into CPU usage, memory usage, IO usage, and network traffic for each container.

## Adding Docker Container to Monitoring Services

1. Navigate to the Monitoring Services section by clicking on the left sidebar.
2. Click the "Add" button in the top left corner of the page.
3. Select "Single addition" under "Applications".
4. Locate "Docker Container" and click "Add".

![img.png](img.png)

5. Choose a collector that can access the Docker service you want to monitor, and proceed to fill in the required details.
6. Once filled, click "Next".

![img_1.png](img_1.png)

7. If the Zoomphant Collector is installed on the Docker host you want to monitor, no additional configuration is needed. Otherwise, specify the Docker host as `tcp://<IP or Hostname>:2376`.

![img_2.png](img_2.png)

8. Click the "Test" button to ensure successful connection, then proceed to click "Next".

![img_3.png](img_3.png)

## Viewing Monitoring Results

You can now view the added service on the monitoring services page.

![img_4.png](img_4.png)
