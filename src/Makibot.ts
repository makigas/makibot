import * as Commando from 'discord.js-commando';
import * as sqlite from 'sqlite';
import * as path from 'path';
import * as fs from 'fs';
import ConfigSchema from './ConfigSchema';
import { Message } from 'discord.js';
import PinService from './hooks/pin';
import { config as XDG_CONFIG } from 'xdg-basedir';
import * as mkdirp from 'mkdirp';
import RosterService from './hooks/roster';
import VerifyService from './hooks/verify';

export default class Makibot extends Commando.CommandoClient {

    public constructor() {
        super({
            commandPrefix: '!',
            owner: ConfigSchema.owner,
            disableEveryone: true,
            unknownCommandResponse: false
        });

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

        this.on('ready', () => console.log(`Logged in successfully as ${this.user.tag}.`));

        this.once('ready', () => {
            this.settingsFile()
                .then(file => sqlite.open(file))
                .then(db => this.setProvider(new Commando.SQLiteProvider(db)))
                .then(() => {
                    // Reload presence using database values.
                    this.user.setPresence({
                        status: this.settings.get('BotPresence', 'online'),
                        game: { name: this.settings.get('BotActivity', null) }
                    });

                    // Register hooks.
                    var pin = new PinService(this);
                    var roster = new RosterService(this);

                    if (process.env.VERIFY_CHANNEL && process.env.NEWBIE_ROLE) {
                        var verify = new VerifyService(this);
                    }
                })
                .catch(console.log);
        });

        this.login(ConfigSchema.token);
    }

    private settingsFile(): Promise<string> {
        // This is what we want to return.
        let configFile = path.join(XDG_CONFIG, 'clank', 'settings.db');

        // But, hold on! Because it may be that the parent directory does not exist.
        let configDir = path.dirname(configFile);
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(configDir)) {
                // I told you! Let's fix this.
                mkdirp(configDir, err => {
                    if (err) reject(err);
                    else resolve(configFile);
                });
            } else {
                // Ok, just let it go.
                resolve(configFile);
            }
        });
    }

    shutdown() {
        console.log('The bot was asked to shutdown. Good night!');
        this.destroy();
    }
}
