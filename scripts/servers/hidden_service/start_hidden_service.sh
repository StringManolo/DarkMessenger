#!/usr/bin/env bash

DM_DIR=$(dirname "$(readlink -f /bin/dm)")

source "$DM_DIR/config/DarkMessenger.config"
# source "$DM_DIR/scripts/protocol/protocol_functions.sh"
if [ -z "${USERNAME}" ]; then
  USERNAME="UNKNOWN"
fi

if [ -n "$1" ]; then
  HIDDEN_SERVICE_PORT=$1
else
  HIDDEN_SERVICE_PORT='9443'
fi


handle_ack_me() {
  local remote_username="$1"
  local remote_address="$2"
  # TODO: Save in local  
  echo -e "$remote_username $remote_address" >> $DM_DIR/address_book/list.txt

  echo -e "ACK_YOU $USERNAME $HIDDEN_SERVICE_HOSTAME GOODBYE\r\n\r\n"
}

# handle_ack_you() {}

# Function to handle requests
handle_request() {
  while IFS=' ' read -r command username address goodbye; do
    case "$command" in
      ACK_ME)
        handle_ack_me "$username" "$address"
        ;;
      *)
        pass=true;
        ;;
    esac
  done
}


running=true
# Listen on port 9443 using BusyBox netcat (nc)
while $running; do
  if [[ ! -f "$DM_DIR/scripts/servers/hidden_service/server.pid" ]]; then
    running=false
    exit
  else
    # Accept incoming connection and handle request
    { echo "$request" | handle_request; } | nc -l -p "$HIDDEN_SERVICE_PORT" >> "$DM_DIR/logs/hidden_service_server.log" 2>&1
  fi
done

