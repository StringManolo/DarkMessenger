#!/usr/bin/env node

import fs from "fs";
// import path from 'path';
import { spawn } from "child_process";
import parseCLI from "simpleargumentsparser";
import chalk from "chalk";


//globals
let v = false; //verbose
let d = false; //debug
let config;    //config
(async() => {
  const cli = await parseCLI();

  if (cli.noArgs || cli.s.h || cli.c.help)
    exit(`usage:

start     wakeup all services
stop      shutdown all services

-c --config <filename>
-v --verbose
-d --debug
`   );
  
  if (cli.s.v || cli.c.verbose) v = true;


  if (cli.c.start || cli.o[0].includes("start")) {
    await start(cli);
  } else if (cli.c.stop  || cli.o[0].includes("stop")) {
    await stop(cli);
  }

})();

const exit = msg => {
  console.log(msg);
  process.exit(0);
}

const verbose = msg => {
  if (v || config?.verbose) {
    console.log(`${chalk.green("[VERBOSE]")} ${msg}`);
  } 
}

const debug = msg => {
  if (d || config?.debug) {
    console.log(`${chalk.blue("[DEBUG]")} ${msg}`);
  }
}

const error = msg => {
  console.log(`${chalk.red("[ERROR]")} ${msg}`);
}

const startTor = () => {
  debug(`Creating file to store tor pid process ... `);

  verbose(`Starting Tor ...`);
  const process = spawn("/usr/bin/tor",  ["-f", "./config/torrc.conf"], {
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
}

const stopTor = () => {
  debug(`Extracting tor process id from ./tor_files/tor.pid ... `);
  if (fs.existsSync("./tor_files/tor.pid")) {

    const pid = parseInt(fs.readFileSync("./tor_files/tor.pid").toString(), 10);
    debug(`Extracted pid: ${pid}`);

    try {
      verbose(`Stopping Tor`);
      debug(`Sending SIGTERM signal tor process id ${pid}`);
      process.kill(pid, 'SIGTERM');
      console.log("Tor sucessfully stopped.");
      debug(`Deleting ./tor_files/tor.pid file ...`);
      fs.unlinkSync("./tor_files/tor.pid");
      debug(`./tor_files/tor.pid has been deleted`);
    } catch (err) {
      error(`Unable to terminate tor process with PID ${pid}: ${err}`);
    }
  } else {
    error(`./tor_files/tor.pid can't be found`);
  }
}

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

  debug(`Calling startTor() ... `);
  startTor();
  debug(`startTor() call done.`);
}

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
  debug(`Calling stopTor() ... `);
  stopTor();
  debug(`stopTor() call done.`);
}

const loadFile = async (path) => {
  try {
    const data = await fs.promises.readFile(path, "utf8");
    return data;
  } catch (err) {
    error(`Unable to read ${path}: ${err}`)
    throw err;
  }
}

const loadConfig = async (path) => {
  try {
    const file = await loadFile(path);
    return JSON.parse(file);
  } catch (err) {
    error(`Unable to load config ${path} as JSON: ${err}`)
  }
}

/*
 {
  "username": "StringManolo",
  "use_web_gui": "true",
  "web_gui_address": "127.0.0.1",
  "web_gui_port": "9000",
  "hidden_service_hostname": "127.0.0.1",
  "hidden_service_port": "9001"
}
*/
