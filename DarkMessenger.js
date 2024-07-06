#!/usr/bin/env node

import fs from "fs";
import { spawn, exec } from "child_process";
import parseCLI from "simpleargumentsparser";
import chalk from "chalk";
import readline from "readline";

// globals
let v = false; // verbose
let d = false; // debug
let config;     // config

(async () => {
  const cli = await parseCLI();

  if (cli.noArgs || cli.s.h || cli.c.help)
    exit(`Usage:

${chalk.bold.yellow('start')}          ${chalk.white('Wake up all services')}
${chalk.bold.yellow('stop')}           ${chalk.white('Shutdown all services')}

${chalk.bold.yellow('add')} ${chalk.italic('[alias] [domain.onion]')}           ${chalk.white('Add an address to your Address Book')}
${chalk.bold.yellow('addme')} ${chalk.italic('[domain.onion]')}                 ${chalk.white('Tell remote server to add you')}
${chalk.bold.yellow('contacts')} ${chalk.italic('<alias>')}                     ${chalk.white('Show a contact address or all contacts')}
${chalk.bold.yellow('send')} ${chalk.italic('[alias] [message]')}               ${chalk.white('Send a message')}
${chalk.bold.yellow('show')} ${chalk.italic('<alias>')}                         ${chalk.white('Show messages from someone')}
${chalk.bold.yellow('delete')} ${chalk.italic('[id]')}                          ${chalk.white('Delete messages from someone')}

${chalk.bold.yellow('-v --verbose')}
${chalk.bold.yellow('-d --debug')}
`);

  if (cli.s.v || cli.c.verbose) v = true;

  if (cli.c.start || cli.o[0].includes("start")) {
    await start(cli);
  } else if (cli.c.stop || cli.o[0].includes("stop")) {
    await stop(cli);
  } else {
    if (cli.o[0].includes("add")) {
      await add(cli);
      process.exit(0);
    } else if (cli.o[0].includes("addme")) {
      await addme(cli);
      process.exit(0);
    } else if (cli.o[0].includes("contacts")) {
      await contacts(cli);
      process.exit(0);
    } else if (cli.o[0].includes("send")) {
      await send(cli);
      process.exit(0);
    } else if (cli.o[0].includes("show")) {
      await show(cli);
      process.exit(0);
    } else if (cli.o[0].includes("delete")) {
      await del(cli);
      process.exit(0);
    } else {
      // TODO: not known commands
      process.exit(0);
    }
  }
})();

const exit = msg => {
  console.log(msg);
  process.exit(0);
};

const verbose = msg => {
  if (v || config?.verbose) {
    console.log(`${chalk.bold.green("[VERBOSE]")} ${msg}`);
  }
};

const debug = msg => {
  if (d || config?.debug) {
    if (config?.debug_with_time) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
      const timestamp = `${hours}:${minutes}:${seconds}.${milliseconds}`;
      console.log(`${chalk.bold.blue("[DEBUG-" + timestamp + "]")} ${msg}`);
    } else {
      console.log(`${chalk.bold.blue("[DEBUG]")} ${msg}`);
    }
  }
};

const error = msg => {
  console.log(`${chalk.bold.red("[ERROR]")} ${msg}`);
};

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = question => {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
};

const curl = async (url, args) => {
  return new Promise((resolve, reject) => {
    debug(`Running command: curl --socks5-hostname 127.0.0.1:9050 '${url}:9001/${args}' `);
    exec(`curl --socks5-hostname 127.0.0.1:9050 ${url}:9001/${args}`, (err, stdout, stderr) => {
      if (err) {
        error(`Error running curl: ${err}`);
        reject(err);
        return;
      }
      
      /*if (stderr) {
        error(`stderr: ${stderr}`);
      }*/

      debug(`Resolving command ...`);
      resolve(stdout);
    });
  });
};

const add = async (cli) => {
  v = true;
  d = true;
  debug(`Getting alias and address from cli args ...`);
  const alias = cli.o?.[1]?.[0];
  const address = cli.o?.[2]?.[0];
  debug(`Alias: (${alias}), Address (${address})`);

  debug(`Testing if alias is a valid format ...`);
  if (! /^[a-zA-Z0-9\-_.@]{1,99}$/.test(alias)) {
    error(`Alias can only use alphanumeric charcaters and be 1 to 99 characters long. \nThis characters are also alloweed: - _ . @`);
    process.exit(0);
  }

  debug(`Testing if onion address is valid ...`);
  if (! /^(?:[a-z2-7]{16}|[a-z2-7]{56})\.onion$/.test(address)) {
    error(`The onion address is not valid. Make sure you adding a real address`);
    process.exit(0);
  }

  let addressBook = [];
  try {
    debug(`Reading ./address_book/list.txt ... `);
    const data = await fs.promises.readFile('./address_book/list.txt', 'utf8');
    debug(`Splitting entries by line ... `);
    addressBook = data.split('\n').map(line => line.trim()).filter(line => line !== '');
    debug(`A total of ${addressBook.length} contacts found in your addresses list`);
  } catch (err) {
    error('Error reading file:', err);
    process.exit(0);
  }

  /* Check for duplicates to prevent username spoofing */
  for (let i in addressBook) {
    const auxAlias = addressBook[i].split(" ")[0];
    if (auxAlias == alias) {
      error(`Alias "${alias}" already exists, use a different alias`);
      process.exit(0);
    }
  }

  debug(`Adding new entry to in-memory address book ... `);
  addressBook.push(`${alias} ${address}`);
  debug(`Removing all duplicates (if there is any) ... `);
  const uniqueEntries = new Set(addressBook);
  debug(`Casting addressBook array to a string (ready to dump in file)... `);
  const updatedText = Array.from(uniqueEntries).join('\n');

  try {
    debug(`Rewrite address_book/list.txt with the new ssv alias address pair`);
    await fs.promises.writeFile('./address_book/list.txt', updatedText);
    console.log("Added to your address book");
  } catch (err) {
    error(`Error writting on the address book: ${err}`);
  } 
  debug(`Done`);
}

