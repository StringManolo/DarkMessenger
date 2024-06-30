#!/bin/bash

DM_DIR=$(dirname "$(readlink -f /bin/dm)")
source "$DM_DIR/config/DarkMessenger.config"

if [ ! -v HIDDEN_SERVICE_PORT ]; then
  HIDDEN_SERVICE_PORT=9443
fi

HIDDEN_SERVICE_HOSTNAME='127.0.0.1' # TODO: Remove this line. local debub line

handle_request() {
  local length=0
  request=$(cat)

  local body=$(echo "$request" | tail -n 1)

  # Log
  echo "echo \"$body\" | nc \"$HIDDEN_SERVICE_HOSTNAME\" \"$HIDDEN_SERVICE_PORT\"" >> "$DM_DIR/logs/http2dmproto_request_to_hidden.log"


  local response=$(echo -e "$body" | nc "$HIDDEN_SERVICE_HOSTNAME" "$HIDDEN_SERVICE_PORT" )

  local http_response="HTTP/1.1 200 OK\r\n"
  http_response+="Content-Type: text/plain\r\n"  
  http_response+="Content-Length: ${#length}\r\n"
  http_response+="Connection: close\r\n" 
  http_response+="\r\n"
  http_response+="$body"
  http_response+="\r\n\r\n"

  echo "$http_response";
  return
}

handle_request
