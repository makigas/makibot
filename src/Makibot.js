import Commando from 'discord.js-commando';

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
        this.registry
            .registerDefaultTypes()
            .registerGroups([
                ['admin', 'Administración'],
                ['fun', 'Entretenimiento'],
                ['utiles', 'Utilidad']
            ])
            .registerCommandsIn(require('path').join(__dirname, 'commands'));

        if (this._validateSettings()) {
            this.on('ready', this._onConnected);
            this.login(config.token);
        } else {
            console.error('ERROR! Invalid settings. Please, verify your config.json');
        }
    }

    _onConnected() {
        console.log(`Successfully logged in as ${this.user.tag}!`);
    }

    /**
   * Check whether settings are valid and the client can connect.
   * @return {boolean} true unless settings are not valid.
   */
    _validateSettings() {
        let token = this._config.token;
        return token != null && typeof(token) == 'string' && token != '';
    }

    shutdown() {
        console.log('The bot was asked to shutdown. Good night!');
        this.destroy();
    }
}