const addme = async (cli) => { //TODO: Add Verbose and Debug outputs
  v = true;
  d = true;
  try {
    debug(`Loading config...`);
    config = await loadConfig("./config/dark-messenger.json");
    debug(`Loading hostname...`);
    const hostname = config.hidden_service_hostname = (await loadFile("./hidden_service/hostname")).trim();
    debug(`Extracting onion domain from cli`);
    if (! cli.o?.[1]?.[0] ) {
      error(`Use "./DarkMessenger addme domain.onion" to provide the address of the user you want to add you`);
      process.exit(0);
    }

    /* Avoid making useless requests client side */
    if (! /^[a-zA-Z0-9\-_.@]{1,99}$/.test(config?.username)) {
      error(`Your username is not valid. Only alphanumeric characters.\nNext characters are also allowed: - _ . @`);
      process.exit(0);
    }

    if (! /^(?:[a-z2-7]{16}|[a-z2-7]{56})\.onion$/.test(cli.o[1][0])) {
      error(`Onion address is not valid, preventing useless request ...`);
      process.exit(0);
    }

    const result = await curl(`${cli.o[1][0]}`, `addme -d '{ "alias":"${config.username}", "address":"${hostname}" }' -H 'Content-Type: application/json'`);
    debug(`Result: ${result}`);
  } catch(err) {
    error(`Error on Add() : ${err}`);
  }

  if (cli?.add_back) {
    if (await ask("Do you want to add the address to your contact list too? [Y/N] -> ").toUpperCase() === "Y" ) {
      let tmpUsername = "";
      do {
        tmpUsername = await ask("Please provide a username / alias for the contact -> ");
      } while (! /^[a-zA-Z0-9\-_.@]{1,99}$/.test(tmpUsername));
      cli.o[2][0] = cli.o[1][0]; // set address
      cli.o[1][0] = tmpUsername; // set username
      await add(cli);
    }
  }
}

const send = async (cli) => {
  v = true;
  d = true;
  const alias = cli.o?.[1]?.[0];
  const message = cli.o?.[2]?.[0];
  let address = "";
  try {
    const data = await fs.promises.readFile('./address_book/list.txt', 'utf8');
    const addressBook = data.split('\n').map(line => line.trim()).filter(line => line !== '');
    for (let i in addressBook) {
      if (addressBook[i].split(" ")[0] == alias) {
        debug(`Alias found, extracting address ... `);
        address = addressBook[i].split(" ")[1];
        break;
      }
    }

    debug(`Loading config...`);
    config = await loadConfig("./config/dark-messenger.json");

    debug(`Sending message ... `);
    const result = await curl(`${address}`, `send -d '{ "from":"${config.username}", "message":"${Buffer.from(message).toString('base64')}" }' -H 'Content-Type: application/json'`);
    console.log(result); 

  } catch(err) {
    error(`Error on Add() : ${err}`);
  }
}


const contacts = async (cli) => {
  v = true;
  d = true;

  const alias = cli.o?.[1]?.[0];
  // let foundContacts = false;
  let result = false;

  try {
    const contacts = await fs.promises.readFile("./address_book/list.txt", "utf-8") || null;
    if (!contacts) exit("Contact list is empty");
    if (!alias) {
      result = contacts;
    } else {
      
      const contactLine = contacts.split("\n");
      for (let i in contactLine) {
        if (contactLine[i].split(" ")[0] === alias) {
          result = contactLine[i]
          break;
        }
      }
    }
  } catch(err) {
    error(`Unable to read contacts from ./address_book/list.txt`);
    process.exit(0);
  }

  if (result) {
    console.log(result);
  } else {
    console.log("Unable to find");
  }

}


const show = async (cli) => {
  v = true;
  d = true;

  const alias = cli.o?.[1]?.[0];
  debug(`Alias on show function is ${alias}`);

  try {
    const messagesRAW = await fs.promises.readFile('./messages/list.json', 'utf8'); 
    const messages = JSON.parse(messagesRAW);

    let textMessages = "";
    let found = false;

    // Mark As Read
    let foundIds = JSON.parse(await fs.promises.readFile("./messages/read_messages.json", "utf-8"));

    if (!alias) {
      for (let i in messages) {
        found = true;
        textMessages += `Message with id ${chalk.bold.yellow(messages[i].id)} from ${chalk.bold.yellow(messages[i].from)}\n`
        textMessages += `${messages[i].message}\n\n`;
        foundIds.push(messages[i].id);
      }
    } else {
      for (let i in messages) {
        if (messages[i].from === alias) {
          found = true;
          textMessages += `Message with id ${chalk.bold.yellow(messages[i].id)} from ${chalk.bold.yellow(messages[i].from)}\n${messages[i].message}\n\n`; 
          foundIds.push(messages[i].id);
        }
      }
    }
  

    if (!found) {
      console.log(`No messages to show`);
    } else {
      console.log(textMessages);
      foundIds = [... new Set(foundIds)]; //remove duplicated ids
      await fs.promises.writeFile("./messages/read_messages.json", JSON.stringify(foundIds, null, 2))
    }
  } catch(err) {
    error(`Unable to read/parse/access ./messages/list.json: ${err}`);
    process.exit(0);
  }
}

