#!/usr/bin/env bash

DM_DIR=$(dirname "$(readlink -f /bin/dm)")

source "$DM_DIR/config/DarkMessenger.config"
# source "$DM_DIR/scripts/protocol/protocol_functions.sh"

if [ -z "${USERNAME}" ]; then
   USERNAME="UNKNOWN"
fi

handle_ack_me() {
  local remote_username="$1"
  local remote_address="$2"
  # TODO: Save in local
  echo -e "$remote_username $remote_address" >> $DM_DIR/address_book/list.txt

  echo -e "ACK_YOU $USERNAME $HIDDEN_SERVICE_HOSTNAME GOODBYE"
}

# Function to handle requests
handle_request() {
  while IFS=' ' read -r command username address goodbye; do
    case "$command" in
      ACK_ME)
        if [ "$goodbye" == "GOODBYE" ]; then
          handle_ack_me "$username" "$address"
          break
        else
          echo "UNKNOWN_REQUEST"
          break
        fi
      ;;

      ACK_YOU)
        if [ "$goodbye" == "GOODBYE" ]; then
          #handle_ack_you "$username" "$address"
          echo "handle_ack_you not implemented yet"
        else
          echo "UNKNOWN_REQUEST"
        fi
        echo "UNKNOWN_COMMAND"
        break
      ;;

      *)
        echo "UNKNOWN_COMMAND"
        break
      ;;
    esac
  done
}

echo "$(date +'%Y-%m-%d %H:%M:%S') - Request received: $@" >> "$DM_DIR/logs/hidden_service_server.log"

handle_request

