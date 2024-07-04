# Node version of Dark Messenger
Dark Messenger is a "p2p" messaging app that uses Tor Network to bypass ISP restrictions and exit CGNAT networks, allowing you to communicate in a decentralized network. 

### Requeriments
You need to install next software in your system:
- Linux (also termux with proot distro)
- tor
- git
- node
- npm

For example in Alpine linux:
```bash
apk update
apk add tor git nodejs npm
```

### Install
```bash
git clone https://github.com/StringManolo/DarkMessenger;
cd DarkMessenger/node/;
npm i

./DarkMessenger
```

### Usage
```bash
./DarkMessenger

Usage:

start          Wake up all services
stop           Shutdown all services

add [alias] [domain.onion]          Add an address to your Address Book
addme [domain.onion]                 Tell remote server to add you
contact <alias>                      Show a contact address or all contacts
send [alias] [message]               Send a message
show <alias>                         Show messages from someone
delete [id]                          Delete messages from someone

-c --config <filename>
-v --verbose
-d --debug
```