const del = async (cli) => {
  v = true;
  d = true;


  const id = cli.o?.[1]?.[0];
  debug(`Got ID ${id} from cli`);
  if (!id) {
    error(`You need to provide the id of the message you want to remove`);
    process.exit(0);
  }

  try {
    const messagesRAW = await fs.promises.readFile('./messages/list.json', 'utf8');
    let messages = JSON.parse(messagesRAW);

    debug(`Removing message ...`);
    messages = messages.filter(message => +message.id !== +id);

    await fs.promises.writeFile('./messages/list.json', JSON.stringify(messages, null, 2));

    debug(`Making id free from ./messages/read_messages.json ...`);
    let readMessages = JSON.parse(await fs.promises.readFile("./messages/read_messages.json"));
    readMessages = readMessages.filter(readId => +readId !== +id);
    await fs.promises.writeFile('./messages/read_messages.json', JSON.stringify(readMessages, null, 2)); 

  } catch(err) {
    error(`Unable to delete message: ${err}`);
  }

  console.log('Done');
}


const startTor = () => {
  debug(`Creating file to store tor pid process ... `);
  verbose(`Starting Tor ...`);
  const process = spawn("/usr/bin/tor", ["-f", "./config/torrc.conf"], {
    detached: true,
    stdio: "ignore"
  });

  debug(`Storing tor pid at ./tor_files/tor.pid ...`);
  if (!fs.existsSync("./tor_files")) {
    debug(`Making dir ./tor_files/ ... `);
    fs.mkdirSync("./tor_files", { recursive: true });
  }

  fs.writeFileSync("./tor_files/tor.pid", process.pid.toString());

  debug(`Detaching tor process from node process ...`);
  process.unref();

  process.on('error', (err) => {
    error(`Error Starting Tor: ${err}`);
  });

  process.on("close", (code) => {
    verbose(`Closing Tor ...`);
    debug(`Tor process closing with code: ${code}`);
  });
};

const stopTor = () => {
  debug(`Extracting tor process id from ./tor_files/tor.pid ... `);
  if (fs.existsSync("./tor_files/tor.pid")) {
    const pid = parseInt(fs.readFileSync("./tor_files/tor.pid").toString(), 10);
    debug(`Extracted pid: ${pid}`);

    try {
      verbose(`Stopping Tor`);
      debug(`Sending SIGTERM signal tor process id ${pid}`);
      process.kill(pid, 'SIGTERM');
      console.log("Tor successfully stopped.");
      debug(`Deleting ./tor_files/tor.pid file ...`);
      fs.unlinkSync("./tor_files/tor.pid");
      debug(`./tor_files/tor.pid has been deleted`);
    } catch (err) {
      error(`Unable to terminate tor process with PID ${pid}: ${err}`);
    }
  } else {
    error(`./tor_files/tor.pid can't be found`);
  }
};

