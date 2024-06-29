# PROTOCOL 

Protocol is not http (but is browser compatible). It uses a custom protocol.

### Methods
##### ACK_ME [name] [origin-address] GOODBYE
Send your name to another online user.  
Your name is an alias you want people save you as in their contact list  
  
If the other user is online he will automatically respond with ACK_YOU to confirm he added you to his contacts and asking for your address

##### ACK_YOU [name] [origin-address] GOODBYE
Send your name and address to an ACK_ME requesting user so he can add you back.

##### USE_ENCRYPTION [cryto-used] [your_pub_key]
You send your pubkey, then the other user will send his.  
All messages send after setting encryption to the user are going to be send encrypted. 

##### USE_SYMMETRIC [crypto-used] [your_priv_key]
You send your new symmetric privkey encrypted with the other user pubkey  
Now you drop assymetric encryption and symmetric will be used instead for all comunications

##### USE_BOTH [crypto-used]
You use both, assymetric and symmetric. 

##### SEND_MESSAGE [type] [message]
Send a message to your destination.  
- Available types:  
  - text
  - audio
  - video
  - image
  - file

##### STATUS
Ask the user if he is online

##### TEST [message]
Send a random message and wait for a similar response.  

### Specifics
##### GOODBYE
Indicates the end of the request

##### URL
URL is always the .onion domain and the port number. 
