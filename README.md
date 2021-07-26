<p align="center">
<img src="https://i.imgur.com/4Mc9y87.png" alt="clank">
</p>

**Clank (formerly known as Makibot)** is the Discord bot for the [makigas Discord server](https://www.makigas.es/discord). It is not stable enough and it probably doesn't contain the most useful commands right now, but it works.

## Requirements

- We target Node 14.
- A Discord application that can behave as a bot.
- A Discord server.

## Setting up

### Create a bot

Register a Discord bot if you haven't. Create a Discord app, then bundle a bot. [Here is a neat guide covering the process][1]. The guide also covers how to make the bot join the server, which is important if the bot is not public because it will need to be manually invited to the server.

### Set up the configuration file

**Clank won't run unless you do this**. Copy `.env.example` to `.env`. This environment file contain several secret keys required to properly run the bot. Do not expose this file and keep it **secret**, specially your login token since it could allow anyone to impersonate as your bot.

- **BOT_TOKEN**: that's the bot token. Log in to Discord via browser, visit the [My Apps](https://discordapp.com/developers/applications/me) page, and click on your bot. Under the section _App Bot User_, your token will be revealed after you press 'Click to reveal'.

- **BOT_OWNER**: that's your user ID. Clank will recognize the user having this ID as the administrator, as some commands will only be available to the bot owner. How to get your user ID:

  - Go to Settings > Appearance Settings and turn on Developer Mode (scroll down). Then, find a message sent by you in any conversation, right click your name and click Copy ID.

  - Type `\@[your username]` into a Discord chat and press Enter. This will send a message with your user ID, and you will be able to see it on the history. Type your username as you'd type it to mention yourself, so if your username is `danirod#2667`, send a message with the contents `\@danirod`. Even if you changed your alias, type your username.

### Install and run

- `npm install`
- `npm start`

## Contributing

Have an idea? Found a bug? This is an open source project, so you are free to contribute or provide knowledge if you want. See CONTRIBUTING.md for details, but here is the excerpt:

- Send as many issues/PRs as you need, but please, only one topic per issue/PR.
- Don't send a non-trivial PR without creating a tracking issue in the issue tracker first.
- Don't work on top of trunk branch.

By submitting an issue or a PR – I'd dare to say that by pressing the Fork button as well –, you declare that you have read and agree with the contents of this document.

[1]: https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token
