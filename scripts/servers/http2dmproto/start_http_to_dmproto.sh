#!/bin/bash

DM_DIR=$(dirname "$(readlink -f /bin/dm)")
source "$DM_DIR/config/DarkMessenger.config"


running=true
while $running; do
  if [[ ! -f "$DM_DIR/scripts/servers/http2dmproto/server.pid" ]]; then
    running=false
    exit
  else
    # Accept incoming connection and handle request
    nc -l 127.0.0.1 -p "$TRANSLATOR_PORT" -e "$DM_DIR/scripts/servers/hidden_service/handle_request.sh"
  fi
done
