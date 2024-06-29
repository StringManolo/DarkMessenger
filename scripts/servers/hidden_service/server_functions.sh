start_hidden_service_server() {
  echo "Starting hidden service nc ..."
  local DM_DIR=$(dirname "$(readlink -f /bin/dm)")
  echo "The $HIDDEN_SERVICE_HOSTNAME:$HIDDEN_SERVICE_PORT is ready"
  "$DM_DIR/scripts/servers/hidden_service/start_hidden_service.sh" -p "$HIDDEN_SERVICE_PORT" &
  echo $! > "$HIDDEN_SERVICE_PID_FILE"
}


stop_hidden_service_server() {
  if [[ -f "$HIDDEN_SERVICE_PID_FILE" ]]; then
    pid=$(cat "$HIDDEN_SERVICE_PID_FILE")
    kill "$pid"
    rm "$HIDDEN_SERVICE_PID_FILE"

    # Make sure to run the loop by calling the server so it can exit
    HIDDEN_SERVICE_HOSTNAME='127.0.0.1' # TODO: Remove this line. Here for local debug
    curl "http://$HIDDEN_SERVICE_HOSTNAME:$HIDDEN_SERVICE_PORT" > /dev/null 2>&1
  else
    echo "Hidden Server not running."
  fi
}