const start = async (cli) => {
  if (cli.c.config) {
    if (typeof cli.c.config === "string") {
      config = await loadConfig(cli.c.config);
    }
  }

  if (!config) {
    console.log(`Loading default config file expected at (./config/dark-messenger.json) ... `);
    config = await loadConfig("./config/dark-messenger.json");
    if (!config) {
      exit(`Unable to load any config.`);
    }
  }

  verbose("Verbose Activated");
  debug("Debug Activated");

  if (!config?.username) {
    let tmpUsername = "";
    do {
      tmpUsername = await ask("Please provide a username / alias -> ");
    } while (! /^[a-zA-Z0-9\-_.@]{1,99}$/.test(tmpUsername));

    config.username = tmpUsername;
    // save username in config:
    fs.writeFileSync("./config/dark-messenger.json", JSON.stringify(config, null, 4));
  }

  if (fs.existsSync("./tor_files/tor.pid")) {
    const torPid = await fs.promises.readFile("./tor_files/tor.pid");
    verbose(`Tor already running with pid ${torPid}`);
  } else {
    if (!fs.existsSync("./hidden_service")) {
      debug(`./hidden_service folder dosn't exist yet. Making it ...`);
      fs.mkdirSync("./hidden_service", { recursive: true });
      debug(`Setting hidden_service folder permissions ...`);
      fs.chmodSync("./hidden_service", 0o700);
    }

    if (!fs.existsSync("./logs")) {
      debug(`./logs folder dosn't exist yet. Making it ...`);
      fs.mkdirSync("./logs", { recursive: true });
    }
    startTor();
  }

  if (config) {
    debug(`Replacing auto by hostnane ...`);
    if (config?.hidden_service_hostname === "auto") {
      let secondsCounter = 0;
      debug(`Waiting for ./hidden_service/hostname file to be created by tor`);
      while (!fs.existsSync("./hidden_service/hostname")) {
        await sleep(1000);
        debug(`Waited ${++secondsCounter} second/s for file to be created by Tor`);
        if (secondsCounter > 10) {
          debug(`Waiting for to long. Breaking from loop`);
          break;
        }
      }

      try {
        config.hidden_service_hostname = (await loadFile("./hidden_service/hostname")).trim();
        debug(`Got hostname: ${config.hidden_service_hostname}`);
      } catch(err) {
        error(`Unable to load ./hidden_service/hostanme, maybe try again: ${error}`);
      }
    }

    debug(`Checking if alert_on_new_messages is true`);
    if (config?.alert_on_new_messages) {
      if (fs.existsSync("./message_alert_server.pid")) {
        const masPid = await fs.promises.readFile("./message_alert_server.pid");
        verbose(`Message Alert Server already running with pid ${masPid}`);
      } else {
        debug(`Generating MessageAlert server source code`);
        const newMessageAlertServerScript = generateMessageAlertServiceScript(config);
        debug(`MessageAlert Service code generated:\n${newMessageAlertServerScript}\n`);
        debug(`Creating ./startMessageAlertServer.js file`);
        await writeMessageAlertServerScript(newMessageAlertServerScript);
        debug(`Calling startMessageAlertServer() ...`);
        startMessageAlertServer();
        debug(`Call done`);
      }
    } else {
      debug(`Not using MessageNotifier, to activate it add next options to your ./config/dark-messenger.json file:\n"alert_on_new_messages": "true",\n"check_new_messages_seconds": "15",`); 
    }

    debug(`Checking if use_web_gui is true`);
    if (config?.use_web_gui) {
      if (fs.existsSync("./gui_server.pid")) {
        const guiPid = await fs.promises.readFile("./gui_server.pid");
        verbose(`GUI Server already running with pid ${guiPid}`);
      } else {
        debug(`Generating GUI Server source code ...`);
        const guiServerScript = generateGuiServerScript(config);
        debug(`GUI Server code generated:\n${guiServerScript}\n`);
        debug(`Creating ./startGuiServer.js file ...`);
        await writeGuiServerScript(guiServerScript);
        debug(`Calling startGuiServer() ...`);
        startGuiServer();
        debug(`Call done`);

        debug(`Also using the Tor Proxy Server by default to allow any browser to reach .onion addresses without browser configuration ...`);
        if (fs.existsSync("./proxy_server.pid")) {
          const proxyPid = await fs.promises.readFile("./proxy_server.pid");
          verbose(`Proxy Server already running with pid ${proxyPid}`);
        } else {
          debug(`generating proxy server source code ...`);
          const proxyServerScript = generateProxyServerScript(config);
          debug(`Proxy Server code generated:\n${proxyServerScript}\n`);
          debug(`Creating ./startProxyServer.js file ...`);
          await writeProxyServerScript(proxyServerScript);
          debug(`Calling startProxyServer() ...`);
          startProxyServer();
          debug(`Call done`);
        }
      }
    } else {
      debug(`Not using Web GUI, to activate it add next options to your ./config/dark-messenger.json file:\n"use_web_gui": "true",\n"web_gui_address": "127.0.0.1",\n"web_gui_port": "9000",`);
    }

    if (fs.existsSync("./hidden_server.pid")) {
      const hiddenPid = await fs.promises.readFile("./hidden_server.pid");
      verbose(`Hidden Server already running with pid ${hiddenPid}`);
    } else {
      debug(`Generating Hidden Server source code ...`);
      const hiddenServerScript = generateHiddenServerScript(config);
      debug(`Hidden Server code generated:\n${hiddenServerScript}\n`);
      debug(`Creating ./startHiddenServer.js file ...`);
      await writeHiddenServerScript(hiddenServerScript);
      debug(`Calling startHiddenServer() ...`);
      startHiddenServer();
      debug(`Call done`);
    }

  } else {
    debug(`Config not found. This is can't never happen btw`);
  }

  if (config?.hidden_service_hostname) {
    console.log(`\nYour address is ${chalk.bold.yellow(config.hidden_service_hostname)} \nYou can copy to share it with your friends.\n\n`);
  }

  process.exit(0);
};

const stop = async (cli) => {
  if (cli.c.config) {
    if (typeof cli.c.config === "string") {
      config = await loadConfig(cli.c.config);
    }
  }

  if (!config) {
    console.log(`Loading default config file expected at (./config/dark-messenger.json) ... `);
    config = await loadConfig("./config/dark-messenger.json");
    if (!config) {
      exit(`Unable to load any config.`);
    }
  }

  verbose("Verbose Activated");
  debug("Debug Activated");

  console.log(`Stopping All Services...`);
  stopMessageAlertServer();
  if (config?.use_web_gui) {
    stopGuiServer();
    stopProxyServer();
  }
  stopHiddenServer();
  stopTor();

  process.exit(0);
};

const loadFile = async (path) => {
  try {
    const data = await fs.promises.readFile(path, "utf8");
    return data;
  } catch (err) {
    error(`Unable to read ${path}: ${err}`)
    throw err;
  }
};

const loadConfig = async (path) => {
  try {
    const file = await loadFile(path);
    return JSON.parse(file);
  } catch (err) {
    error(`Unable to load config ${path} as JSON: ${err}`)
  }
};


