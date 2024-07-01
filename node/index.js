#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import parseCLI from 'simpleargumentsparser';
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
    stop();
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
}

const stop = () => {
  console.log(`Stopping...`);
}

const loadFile = async (path) => {
  try {
    const data = await fs.readFile(path, "utf8");
    return data;
  } catch (err) {
    console.error(`Unable to read ${path}: ${err}`)
    throw err;
  }
}

const loadConfig = async (path) => {
  try {
    const file = await loadFile(path);
    return JSON.parse(file);
  } catch (err) {
    console.error(`Unable to load config ${path} as JSON: ${err}`)
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
