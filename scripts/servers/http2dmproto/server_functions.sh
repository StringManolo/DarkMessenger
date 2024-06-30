start_http_to_dmproto_server() {
  local DM_DIR=$(dirname "$(readlink -f /bin/dm)")
  echo "Ready http2dmproto at http://127.0.0.1:$TRANSLATOR_PORT"
  "$DM_DIR/scripts/servers/http2dmproto/start_http_to_dmproto.sh" &
  echo $! > "$TRANSLATOR_PID_FILE"
  disown
}

stop_http_to_dmproto_server() {
  if [[ -f "$TRANSLATOR_PID_FILE" ]]; then
    pid=$(cat "$TRANSLATOR_PID_FILE")
    kill "$pid"
    rm "$TRANSLATOR_PID_FILE"
    # Make sure to run the loop by calling the server so it can exit
    curl "http://127.0.0.1:$TRANSLATOR_PORT" > /dev/null 2>&1
  else
    echo "translator server not running."
  fi
}
