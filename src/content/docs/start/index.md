---
title: Quick Start
nav_order: 3
has_children: false
---

# Quick Start

----
Getting started with ZoomPhant is simple. The steps below will help you get the Community Version up and running in just one minute.

*Note: The Community Version is free for personal use only. If you want to use it for business purposes, please contact us by emailing [info@zervice.us](mailto:info@zervice.us).*

## Local Deployment

To deploy locally, ensure your environment has Docker 20+ installed. For stable performance, we recommend allocating 2 CPU cores and 8GB of free memory. Start the deployment using the following command:

```bash
docker run --hostname zoomphant -it -d -v /root/data:/data -p 8080:80 --name zoomphant zoomphant/pack:latest
```

- `-v /root/data:/data`: Specifies the persistent data storage directory. You can modify this path as needed. Failure to configure this will result in data loss when the container restarts.
- `-p 8080:80`: Sets the external port. If external access is required, replace `8080` with your desired port number.
- Two image options are available: `zoomphant/pack:latest` and `zoomphant/aio:latest`. The former downloads collectors directly from GitHub, while the latter integrates the latest collectors into the image (resulting in a larger image size).

## Cloud Deployment

For cloud deployment (using AWS ECS as an example), follow these steps:

1. Create a Task Definition in ECS and configure the container:
    - Set the Image URI to `zoomphant/pack:latest`.
    - Map at least port 80 to enable UI access and collector data reporting.

![img.png](img.png)

2. Configure Volumes to map `/data` to an EBS volume to ensure data persistence.

![img_1.png](img_1.png)

3. Launch a service in a cluster using the task definition.

## Getting Started

Access the system via `http://<your_ip>:8080` in your browser. The default credentials are `admin@zervice.local` / `admin`. Make sure to change the default password upon your first login.

![img_3.png](img_3.png)

Upon login, you will enter the Wizard page by default. Follow the prompts to configure:

1. **System Configuration**: Configure the system domain name for alert URLs and new collector installations.
   1. **External Service Host and External Service Port**: These critical settings are used when installing a new collector. Ensure this address is accessible. In an AWS environment, we recommend using the private IP of the EC2 instance to avoid network traffic charges.
   2. **Enable Release Server**: Check this if you are using the `pack` image.

![img_2.png](img_2.png)

2. **Alert Delivery**: Set up alert delivery to ensure timely notifications.
   1. **Delivery Channel**: Configure the communication channels (e.g., email, Slack) used to send alerts.
   2. **Delivery Chain**: Configure a sequence of steps to escalate or route alerts through different channels.

![img_5.png](img_5.png)

3. **Creating Monitors**: Utilize the built-in collector to create your first monitor. We use an HTTP monitor as an example here since it only requires a URL.

![img_6.png](img_6.png)

4. **Infrastructure Monitoring**: If you want to monitor other servers or devices and find it too cumbersome to configure SNMP or WMI, you can install a local collector. This allows you to monitor the device in more detail and collect local log files. Select your target operating system (e.g., Linux) and run the provided command on the target server to set up monitoring.
   1. The command line includes the Address configured in the first step. Make sure this address is accessible from the target server.
   2. The command must be run as the `root` user.
   3. If `wget` is not available, you can download the installation package manually on the target server and execute the "Option 2" command.

![img_4.png](img_4.png)
![img_7.png](img_7.png)

5. **Log Monitoring**: Enable log monitoring by specifying a log file path that the collector can access. You can try this out using the built-in collector with the system's Nginx access log.
   1. We use Grok to parse logs. You can customize the Grok pattern if you have a non-standard Nginx log format.

![img_8.png](img_8.png)

Upon completion, click **Finish Now** to exit the wizard. You can now access monitoring dashboards and manage services from the **Services** page in the left sidebar.

![img_9.png](img_9.png)


