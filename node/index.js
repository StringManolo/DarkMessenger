#!/usr/bin/env node

import fs from "fs";
import { spawn } from "child_process";
import parseCLI from "simpleargumentsparser";
import chalk from "chalk";
//import express from "express";

// globals
let v = false; // verbose
let d = false; // debug
let config;     // config

(async () => {
  const cli = await parseCLI();

  if (cli.noArgs || cli.s.h || cli.c.help)
    exit(`usage:\n\nstart     wakeup all services\nstop      shutdown all services\n\n-c --config <filename>\n-v --verbose\n-d --debug\n`);

  if (cli.s.v || cli.c.verbose) v = true;

  if (cli.c.start || cli.o[0].includes("start")) {
    await start(cli);
  } else if (cli.c.stop || cli.o[0].includes("stop")) {
    await stop(cli);
  }
})();

const exit = msg => {
  console.log(msg);
  process.exit(0);
};

const verbose = msg => {
  if (v || config?.verbose) {
    console.log(`${chalk.green("[VERBOSE]")} ${msg}`);
  }
};

const debug = msg => {
  if (d || config?.debug) {
    console.log(`${chalk.blue("[DEBUG]")} ${msg}`);
  }
};

const error = msg => {
  console.log(`${chalk.red("[ERROR]")} ${msg}`);
};

const startTor = () => {
  debug(`Creating file to store tor pid process ... `);
  verbose(`Starting Tor ...`);
  const process = spawn("/usr/bin/tor", ["-f", "./config/torrc.conf"], {
    detached: true,
    stdio: "ignore"
  });

  debug(`Storing tor pid at ./tor_files/tor.pid ...`);
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

  if (config) {
    if (config?.use_web_gui) {
      const guiServerScript = generateGuiServerScript(config);
      await writeGuiServerScript(guiServerScript);
      startGuiServer();
    } else {
      debug(`Not using Web GUI, to activate it add next options to your ./config/dark-messenger.json file:\n"use_web_gui": "true",\n"web_gui_address": "127.0.0.1",\n"web_gui_port": "9000",`);
    }
  } else {
    debug(`Config not found. This is can't never happen btw`);
  }

  startTor();
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
  stopGuiServer();
  stopTor();
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
    import chalk from "chalk";
    import express from "express";

    const app = express();
    const port = ${config.web_gui_port || 9000};
    const hostname = "${config.web_gui_address || "127.0.0.1"}";

    app.get('/', (req, res) => {
      res.send('¡Hello World!');
    });

    const server = app.listen(port, hostname, () => {
      console.log('GUI Server listening at http://\${hostname}:\${port}');
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
    debug("Creating ./startGuiServer.js ...");
    await fs.promises.writeFile('./startGuiServer.js', scriptContent);
    verbose('startGuiServer.js file has been created successfully.');
  } catch (err) {
    error(`Failed to write startGuiServer.js: ${err}`);
  }
};

const startGuiServer = () => {
  verbose("Starting GUI server ...");
  
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