const generateGuiServerScript = (config) => {
  const script = `#!/usr/bin/env node
    import fs from "fs";
    import express from "express";

    const app = express();
    const port = ${config?.web_gui_port || 9000};
    const hostname = "${config?.web_gui_address || "127.0.0.1"}";
    let contacts = fs.readFileSync("./address_book/list.txt", "utf-8") || null;
    let auxContacts = "";
    if (contacts) {
      // TODO: FIX -> XSS / HTMLi here:
      auxContacts = contacts.split("\\n")
        .map(line => line.length > 2 ? \`<article class="contactName" onion="\${line.split(" ")[1]}">\${line.split(" ")[0]}</article>\` : "");
      contacts = "<section id='contacts'>";
      contacts += auxContacts.join("\\n");
      contacts += "</section>"
    } else {
      contacts = "No contacts found";
    }

    app.get('/', (req, res) => {
      res.send(\`<!DOCTYPE html>
<html lang="en">
<head prefix="og:http://ogp.me/ns#">
  <meta charset="utf-8">
  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
  <title>Dark Messenger GUI</title>
  <meta property="og:type" content="website">
  <meta name="theme-color" content="#ffffff">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #2c2f33;
      color: snow;
      display: flex;
      flex-direction: column;
      width: 90%;
    }
    #messageInput {
      display: flex;
      flex-direction: row;
      padding: 10px;
    }
    #sendMessageInput {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 5px;
      background-color: #40444b;
      color: white;
    }
    #sendMessageButton {
      padding: 10px;
      border: none;
      border-radius: 5px;
      background-color: #7289da;
      color: white;
    }
    #contacts {
      display: flex;
      flex: 1;
      flex-direction: column;
      color: white;
    }
    .contactName {
      display: flex;
      flex: 1;
      border-bottom: 2px solid black;
      font-size: 30px;
      margin-left: 50px; /* Tmp margin for future profile picture */
    }
    .hidden {
      display: none !important;
    }
    #contactHeader {
      display: none;
      align-items: center;
      padding: 10px;
    }
    #backButton {
      cursor: pointer;
      margin-right: 20px;
    }
    #contactNameDisplay {
      font-weight: bold;
      flex: 1;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="contacts">
    <!-- TODO: Avoid XSS / HTMLi -->
    \${contacts}
  </div>
  <div id="contactHeader">
    <span id="backButton">←</span>
    <div id="contactNameDisplay"></div>
  </div>
  <div id="messageInput" class="hidden">
    <input type="text" placeholder="Type a message..." id="sendMessageInput">
    <button id="sendMessageButton" onclick="sendMessage()">Send</button>
  </div>
  <script>
    let currentView = "main";
    const contacts = document.querySelectorAll(".contactName");
    const contactsContainer = document.querySelector("#contacts");
    const contactHeader = document.querySelector("#contactHeader");
    const contactNameDisplay = document.querySelector("#contactNameDisplay");
    const messageInput = document.querySelector("#messageInput");
    const backButton = document.querySelector("#backButton");

    contacts.forEach(contact => {
      contact.addEventListener("click", (evnt) => {
        currentView = "contact." + evnt.target.innerHTML;
        contactNameDisplay.innerHTML = evnt.target.innerHTML;
        contactsContainer.classList.add("hidden");
        contactHeader.style.display = "flex";
        messageInput.classList.remove("hidden");
      });
    });

    backButton.addEventListener("click", () => {
      contactsContainer.classList.remove("hidden");
      contactHeader.style.display = "none";
      messageInput.classList.add("hidden");
    });

    const sendMessage = () => {
      const message = document.querySelector("#sendMessageInput").value;
      if (!message || message.length < 1) {
        alert("Message can't be void");
        return;
      }
      const requestData = {
        from: '${config?.username || "unknown"}',
        message: btoa(message)
      };
      fetch('${config?.http_tor_proxy_url || "http://127.0.0.1:9002/"}http://${config?.hidden_service_hostname || "127.0.0.1"}:${config?.hidden_service_port || 9001}/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
     .then(response => response.text())
     .then(data => alert(data))
     .catch(error => alert('Error: ' + error.message));
    }
  </script>
</body>
</html>
      \`);
    });

    const server = app.listen(port, hostname, () => {
      console.log(\`GUI Server listening at http://\${hostname}:\${port}\`);
      fs.writeFileSync('./gui_server.pid', process.pid.toString());
    });

    process.on('SIGTERM', () => {
      console.log('Received SIGTERM. Closing GUI Server...');
      server.close(() => {
        console.log('GUI Server closed.');
        fs.unlinkSync('./gui_server.pid');
        console.log('gui_server.pid has been deleted.');
      });
    });
  `;

  return script.trim();
};



const writeGuiServerScript = async (scriptContent) => {
  try {
    await fs.promises.writeFile('./startGuiServer.js', scriptContent);
    verbose('startGuiServer.js file has been created successfully.');
  } catch (err) {
    error(`Failed to write startGuiServer.js: ${err}`);
  }
};

