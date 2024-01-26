#!/bin/bash

# make sure we are using correct encoding
export JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8"

# start cron in background
command -v crond
if [ $? -eq 0 ]; then
  echo "0 * * * * root /usr/sbin/logrotate /etc/logrotate.d/zervice" > /etc/cron.d/logrotate
  crond -s
  echo "Log rotating enabled!"
else
  echo "Log rotating NOT enabled!"
fi

if [[ -e /first_run ]]; then
  rm /first_run

  # one time setting
  if [ "$LANGUAGE" == "zh-CN" ]; then
    sed -i "1s;^;var aio_mode=''\;\n;" /var/www/umi.*.js
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
  else
    sed -i "1s;^;var aio_mode='aio'\;\n;" /var/www/umi.*.js
    ln -sf /usr/share/zoneinfo/US/Pacific /etc/localtime
  fi

  echo "Prepare hosts ..."
  sed -ci '/^127.0.0.1[[:blank:]]/c\127.0.0.1 localhost vminsert  vmselect ingestion-server mysql kafka zervice.local' /etc/hosts

  echo "Preparing folders ..."
  mkdir -p /data/logs
  mkdir -p /data/mysql
  mkdir -p /data/kafka
  mkdir -p /data/zk
  mkdir -p /data/tsdb/ldata
  mkdir -p /data/tsdb/ldata/index
  mkdir -p /data/tsdb/ldata/chunks
  mkdir -p /data/tsdb/mdata
  mkdir -p /data/rules
  mkdir -p /data/config
  mkdir -p /data/zoomphant/icons
  mkdir -p /data/agent
  mkdir -p /usr/local/zoomphant/agent/tmp
else
  # clear last time running logs??
  rm -f /data/logs/*.log
  rm -f /data/logs/*.log.*
fi

# Properly set the mode for UI
# sed -i "s/^var aio_mode=.*/var aio_mode='${MODE}'/; t; 1s;^;var aio_mode='${MODE}'\;\n;" /var/www/umi.*.js

echo "Starting services ..."
# delegate to supervisor to get the job done
supervisord > /dev/null 2>&1

# check mysql running
mysql -s --user=root --password=changeit -e 'show global status like "uptime"' > /dev/null 2>&1
while [ $? -ne 0 ]; do
  echo "Waiting system ready ..."
  sleep 2;
  mysql -s --user=root --password=changeit -e 'show global status like "uptime"' > /dev/null 2>&1
done

if [ -f "/data/config/application.properties" ]; then
  cp /data/config/application.properties /usr/local/zoomphant/config/application.properties
fi
supervisorctl start service:backend

curl -f -LI http://127.0.0.1:8080/api/health > /dev/null 2>&1
while [ $? -ne 0 ]; do
    echo "Waiting server ready ..."
    sleep 2;
    curl -f -LI http://127.0.0.1:8080/api/health > /dev/null 2>&1
done

supervisorctl start service:ui
supervisorctl start service:ingestion
supervisorctl start service:endpoint

# if we have DB already
mysql -s --user=root --password=changeit -e 'use localdemo' > /dev/null 2>&1
if [ $? -eq 0 ]
then
  # already exists
  echo "System already initialized!"

  # special handling, to be backword compatible
  if [ -f "/data/config/agent.config.json" ]; then
    cp /data/config/agent.config.json /usr/local/zoomphant/agent/conf/config.json
  elif [ -f "/data/config/agent.conf.json" ]; then
    cp /data/config/agent.conf.json /usr/local/zoomphant/agent/conf/config.json
  fi
else
  echo "Creating localdemo account ..."
  curl -X POST -H "Content-Type: application/json" -d '{name:"localdemo",dbName:"localdemo",admin:"admin@zervice.local",properties:{}}' "http://localhost:8080/system/init" > /dev/null 2>&1

  echo "Creating localdemo ADMIN user ..."
  ## let's update user admin & collector, etc.
  mysql -s --user=root --password=changeit localdemo > /dev/null 2>&1 << EOF
  UPDATE users SET status='active', properties='{"password":"Ws9bCM6Tg-GY6-V-X2vNo0EwqEdg9QRQsMZlvSGU_W0\$ZWDdgWd75qOM3A41jo2BxA","apiKey":"123456","token":""}' WHERE email='admin@zervice.local';
EOF

  TIMESTAMP=$(($(date +%s%N)/1000000))
  mysql -s --user=root --password=changeit localdemo > /dev/null 2>&1 << EOF
  INSERT INTO monitor_agents(id, display, role, description, status, token, platform, version, configs, properties) VALUES (10000, 'Local Agent','', 'Local Test Agent', 'created', 'demo12345', 'linux', '0', '{}', '{"installCode":"local-demo-agent-run-1000", "customProps":{"_hostPaths":"/var/log","_zp_agent_type":"normal","_instanceName":"zervice.local"}, "systemProps": {"createdOn": $TIMESTAMP}}');
EOF

  mysql -s --user=root --password=changeit coredb > /dev/null 2>&1 << EOF
  INSERT INTO install_codes (code, expiresOn, status, config, properties) VALUES ('local-demo-agent-run-1000', 0, 'created', '{}', '{"account": 1, "collector": 10000}');
EOF

  mysql -s --user=root --password=changeit coredb > /dev/null 2>&1 << EOF
  INSERT INTO configurations (name, value) VALUES ('serverSettings', '{"name":"ZoomPhant AIO Server","host":"zervice.local","port":80,"secure":false,"baseUrl":"/","collectorReleaseUrl":"","enableReleaseUrl":false,"exposeReleaseUrl":false,"website":"http://www.zervice.us/","mailTo":"info@zervice.us"}');
EOF

  # let's refresh server caches ...
  curl -X POST -d '' "http://localhost:8080/system/reload?account=localdemo" > /dev/null 2>&1

  echo "Preparing collector ...."
  sleep 2;

  # let's activate the collector
  curl -f -LI http://127.0.0.1:8080/api/health > /dev/null 2>&1
  while [ $? -ne 0 ]; do
    echo "Waiting service ready ..."
    sleep 2;
    curl -f -LI http://127.0.0.1:8080/api/health > /dev/null 2>&1
  done

  VERSION=$(java -classpath /usr/local/zoomphant/agent/lib/agent-*/zoomphant-agent.jar com.zoomphant.agent.ReleaseInfo | sed -n 's/^Release[[:blank:]]\(.*\)/\1/p')
  java -classpath /usr/local/zoomphant/agent/lib/launcher.jar com.zoomphant.agent.CollectorInitializer /usr/local/zoomphant/agent local-demo-agent-run-1000 $VERSION http://zervice.local > /dev/null

  if [ ! -f "/data/config/agent.config.json" ]; then
      cp /usr/local/zoomphant/agent/conf/config.json /data/config/agent.config.json
  fi
fi

echo "Starting collector ..."
supervisorctl start service:collector

# IP=$(ip route get 8.8.8.8 | sed 's/.*src \([^ ]*\).*/\1/;t;d')
IPS=($(hostname -I))
echo "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
echo " System is ready! You can access the service as follows:                   "
echo "     URL: http://${IPS[0]}                                                 "
echo "     User: admin@zervice.local                                             "
echo "     Password: admin                                                       "
echo "                                                                           "
echo " Any question or suggestion, please reach out to info@zervice.us! Enjoy!!! "
echo "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
while true;
do
    sleep 5;
done
