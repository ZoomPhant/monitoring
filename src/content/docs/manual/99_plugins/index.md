---
title: Application & Service Monitoring
parent: References
nav_order: 99
has_children: true
---

# Application & Service Monitoring

----

ZoomPhant features a rich ecosystem of monitoring plugins for various applications and services. You can find reference documentation for these plugins in this section, or explore the plugin marketplace.

## Available Plugins

### Infrastructure & Systems
- [Docker Container Monitoring](docker/) - Monitor Docker containers via Docker API
- [Linux SNMP Monitoring](linux/) - Monitor Linux servers via SNMP
- [Nvidia GPU Monitoring](nvidiagpu/) - Monitor GPU metrics, temperature, and utilization

### Databases
- [MySQL Exporter](mysqlexporter/) - Monitor MySQL databases
- [PostgreSQL Exporter](postgresqlexporter/) - Monitor PostgreSQL databases
- [SQL Query Exporter](sqlqueryexporter/) - Custom SQL query-based monitoring

### Applications & Services
- [Nginx Monitoring](nginx/) - Monitor Nginx access logs
- [Kafka Monitoring](kafka/) - Monitor Kafka clusters, topics, and consumer groups
- [Redis Monitoring](redis/) - Monitor Redis instances
- [Proxmox Monitoring](proxmox/) - Monitor Proxmox VE clusters

### Blockchain & Storage
- [Ethereum Blockchain Monitoring](ethereum/) - Monitor Ethereum and compatible blockchains
- [GlusterFS](glusterfs/) - Monitor GlusterFS distributed filesystem

### Other Platforms
- [Windows Monitoring](windows/) - Monitor Windows systems

----

*Note: You can also use Prometheus exporters directly alongside Grafana dashboards. For details, please refer to [Prometheus Plugins](../04_templates/prom/).*