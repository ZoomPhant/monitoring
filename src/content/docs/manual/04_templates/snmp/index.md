---
title: SNMP Template Plugin
parent: Template Plugins
grand_parent: References
nav_order: 2
has_children: false
---

SNMP (Simple Network Management Protocol) is a standard protocol used to monitor and manage network devices such as switches, routers, firewalls, UPS systems, and printers, as well as server operating systems.

ZoomPhant provides **SNMP Template Plugins** to help you collect metrics from any SNMP-enabled device without writing custom code. By creating a custom plugin from this template, you can define which OIDs (Object Identifiers) to query and map them to monitoring metrics.

---

## Create a Custom SNMP Monitoring Plugin

1. Navigate to **Settings** > **Custom Monitoring Plugins**.
2. Click the **Add MP Template** button in the top-left corner.
3. In the dialog, enter a name for your plugin and select **SNMP** as the **Template Type**.
4. (Optional) Upload an icon to represent the plugin.
5. Click **OK** to save.

Once created, you can configure your custom OID mapping rules and upload corresponding MIB (Management Information Base) files to resolve OID names automatically.

---

## Create Monitoring Services with the Custom SNMP Plugin

To monitor a device using your custom SNMP plugin, create a new service under the **Services** tab and select your custom plugin. You will be prompted to configure the following connection parameters:

### Common Parameters
* **Host**: The IP address or hostname of the target network device.
* **Port**: The UDP port used by the device's SNMP agent (default is `161`).
* **SNMP Version**: Select the version supported by your device:
  * **v1**: Legacy protocol with community string authentication.
  * **v2c**: The most common SNMP version, supporting community strings and bulk transfers.
  * **v3**: Secure SNMP protocol supporting authentication and encryption.

### SNMP v1 & v2c Settings
* **Community String**: The read-only community string used for authentication (e.g., `public`).

### SNMP v3 Settings
If you select **v3**, you must configure the following security parameters:
* **Context Name**: The SNMP context name (optional).
* **Security Name (Username)**: The username configured on the target agent.
* **Security Level**:
  * `noAuthNoPriv`: No authentication, no encryption.
  * `authNoPriv`: MD5 or SHA authentication, no encryption.
  * `authPriv`: MD5 or SHA authentication, and DES or AES encryption.
* **Auth Protocol & Key**: Select the authentication protocol (MD5 or SHA) and enter the password.
* **Priv Protocol & Key**: Select the encryption protocol (DES, AES, etc.) and enter the privacy password.

---

## Customizing Dashboards

After adding the SNMP service, ZoomPhant will begin querying the target OIDs. You can create custom dashboards or panels to visualize the SNMP data. For details on visualizing your custom metrics, refer to [Importing Grafana Dashboards](../grafana/).
