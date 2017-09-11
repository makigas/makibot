# makigas-discord-bot

Here's the Discord bot. It's not mature enough.

## Requirements

* Node.js >= 6.0
* Yarn

## Setting up

Register a Discord bot if you haven't. Create a Discord app, then bundle a bot.
[Here is a neat guide covering the process][1]. The guide also covers how to make
the bot join the server, which is important if the bot is not public because
it will need to be manually invited to the server.

To log in the bot you need the **App Bot User Token**. This is not the same as
the App Secret, the Bot User Token is longer.

To configure the bot, copy `config/config.example.json` to `config/config.json`.
The configuration file is local and contains sensible token keys, so you must
not commit the file into your Git. Set `bot_token` to the app bot user token.

## Contributing

Have an idea? Found a bug? This is an open source project. See CONTRIBUTING.md
for details, but here is the excerpt:

* Send as many issues/PRs as you need, but please, only one topic per issue/PR.
* Don't send a non-trivial PR without creating a tracking issue in the issue
  tracker first.
* Don't work on top of master branch.

By submitting an issue or a PR – I'd dare to say that by pressing the Fork
button as well –, you declare that you have read and agree with the contents
of this document.

[1]: https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token