const startGuiServer = () => {
  debug(`Running chmod 775 over ./startGuiServer.js ... `);
  fs.chmod("./startGuiServer.js", 0o775, (err) => {
    if (err) {
      error(`CRITICAL: Error running chmod 775 over ./startGuiServer.js: ${err}`);
      exit();
    }
    debug(`./startGuiServer.js is now executable`);
  });

  verbose(`Starting GUI Server ...`);
  const process = spawn("./startGuiServer.js", [], {
    detached: true,
    stdio: "ignore"
  });

  debug(`Detaching GUI Server process from node process ...`);
  process.unref();

  process.on('error', (err) => {
    error(`Error Starting GUI Server: ${err}`);
  });

  process.on("close", (code) => {
    verbose(`Closing GUI Server ...`);
    debug(`GUI Server process closing with code: ${code}`);
  });
};

const stopGuiServer = () => {
  debug(`Extracting GUI server process id from ./gui_server.pid ... `);
  if (fs.existsSync("./gui_server.pid")) {
    const pid = +fs.readFileSync("./gui_server.pid").toString();
    debug(`Extracted pid: ${pid}`);

    try {
      verbose(`Stopping GUI Server`);
      debug(`Sending SIGTERM signal to GUI server process id ${pid}`);
      process.kill(pid, 'SIGTERM');
      console.log("GUI Server successfully stopped.");
      debug(`Deleting ./gui_server.pid file ...`);
      fs.unlinkSync("./gui_server.pid");
      debug(`./gui_server.pid has been deleted`);
      debug("Deleting ./startGuiServer.js ...");
      fs.unlinkSync("./startGuiServer.js");
      debug("./startGuiServer.js has been deleted");
    } catch (err) {
      error(`Unable to terminate GUI server process with PID ${pid}: ${err}`);
    }
  } else {
    error(`./gui_server.pid can't be found`);
  }
};




const generateHiddenServerScript = (config) => {
  const script = `#!/usr/bin/env node
    import fs from "fs";
    import express from "express";

    const app = express();
    const port = ${config?.hidden_service_port || 9001};
    const address = "${config?.hidden_service_address || "127.0.0.1"}";

    app.use(express.json());

    app.get("/", (req, res) => {
      res.send("DarkMessenger API");
    });

    /* Req Example:
     * curl --socks5-hostname 127.0.0.1:9050 http://4akbfdpst32zjwel776hf4ljggdirzopovkgzss74x2h4nxbwsfj7xid.onion:9001/addme -d '{ "alias": "sm", "address": "sm.onion" }' -H "Content-Type: application/json"
    */

    if (${config?.allow_addme} === true) {
      app.post('/addme', async (req, res) => {
        const { alias, address } = req.body;

        if (! /^[a-zA-Z0-9\-_.@]{1,99}$/.test(alias)) {
          console.error(\`Username is not valid\`);
          return res.status(422).send("Username/Alias is not valid");
        }                                                                                
        if (! /^(?:[a-z2-7]{16}|[a-z2-7]{56})\.onion$/.test(address)) {
          console.error(\`Onion address is not valid, preveting useless request ...\`);
          return res.status(400).send("Onion address dosn't seem valid. Expected a real domain.onion address");
        }



        let addressBook = [];
        try {
          const data = await fs.promises.readFile('./address_book/list.txt', 'utf8');
          addressBook = data.split('\\n').map(line => line.trim()).filter(line => line !== '');
        } catch (err) {
          console.error('Error reading file:', err);
          return res.status(500).send('Internal Error reading address book');
        }

        /* Avoid alias Spoofing */
        for (let i in addressBook) {
          const auxAlias = addressBook[i].split(" ")[0];
          if (auxAlias == alias) {
            return res.status(409).send(\`Alias "\${alias}" already exists\`);
          }
        }

        addressBook.push(\`\${alias} \${address}\`);
        const uniqueEntries = new Set(addressBook);
         
        const updatedText = Array.from(uniqueEntries).join('\\n');

        try {
          await fs.promises.writeFile('./address_book/list.txt', updatedText);
          res.status(200).send("Remote server added you to it's address book");
        } catch (err) {
          return res.status(500).send('Internal Server Error writting address book');
        }

      });
    } else {
      app.post("/addme", async (req, res) => {
        res.status(403).send("Remote server dosn't allow anyone to update it's contacts remotelly (config.allow_addme is not set true in ./config/dark-messenger.json). You have to ask the owner to add you manually. You can send this message to the owner");
      });
    }

    app.post('/send', async (req, res) => {
      try {
        const { from, message } = req.body;
        const decodedMessage = Buffer.from(message, 'base64').toString('utf-8');
        const msg = {}; 
        msg.from = from;
        msg.message = decodedMessage;

        const existingMessages = JSON.parse(await fs.promises.readFile('./messages/list.json', 'utf8')); 

        existingMessages.push(msg);

        // Add an id to handle the messages (read, delete, answer)
        for (let i = 0; i < existingMessages.length; ++i) {
          existingMessages[i].id = i;
        }

        await fs.promises.writeFile('./messages/list.json', JSON.stringify(existingMessages, null, 2));
        res.status(200).send('Message saved');
      } catch(err) {
        res.status(500).send('Internal Server Error read/write operation at ./messages/list.json');
      }
    });


    const server = app.listen(port, address, () => {
      console.log(\`Hidden Server listening at http://\${address}:\${port}\`);
      fs.writeFileSync('./hidden_server.pid', process.pid.toString());
    });

    process.on('SIGTERM', () => {
      console.log('Received SIGTERM. Closing GUI Server...');
      server.close(() => {
        console.log('GUI Server closed.');
        fs.unlinkSync('./hidden_server.pid');
        console.log('hidden_server.pid has been deleted.');
      });
    });
  `;

  return script.trim();
};

