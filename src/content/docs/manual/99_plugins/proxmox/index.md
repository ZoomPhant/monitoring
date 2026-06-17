---
title: ProxmoxVE Monitoring
parent: Application & Service Monitoring
grand_parent: References
nav_order: 1
has_children: true
---

Proxmox VE (PVE) is a popular open-source virtualization platform. Similar to VMware ESXi monitoring, ZoomPhant provides comprehensive, native monitoring for Proxmox VE cluster health and resource usage.

For more information about PVE, please visit the official website at [Proxmox VE](https://www.proxmox.com/en/proxmox-ve).

### Creating a Proxmox VE Monitoring Service

Before creating a Proxmox VE monitoring service, collect the following connection details:

1. **Cluster Access Endpoint**: The URL used to access the PVE administration panel (e.g., `https://192.168.1.1:8006`).
2. **Username**: The account name configured for monitoring (e.g., `monitor` or `zervice`). Include the authentication realm (domain), which defaults to `pam` (e.g., `monitor@pam`).
3. **Password or API Token**: If using an API token, format it as `tokenId=tokenValue`. For example, if you created a token with the ID `monitoring` and the value `a267354d-bc9f-426a-828c-5174382b3e00`, you must enter `monitoring=a267354d-bc9f-426a-828c-5174382b3e00` in the token field.

Once you have this information, you can add the service. Follow the steps in [Add Monitor Service](../../01_service/) and select the **Proxmox** plugin:

![image-20240408205119158](./image-20240408205119158.png?lastModify=1712581049)

In the parameters step, fill in the configuration fields:

![image-20240408205237283](./image-20240408205237283.png?lastModify=1712581049)

* **url**: Enter either the host IP and port (e.g., `192.168.1.1:8006`) or the full URL (e.g., `https://192.168.1.1:8006/`).
* **username**: The monitoring account name.
* **password**: The account password. If you are using an API token instead, leave this blank.
* **token**: The API token formatted as `tokenId=tokenValue`. Leave this blank if using a password.

Click **Finish** to complete the wizard. After a few seconds, data will begin reporting to ZoomPhant.

---

## Understanding Proxmox Data

The Proxmox VE monitoring dashboard provides an overview of cluster health, individual node statistics, and guest VM performance.

### Cluster Dashboard

The landing view is the cluster-level dashboard:

![image-20240408210653376](./image-20240408210653376.png)

This dashboard contains:
1. Cluster statistics (number of nodes, VMs, etc.).
2. Aggregated cluster resource usage (CPU, memory, storage).
3. A list of nodes with status indicators.
4. A list of guest VMs with status indicators.

The nodes and VMs listed are interactive. Click any row to navigate directly to its specific detail dashboard.

---

### Node Dashboard

Clicking a node in the node list opens the node-specific dashboard:

![image-20240408211014475](./image-20240408211014475.png)

This dashboard includes:
1. Node uptime.
2. Detailed resource utilization (CPU, memory, disk, network).
3. A list of guest VMs running on this specific node.
4. Node storage and disk status.

As with the cluster dashboard, clicking any VM in the list will navigate you to its dedicated VM dashboard.

---

### VM Dashboard

Clicking a VM in the Cluster Dashboard or Node Dashboard opens the VM-specific dashboard:

![image-20240408211530306](./image-20240408211530306.png)

This view provides:
1. VM status and uptime.
2. Detailed resource consumption.
3. Disk I/O and Network interface traffic.
4. General VM metadata.
