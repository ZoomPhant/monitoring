---
title: Network Monitoring
parent: References
nav_order: 20
has_children: true
---

# Network Monitoring


Network infrastructure is complex, and failures or performance degradation can arise at multiple layers of the stack. Common network monitoring objectives include:

1. **DNS Resolution**: Is domain name resolution working, and what is the latency?
2. **Host Reachability**: Are target IP addresses reachable and responding to ICMP requests?
3. **Routing & Performance**: Are there packet losses or network routing latency spikes?
4. **Port Availability**: Are remote ports accepting TCP connections?
5. **Service Health**: Are HTTP/HTTPS endpoints responding with the correct status codes and payloads?

ZoomPhant provides a comprehensive suite of built-in network monitoring plugins to diagnose and monitor network services from any deployed Data Collection Agent. These include:

* [Ping Monitoring](./ping/)
* [DNS Monitoring](./dns/)
* [TCP Monitoring](./tcp/)
* [HTTP Monitoring](./http/)