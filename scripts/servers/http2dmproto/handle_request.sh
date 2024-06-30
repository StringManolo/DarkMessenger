#!/bin/bash

DM_DIR=$(dirname "$(readlink -f /bin/dm)")
source "$DM_DIR/config/DarkMessenger.config"

if [ ! -v HIDDEN_SERVICE_PORT ]; then
  HIDDEN_SERVICE_PORT=9443
fi

HIDDEN_SERVICE_HOSTNAME='127.0.0.1' # TODO: Remove this line. local debub line

handle_request() {
  while IFS= read -r line; do
    [[ "$line" =~ ^Content-Length:\ ([0-9]+) ]] && length=${BASH_REMATCH[1]}
    [[ -z "$line" ]] && break
  done

  # Leer el cuerpo de la petición
  body=$(dd bs=1 count=$length 2>/dev/null)

  # Enviar el cuerpo al servidor de destino usando ncat
  echo -n "$body" | ncat "$HIDDEN_SERVICE_HOSTNAME" "$HIDDEN_SERVICE_PORT"
}

handle_request
