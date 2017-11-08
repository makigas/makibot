import * as Commando from 'discord.js-commando';
import * as sqlite from 'sqlite';
import * as path from 'path';
import ConfigSchema from './ConfigSchema';
import { Message } from 'discord.js';
import PinService from './hooks/pin';

export default class Makibot extends Commando.CommandoClient {

    private config: ConfigSchema;

    public constructor(config: ConfigSchema) {
        super({
            commandPrefix: '!',
            owner: config.owner,
            disableEveryone: true,
            unknownCommandResponse: false
        });

        this.config = config;
        this.registry.registerDefaultTypes();
        this.registry.registerGroups([
            ['admin', 'Administración'],
            ['fun', 'Entretenimiento'],
            ['utiles', 'Utilidad']
        ]);
        this.registry.registerCommandsIn({
            dirname: path.join(__dirname, 'commands'),
            filter: /^([^\.].*)\.ts$/
        });

        this.on('ready', () => {
            console.log(`Logged in successfully as ${this.user.tag}.`);

            // Load persistent settings.
            sqlite.open('settings.db')
                .then(db => this.setProvider(new Commando.SQLiteProvider(db)))
                .then(() => this.onDatabaseReady())
                .catch(console.log);
        });

        this.login(this.config.token);
    }

    private onDatabaseReady() {
        this.reloadPresence();

        // Register hooks.
        var pin = new PinService(this);
    }

    reloadPresence() {
        // Restore activity and online presence.
        this.user.setPresence({
            status: this.settings.get('BotPresence', 'online'),
            game: { name: this.settings.get('BotActivity', null) }
        });
    }

    shutdown() {
        console.log('The bot was asked to shutdown. Good night!');
        this.destroy();
    }
}
