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
- Add options cli to change directly the dark_messenger.config file from the cli
- Check if service files can be deleted once spawned, if not just hidde them using a dot before the filename
- Develop all the cli interfaces into browser
- Develop the browser GUI
- Check read messages (possible bug reusing ids of already read messages so new messanges are not notified. Probably fixable just by removing the id from read_messages.json when removing messages using the delete messages from cli function)
- Ask user for username the first time running the program and add it to the config/dark_messenger.json
- Make sure start files are not included (.gitignore)
- Add a cli command to show your address .onion
- Fix curl port usage to use config port number (--socks5)
- Add checks if cli args (for example add alias address) make sure they are valid with regexp
- Show help when not known command

### Contribute
If you want to help out, fork the repo, complete any of this taks, push the changes to your repo, make a pull request.  


#### End Goals
- APK
- Web App
- ClI
- Official Web App online
