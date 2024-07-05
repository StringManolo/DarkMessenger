# TODO

### Tasks

- (Maybe a clean is needed if processes are not running but .pid files exist cuz user forced a close without using ./DarkMessenger stop)
- Implement the request back on add to request the other server to add you back
- Check that there is not same alias multiple times in address book (rename the following ocurrencies?)
- Add publickey sharing / encryption
- Manage v and d vars in functions based on config / args (maybe make a pure check funcion to set them by loading config file + args). 
- Update the readme
- Standalone cli command install.sh
- Create documentation
- Comment the code
- Lint the code
- Add more verbose and debug
- Add more args for the config files
- Add to config an option to run ./DarkMessenger start when system boots
- Add to config an option to run ./DarkMessenger stop when system shutdowns (maybe with bash trap?)
- Add options cli to change directly the dark_messenger.config file from the cli
- Check if service files can be deleted once spawned, if not just hidde them using a dot before the filename
- Develop all the cli interfaces into browser
- Develop the browser GUI
- Ask user for username the first time running the program and add it to the config/dark_messenger.json
- Fix curl port usage to use config port number (--socks5)
- Add checks if cli args (for example add alias address) make sure they are valid with regexp
- Show help when not known command
- Allow profile picture, description, etc
- Add messages on each contact load (maybe need to implement api on hidden server instead of hardcoding using the code generator)
- Add the onion url on the send api when moving to a contact group 
- Save send messages (just to be shown in the GUI contacts message list)
- Add log output for all services into ./logs
- Add version and an update command that shows changes made from versions (prob with a local file CHANGUES and a cat with a filter per version)
- Make hidden_service optional in config
- Add pass auth to hidden_services to make the onion address only reachable for users that known the password (maybe port knowcking to alert of an auth req?)
- Add chat groups


### Contribute
If you want to help out, fork the repo, complete any of this taks, push the changes to your repo, make a pull request.  


#### End Goals
- APK
- Web App
- ClI
- Official Web App online
