# DarkMessenger

**DarkMessenger** is a peer-to-peer messaging app that leverages the Tor Network to provide secure and anonymous communication. It bypasses ISP restrictions and CGNAT networks, enabling you to communicate in a decentralized manner without the need for registration or personal information.

## Features

- **Anonymous Messaging**: Use Tor hidden services to send and receive messages securely.
- **No Registration**: No need to create an account or provide any personal information.
- **Address Book**: Easily manage your contacts with aliases pointing to .onion addresses.
- **Command Line Interface**: Simple and straightforward CLI for ease of use.

## Requirements

You need to have the following software installed on your system:

- Linux (or Termux with a proot distro)
- Tor
- Git
- Node.js
- npm
- curl

### Example Installation on Alpine Linux

```bash
apk update
apk add tor git nodejs npm curl
```

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/StringManolo/DarkMessenger
cd DarkMessenger
npm install

./DarkMessenger.js
```

## Usage

Start the DarkMessenger services:

```bash
./DarkMessenger.js start
```

Stop the DarkMessenger services:

```bash
./DarkMessenger.js stop
```

Add a new contact:

```bash
./DarkMessenger.js add [alias] [domain.onion]
```

Request a remote server to add you as a contact:

```bash
./DarkMessenger.js addme [domain.onion]
```

Show a specific contact or all contacts:

```bash
./DarkMessenger.js contacts <alias>
```

Send a message to a contact:

```bash
./DarkMessenger.js send [alias] [message]
```

Show messages from a contact or all contacts:

```bash
./DarkMessenger.js show <alias>
```

Delete messages from a contact:

```bash
./DarkMessenger.js delete [id]
```

## Configuration

*Default config files are included within the repository. (You do not need to change anything in this files for the program to work).*

Your main configuration file is `config/dark-messenger.json`. Key settings include:

- `username`: The name other users will use to send you messages.
- `check_new_messages_seconds`: Seconds to check for new messages. 
- `hidden_service_address`: Local address for your .onion service.
- `hidden_service_port`: Port for your .onion service.
- `tor_socks_url`: Tor SOCKS proxy address.

## Example Configuration (`config/dark-messenger.json`)

```json
{
  "username": false,
  "use_web_gui": false,
  "web_gui_address": "127.0.0.1",
  "web_gui_port": 9000,
  "http_tor_proxy_url": "http://127.0.0.1:9002/",
  "http_tor_proxy_port": 9002,
  "hidden_service_address": "127.0.0.1",
  "hidden_service_hostname": "auto",
  "hidden_service_port": 9001,
  "tor_socks_url": "127.0.0.1:9050",
  "add_back": true,
  "alert_on_new_messages": true,
  "check_new_messages_seconds": 20,
  "verbose": true,
  "debug": true,
  "debug_with_time": true
}
```

## Example Tor Configuration (`config/torrc.conf`)

```conf
DataDirectory ./tor_files/
SocksPort 9050
Log notice file ./logs/notices.log
HiddenServiceDir ./hidden_service
HiddenServicePort 9001 127.0.0.1:9001
ORPort 0
AvoidDiskWrites 1
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you have any suggestions or improvements.

## FAQ

If you have questions, click [here](https://github.com/StringManolo/DarkMessenger/blob/main/FAQ.md) to open the FAQ.
