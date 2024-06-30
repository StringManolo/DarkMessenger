#!/usr/bin/env bash

DM_DIR=$(dirname "$(readlink -f /bin/dm)")

source "$DM_DIR/config/DarkMessenger.config"
# source "$DM_DIR/scripts/protocol/protocol_functions.sh"

if [ -n "$1" ]; then
  HIDDEN_SERVICE_PORT=$1
else
  HIDDEN_SERVICE_PORT='9443'
fi


if [ -v $1 ]; then
   if [ ! -v HIDDEN_SERVICE_PORT ]; then
     HIDDEN_SERVICE_PORT=$1
   fi
else
  HIDDEN_SERVICE_PORT='9443'
fi


running=true
# Listen on port 9443 using BusyBox netcat (nc)
while $running; do
  if [[ ! -f "$DM_DIR/scripts/servers/hidden_service/server.pid" ]]; then
    running=false
    exit
  else
    # Accept incoming connection and handle request
    nc -l -p "$HIDDEN_SERVICE_PORT" -e "$DM_DIR/scripts/servers/hidden_service/handle_request.sh"
  fi
done