const writeHiddenServerScript = async (scriptContent) => {
  try {
    await fs.promises.writeFile('./startHiddenServer.js', scriptContent);
    verbose('startHiddenServer.js file has been created successfully.');
  } catch (err) {
    error(`Failed to write startHiddenServer.js: ${err}`);
  }
};

const startHiddenServer = () => {
  debug(`Running chmod 775 over ./startHiddenServer.js ... `);
  fs.chmod("./startHiddenServer.js", 0o775, (err) => {
    if (err) {
      error(`CRITICAL: Error running chmod 775 over ./startHiddenServer.js: ${err}`);
      exit();
    }
    debug(`./startHiddenServer.js is now executable`);
  });

  verbose(`Starting Hidden Server ...`);
  const process = spawn("./startHiddenServer.js", [], {
    detached: true,
    stdio: "ignore"
  });

  debug(`Detaching Hidden Server process from node process ...`);
  process.unref();

  process.on('error', (err) => {
    error(`Error Starting Hidden Server: ${err}`);
  });

  process.on("close", (code) => {
    verbose(`Closing Hidden Server ...`);
    debug(`Hidden Server process closing with code: ${code}`);
  });
};

const stopHiddenServer = () => {
  debug(`Extracting Hidden server process id from ./hidden_server.pid ... `);
  if (fs.existsSync("./hidden_server.pid")) {
    const pid = +fs.readFileSync("./hidden_server.pid").toString();
    debug(`Extracted pid: ${pid}`);

    try {
      verbose(`Stopping Hidden Server`);
      debug(`Sending SIGTERM signal to Hidden server process id ${pid}`);
      process.kill(pid, 'SIGTERM');
      console.log("Hidden Server successfully stopped.");
      debug(`Deleting ./hidden_server.pid file ...`);
      fs.unlinkSync("./hidden_server.pid");
      debug(`./hidden_server.pid has been deleted`);
      debug("Deleting ./startHiddenServer.js ...");
      fs.unlinkSync("./startHiddenServer.js");
      debug("./startHiddenServer.js has been deleted");
    } catch (err) {
      error(`Unable to terminate Hidden server process with PID ${pid}: ${err}`);
    }
  } else {
    error(`./hidden_server.pid can't be found`);
  }
};


const generateMessageAlertServiceScript = (config) => {
   const script = `#!/usr/bin/env node
    import fs from "fs";
    import chalk from "chalk";

    // TODO: Add try catch blocks
   
    const checkNewMessages = async () => {
      const existingMessages = JSON.parse(await fs.promises.readFile('./messages/list.json', 'utf8')); 
      const readMessages = JSON.parse(await fs.promises.readFile('./messages/read_messages.json', 'utf-8'));
    
      const unreadMessages = existingMessages.filter(message => !readMessages.includes(message.id));

      if (unreadMessages.length > 0) {
        console.log('\\n\\n' + chalk.bold.blue('[DARKMESSENGER NOTIFICATION]') + ' Found ' + chalk.bold.yellow(unreadMessages.length) + ' new messages. \\n\\nRun ' + chalk.bold.yellow('./DarkMessenger show') + ' to mark them as read. \\n\\nIf you want to disable notifications for new messages set ' + chalk.italic.white('"alert_on_new_messages": false,') + ' at ./config/dark-messenger.json\\n\\n' );
      }
    };

    setInterval(checkNewMessages, ${config?.check_new_messages_seconds * 1000 || 15000} );

    fs.writeFileSync('./message_alert_server.pid', process.pid.toString());
  `;

  return script.trim(); 
}

const writeMessageAlertServerScript = async (scriptContent) => {
  try {
    await fs.promises.writeFile('./startMessageAlertServer.js', scriptContent);
    verbose('startMessageAlertServer.js file has been created successfully.');
  } catch (err) {
    error(`Failed to write startMessageAlertServer.js: ${err}`);
  }
}

const startMessageAlertServer = () => {
  debug(`Running chmod 775 over ./startMessageAlertServer.js ... `);
  fs.chmod("./startMessageAlertServer.js", 0o775, (err) => {
    if (err) {
      error(`CRITICAL: Error running chmod 775 over ./startMessageAlertServer.js: ${err}`);
      exit();
    }
    debug(`./startMessageAlertServer.js is now executable`);
  });

  verbose(`Starting MessageAlert Server ...`);
  const internalProcess = spawn("./startMessageAlertServer.js", [], {
    detached: true,
    stdio: ['ignore', process.stdout, process.stderr]
  });

  debug(`Detaching MessageAlert Server process from node process ...`);
  internalProcess.unref();

  internalProcess.on('error', (err) => {
    error(`Error Starting MessageAlert Server: ${err}`);
  });

  internalProcess.on("close", (code) => {
    verbose(`Closing MessageAlert Server ...`);
    debug(`MessageAlert Server process closing with code: ${code}`);
  });
}



