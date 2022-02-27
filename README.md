[![Discord](https://img.shields.io/discord/329487017916366850)](https://discord.com/invite/Mq7TBAB)
[![GitHub release](https://img.shields.io/github/v/release/makigas/clank)](https://github.com/makigas/makibot/releases/latest)
[![CI](https://github.com/makigas/makibot/actions/workflows/ci.yml/badge.svg)](https://github.com/makigas/makibot/actions/workflows/ci.yml)
[![CD](https://github.com/makigas/makibot/actions/workflows/cd.yml/badge.svg)](https://github.com/makigas/makibot/actions/workflows/cd.yml)

# makibot

**makibot** is the Discord bot for the [makigas Discord server](https://www.makigas.es/discord). It is not stable enough and it probably doesn't contain the most useful commands right now, but it works.

## Requirements

- Node.js >= 16.8.0.
- A Discord application behaving as a bot.
- A Discord server to put the bot in.

## Setting up

### Create a bot

Register a Discord bot if you haven't. [Create a Discord app if you haven't done it yet](https://discord.com/developers/applications), then create a Bot for your application using the Bot tab in the application page.

To make the bot join your server, you can use the OAuth2 URL Generator in the OAuth tab of your application page. Check the "bot" checkbox in the "Scopes" section and play with the permissions in the Bot Permissions box. You should automatically see an URL to make the application join a server where you have appropiate rights.

To use this bot you will need to activete the "Server Member Intent" in the "Privileged Gateway Intents" in the "Bot" section.

### Set up the environment

The bot is controlled via environment variables. You can manually provide them when starting the application, you can use the proper environment settings if running through Docker or Docker-Compose. If you are running locally using Node.js, you might create a file called .env containing the environment variables, using .env.example as an example to follow.

Understood variables:

- `BOT_TOKEN`: the authorization token to use with your bot. It is required in order to start the bot.
- `BOT_OWNER`: the user ID of the main server administrator. While most commands and hooks understand the idea of "server mods", it is still required for some administrative actions to be issued by the server admin.
- `INVITE_TOKEN`: if provided, will use this token to build the invite link when using the `/invite` command. Otherwise, it just links to http://discord.makigas.es.
- `HELPER_ROLE`: the name of the role to use as helper in the server. Otherwise, it fallbacks to "helper".
- `MODS_ROLE`: the name of the role to use for moderator members in the server. Otherwise, it fallbacks to "mods".
- `MUTE_ROLE`: the name of the role to use for muted users. Otherwise, it fallbacks to "mute".
- `WARN_ROLE`: the name of the role to use for warned users. Otherwise, it fallbacks to "warn".
- `LINKS_DISABLE_ROLE`: the name of the role to use for members that are not allowed to post links. Otherwise, it fallbacks to "links-disabled"

### Install and run

- `npm install`
- `npm start`

## Contributing

Have an idea? Found a bug? This is an open source project, so you are free to contribute or provide knowledge if you want. See CONTRIBUTING.md for details, but here is the excerpt:

- Send as many issues/PRs as you need, but please, only one topic per issue/PR.
- Don't send a non-trivial PR without creating a tracking issue in the issue tracker first.
- Don't work on top of trunk branch.

By submitting an issue or a PR – I'd dare to say that by pressing the Fork button as well –, you declare that you have read and agree with the contents of this document.
