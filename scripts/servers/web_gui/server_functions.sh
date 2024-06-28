start_gui_server() {
  echo "Open http://127.0.0.1:$WEB_GUI_PORT in your browser"
  ./scripts/servers/web_gui/start_server.sh -p "$WEB_GUI_PORT" &
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
