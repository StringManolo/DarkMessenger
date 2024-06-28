#!/usr/bin/env bash

# Function to handle HTTP requests
handle_request() {
    local content_type="text/html"
    local content_length=$(wc -c < ./scripts/web/index.html)

    # Construct HTTP response headers
    response="HTTP/1.1 200 OK\r\n"
    response+="Content-Type: $content_type\r\n"
    # response+="Content-Length: $content_length\r\n"
    # response+="Connection: keep-alive\r\n"
    response+="\r\n"

    # Send HTTP response headers and content
    echo -e "$response"
    cat ./scripts/web/index.html
    echo -e "\r\n\r\n"
}

running=true 
# Listen on port 9080 using BusyBox netcat (nc)
while $running; do
  if [[ ! -f scripts/servers/web_gui/server.pid ]]; then
    running=false;
    exit
  else
    # Accept incoming connection and handle request
    handle_request | nc -l -p 9080 >> "./logs/gui_server.log" 2>&1
  fi
done

