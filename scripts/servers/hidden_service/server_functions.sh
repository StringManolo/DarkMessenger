start_hidden_service_server() {
  echo "Starting hidden service nc ..."
  local DM_DIR=$(dirname "$(readlink -f /bin/dm)")
  echo "The $DOMAIN:9443 is ready"
  "$DM_DIR/scripts/servers/hidden_service/start_hidden_service.sh" -p "
}




start_gui_server() {
  local DM_DIR=$(dirname "$(readlink -f /bin/dm)")
  echo "Open http://127.0.0.1:$WEB_GUI_PORT in your browser"
  "$DM_DIR/scripts/servers/web_gui/start_server.sh" -p "$WEB_GUI_PORT" &
  echo $! > "$PID_FILE"
  disown
}

stop_gui_server() {
  if [[ -f "$PID_FILE" ]]; then
    pid=$(cat "$PID_FILE")
    kill "$pid"
    rm "$PID_FILE"
    # Make sure to run the loop by calling the server so it can exit
    curl "http://127.0.0.1:$WEB_GUI_PORT" > /dev/null 2>&1
  else
    echo "Server not running."
  fi
}
