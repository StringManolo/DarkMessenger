start_tor() {
  local DM_DIR=$(dirname "$(readlink -f /bin/dm)")
  echo 'Starting tor...'
  tor >> "$DM_DIR/logs/tor.log" 2>&1 &
}

stop_tor() {
  pkill tor
}
