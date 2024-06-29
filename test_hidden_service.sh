#!/usr/bin/env bash

source config/DarkMessenger.config
source scripts/servers/hidden_service/server_functions.sh

HIDDEN_SERVICE_PID_FILE="scripts/servers/hidden_service/server.pid"

start_hidden_service_server
