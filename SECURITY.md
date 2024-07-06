# TODO

- Fuzz all cli args
- Fuzz all endpoints and args
- Pentest
- Add an option to block an user messages
- Add a message spam detection system
- Add a rate limit for requests per second, also per min (in config)
- Try to ddos the app with non closing tunnels
- Filter the dinamic elements in the GUI (Currently they are vuln to XSS and HTMLi)
- Add internal autogen credentials to avoid webpages/browser/apps making requests to local ports
- Hardening of tor service
- ??? Add support for TLS generating Let's encrypt certs per .onion domain (Only needed for clearnet, not supported yet)
- Add support for an additional layer of E2E encryption (optional in ./config/dark-messenger.json)
