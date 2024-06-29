start_tor() {
  echo 'Starting tor...'
  tor >> "./logs/tor.log" 2>&1 &
}

stop_tor() {
  pkill tor
}
