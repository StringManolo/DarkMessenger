# FAQ

#### How do I communicate with my friend?

1. Start the DarkMessenger application by running `./DarkMessenger.js start`.
2. Share the yellow-highlighted .onion address with your friend.
3. Your friend should also start DarkMessenger with `./DarkMessenger.js start`.
4. Have your friend add you as a contact using `./DarkMessenger.js addme YOUR_ONION_ADDRESS.ONION`.
5. Optionally, your friend can add you to their contacts list with `./DarkMessenger.js add YOUR_NAME YOUR_ONIONADDRESS.ONION`.
6. Check your friend's username and address in your contact list using `./DarkMessenger.js contacts`.
7. Send a message to your friend using `./DarkMessenger.js send USERNAME_OF_YOUR_FRIEND 'Hello my friend :D'`.
8. Your friend will receive a notification in their terminal indicating they have a new message.
9. Your friend can read all messages by running `./DarkMessenger.js show`.

#### Do I need to open ports on my router?

No, DarkMessenger uses TOR to bypass the need for port forwarding. This allows the software to function without a central server or specific network configuration.

#### How secure is DarkMessenger?

DarkMessenger utilizes Tor's robust encryption and anonymity features to ensure secure communication. Messages are encrypted end-to-end using AES, RSA, and Diffie-Hellman protocols, making it difficult for third parties to intercept or decrypt communications.

#### Can I use DarkMessenger on platforms other than Linux?

Currently, DarkMessenger is primarily designed for Linux systems. This includes Termux (an Android app) with proot-distro.

#### How can I verify the authenticity of .onion addresses?

To ensure you are communicating with the intended recipient, verify .onion addresses through trusted channels or exchange them securely with known contacts. Avoid sharing .onion addresses over unsecured channels to prevent interception.

#### How can I contribute to DarkMessenger?

Contributions to DarkMessenger are welcome! You can contribute by reporting bugs, suggesting features, or submitting pull requests on GitHub. Check out the TODO.md for a list of tasks.

#### Is DarkMessenger legal to use?

DarkMessenger is a tool that prioritizes user privacy and security. As with any software, ensure you comply with local laws and regulations when using DarkMessenger. It is intended for legitimate use cases and respects user privacy by design.

#### Where can I find more information or support?

For additional information, updates, or support, you can find my contact information [here](https://stringmanolo.github.io/portfolio/)

