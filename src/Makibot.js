import Commando from 'discord.js-commando';
import sqlite from 'sqlite';
import path from 'path';

export default class Makibot extends Commando.CommandoClient {

    /**
   * @param {Object} config
   */
    constructor(config) {
        super({
            commandPrefix: '!',
            owner: config.owner,
            disableEveryone: true,
            unknownCommandResponse: false
        });

        this._config = config;

        this.registry.registerDefaultTypes();
        this.registry.registerGroups([
            ['admin', 'Administración'],
            ['fun', 'Entretenimiento'],
            ['utiles', 'Utilidad']
        ]);
        this.registry.registerCommandsIn(path.join(__dirname, 'commands'));

        if (typeof(this._config.token) != 'string') {
            throw new TypeError('Login token is not a valid string.');
        }

        this.on('ready', () => {
            console.log(`Logged in successfully as ${this.user.tag}.`);

            // Load persistent settings.
            sqlite.open('settings.db')
                .then(db => this.setProvider(new Commando.SQLiteProvider(db)))
                .then(() => this.reloadPresence())
                .catch(console.log);
        });

        this.login(this._config.token);
    }

    reloadPresence() {
        // Restore activity and online presence.
        this.user.setPresence({
            status: this.settings.get('BotStatus', 'online'),
            game: { name: this.settings.get('BotActivity', null) }
        });
    }

    shutdown() {
        console.log('The bot was asked to shutdown. Good night!');
        this.destroy();
    }
}