const stopMessageAlertServer = () => {
  debug(`Extracting MessageAlert server process id from ./message_alert_server.pid ... `);
  if (fs.existsSync("./message_alert_server.pid")) {
    const pid = +fs.readFileSync("./message_alert_server.pid").toString();
    debug(`Extracted pid: ${pid}`);

    try {
      verbose(`Stopping MessageAlert Server`);
      debug(`Sending SIGTERM signal to MessageAlert server process id ${pid}`);
      process.kill(pid, 'SIGTERM');
      console.log("MessageAlert Server successfully stopped.");
      debug(`Deleting ./message_alert_server.pid file ...`);
      fs.unlinkSync("./message_alert_server.pid");
      debug(`./message_alert_server.pid has been deleted`);
      debug("Deleting ./startMessageAlertServer.js ...");
      fs.unlinkSync("./startMessageAlertServer.js");
      debug("./startMessageAlertServer.js has been deleted");
    } catch (err) {
      error(`Unable to terminate MessageAlert server process with PID ${pid}: ${err}`);
    }
  } else {
    error(`./message_alert_server.pid can't be found`);
  } 
}


const generateProxyServerScript = () => {
  const scriptContent = `#!/usr/bin/env node
    import fs from 'fs';
    import http from 'http';
    import httpProxy from 'http-proxy';
    import { SocksProxyAgent } from 'socks-proxy-agent';

    const { createProxyServer } = httpProxy;

    const socksAgent = new SocksProxyAgent('socks5h://127.0.0.1:9050');


    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const targetUrl = req.url.slice(1);
      const fullUrl = targetUrl.startsWith('http://') || targetUrl.startsWith('https://') ? targetUrl : \`http://\${targetUrl}\`;

      if (req.method === 'POST') {
        let requestBody = [];
        req.on('data', chunk => {
          requestBody.push(chunk);
        });
        req.on('end', () => {
          requestBody = Buffer.concat(requestBody).toString();
          const options = {
            agent: socksAgent,
            headers: req.headers,
            method: req.method,
            body: requestBody,
          };

          const proxyReq = http.request(fullUrl, options, proxyRes => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
          });

          proxyReq.on('error', error => {
            console.error('Error en la petición a Tor:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error en la petición a Tor');
          });

          proxyReq.write(requestBody);
          proxyReq.end();
        });
      } else {
        const options = {
          agent: socksAgent,
          headers: req.headers,
          method: req.method,
        };

        const proxyReq = http.request(fullUrl, options, proxyRes => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        });

        proxyReq.on('error', error => {
          console.error('Error en la petición a Tor:', error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error en la petición a Tor');
        });

        proxyReq.end();
      }
    });


    const port = ${config?.http_tor_proxy_port || 9002};
    server.listen(port, () => {
      console.log(\`Proxy Server listening at http://127.0.0.1:\${port}\`);
      fs.writeFileSync('./proxy_server.pid', process.pid.toString());
    });


    process.on('SIGTERM', () => {
      console.log('Received SIGTERM. Closing Proxy Server...');
      server.close(() => {
        console.log('Proxy Server closed.');
        fs.unlinkSync('./proxy_server.pid');
        console.log('proxy_server.pid has been deleted.');
      });
    });

`;

  return scriptContent.trim();
};

const writeProxyServerScript = async (scriptContent) => {
  try {
    await fs.promises.writeFile('./startProxyServer.js', scriptContent);
    verbose('startProxyServer.js file has been created successfully.');
  } catch (err) {
    error(`Failed to write startProxyServer.js: ${err}`);
  }

};


const startProxyServer = () => {
  debug(`Running chmod 775 over ./startProxyServer.js ... `);
  fs.chmod("./startProxyServer.js", 0o775, (err) => {
    if (err) {
      error(`CRITICAL: Error running chmod 775 over ./startProxyServer.js: ${err}`);
      exit();
    }
    debug(`./startProxyServer.js is now executable`);
  });

  verbose(`Starting Proxy Server ...`);
  const process = spawn("./startProxyServer.js", [], {
    detached: true,
    stdio: "ignore"
  });

  debug(`Detaching Proxy Server process from node process ...`);
  process.unref();

  process.on('error', (err) => {
    error(`Error Starting Proxy Server: ${err}`);
  });

  process.on("close", (code) => {
    verbose(`Closing Proxy Server ...`);
    debug(`Proxy Server process closing with code: ${code}`);
  });

};

const stopProxyServer = () => {
  debug(`Extracting Proxy server process id from ./proxy_server.pid ... `);
  if (fs.existsSync("./proxy_server.pid")) {
    const pid = +fs.readFileSync("./proxy_server.pid").toString();
    debug(`Extracted pid: ${pid}`);

    try {
      verbose(`Stopping Proxy Server`);
      debug(`Sending SIGTERM signal to Proxy server process id ${pid}`);
      process.kill(pid, 'SIGTERM');
      console.log("Proxy Server successfully stopped.");
      debug(`Deleting ./proxy_server.pid file ...`);
      fs.unlinkSync("./proxy_server.pid");
      debug(`./proxy_server.pid has been deleted`);
      debug("Deleting ./startProxyServer.js ...");
      fs.unlinkSync("./startProxyServer.js");
      debug("./startProxyServer.js has been deleted");
    } catch (err) {
      error(`Unable to terminate Proxy server process with PID ${pid}: ${err}`);
    }
  } else {
    error(`./proxy_server.pid can't be found`);
  }
};


