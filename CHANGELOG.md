# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.32.1](https://github.com/makigas/clank/compare/v0.32.0...v0.32.1) (2021-09-03)


### Bug Fixes

* **antispam:** disable accounts when they trip antispam twice ([b8a1214](https://github.com/makigas/clank/commit/b8a121427ecfd6ae17f1b59fe63e93475ffc4fa9))

## [0.32.0](https://github.com/makigas/clank/compare/v0.31.4...v0.32.0) (2021-09-03)


### Features

* **antiflood:** ban muted members that trigger antiflood ([2cb4529](https://github.com/makigas/clank/commit/2cb45291acb5ea6e192dddece56aed8b9d892d05))
* **antiflood:** delete original message on flood ([dddc9fd](https://github.com/makigas/clank/commit/dddc9fdef85ef940e3b7d56f94e80d76b3a0a6c4))


### Bug Fixes

* **csgo:** ban noodles again ([3179d00](https://github.com/makigas/clank/commit/3179d00d22101735d0f46c2ee6d7c6edfd7f1040))
* **csgo:** trigger antispam on messageUpdate ([7df946d](https://github.com/makigas/clank/commit/7df946d88842ad08efcff6e0d133c7e94ba1233a))
* **hooks:** interactions cause message events to fail ([887e580](https://github.com/makigas/clank/commit/887e5804e74ebeb738a0ebf5098de411f2f238dc))
* **warn:** do not double unwarn unwarned people ([080951d](https://github.com/makigas/clank/commit/080951d929f679283f63f5c8f726045502ce6c57))


### Refactor

* clean the hooks ([#438](https://github.com/makigas/clank/issues/438)) ([7465661](https://github.com/makigas/clank/commit/74656618a0abb35d8f21ea823e9dd41e08d0b15e))


### Chore

* **csgo:** treat everyone plus link as spam ([3cefc4c](https://github.com/makigas/clank/commit/3cefc4c923b7d9c0afe79c826480188465a7a4ae))

### [0.31.4](https://github.com/makigas/clank/compare/v0.31.3...v0.31.4) (2021-09-01)


### Bug Fixes

* **deps:** Dependabot YAML file is invalid ([b044347](https://github.com/makigas/clank/commit/b044347499551a23cd1605164caaa1b13196895d))


### Chore

* **deps:** update dependencies (september, 2021) ([1febf33](https://github.com/makigas/clank/commit/1febf331c9121dddf9281a5d66b7bea4076610f6))
* **deps:** update internal dependencies ([591eaaf](https://github.com/makigas/clank/commit/591eaafee73893c64f88bfb5b82620413164892f))

### [0.31.3](https://github.com/makigas/clank/compare/v0.31.2...v0.31.3) (2021-08-31)


### Bug Fixes

* **csgo:** discordapp.net is a safe domain ([6e59075](https://github.com/makigas/clank/commit/6e590758c0e380c0fc922c121adfb6a125974706))


### Chore

* **csgo:** add more domains to the system ([67c6edb](https://github.com/makigas/clank/commit/67c6edb62fd138d82e06b70fa3b75bfc01145f6a))

### [0.31.2](https://github.com/makigas/clank/compare/v0.31.1...v0.31.2) (2021-08-30)


### Bug Fixes

* **csgo:** fix typo in message sent after antispam triggers ([9c1e099](https://github.com/makigas/clank/commit/9c1e09960a9c49cace19bfe58ac8eecf5635f67d))
* prevent double warns ([66d86c0](https://github.com/makigas/clank/commit/66d86c0894a25b3eb6c705bc952707893ddd995f))


### Chore

* **build:** add chore in the changelog ([6cefe5d](https://github.com/makigas/clank/commit/6cefe5d656adf3a9a2b0d37a04d206f1b8b013b6))
* **csgo:** add more terms to the antispam list ([cebeac2](https://github.com/makigas/clank/commit/cebeac2f202a440b260ed4aa62207601ba551a65))

### [0.31.1](https://github.com/makigas/clank/compare/v0.31.0...v0.31.1) (2021-08-28)

## [0.31.0](https://github.com/makigas/clank/compare/v0.30.0...v0.31.0) (2021-08-21)


### Features

* **cmd:** add unwarn command ([9d50a16](https://github.com/makigas/clank/commit/9d50a16e147a69b6984da85f876f10d56a23d4e7))

## [0.30.0](https://github.com/makigas/clank/compare/v0.29.0...v0.30.0) (2021-08-21)


### Features

* add hook for hard antispam ([e663b04](https://github.com/makigas/clank/commit/e663b04152c802e73ce09642779ba4e73c7e04db))
* add moderation interactive menu ([27cebf2](https://github.com/makigas/clank/commit/27cebf202c052dae28e6a0121620e36abc484ca3))
* add support for context menus ([3566ba8](https://github.com/makigas/clank/commit/3566ba8accc6069ef0ee0b76717a35f3b3357591))
* allow warns to have a custom duration ([4132892](https://github.com/makigas/clank/commit/4132892b58e108db799fb8f1564630abfec80c18))
* **antiflood:** mute long time offenders ([37d85d4](https://github.com/makigas/clank/commit/37d85d4cfeb2e5d6c9eb7eb5b21d7ed9cc05eb83))
* **antispam:** add more links to be caught ([a5afde3](https://github.com/makigas/clank/commit/a5afde3f496ab5f78d144e9cf33ea9ea7e8b33dd))


### Bug Fixes

* handle deleted messages and users in hooks ([8ddcf83](https://github.com/makigas/clank/commit/8ddcf8397d41a7f67915cf3ef104bae0440457e9))

## [0.29.0](https://github.com/makigas/clank/compare/v0.28.0...v0.29.0) (2021-08-15)


### Refactor

* rewrite interactions using v9 API ([27173a8](https://github.com/makigas/clank/commit/27173a83aa60d698c2f34065f213afa5086c3ebc))

## [0.28.0](https://github.com/makigas/clank/compare/v0.27.4...v0.28.0) (2021-08-12)


### Bug Fixes

* fails to create settings on new bots ([b377222](https://github.com/makigas/clank/commit/b377222136a9299e98445c251672aaca1f349d36))
* provider fails to setup on new bots ([#405](https://github.com/makigas/clank/issues/405)) ([d649a95](https://github.com/makigas/clank/commit/d649a95e9e44451f8b9ab97ff34a2b924e211571))


### Refactor

* remove discord.js-commando ([#401](https://github.com/makigas/clank/issues/401)) ([7168168](https://github.com/makigas/clank/commit/716816873b901108abd3ab4080cb653dfb5acf2d))

### [0.27.4](https://github.com/makigas/clank/compare/v0.27.3...v0.27.4) (2021-08-05)


### Bug Fixes

* **karma:** only grant karma for regular messages ([dc3490f](https://github.com/makigas/clank/commit/dc3490fe2006fa15029e02db1146c7bbd9bcc0a7))

### [0.27.3](https://github.com/makigas/clank/compare/v0.27.2...v0.27.3) (2021-08-04)


### Features

* allow disabling verification ([1840116](https://github.com/makigas/clank/commit/184011658832663975b54486f2899843e992ab91))

### [0.27.2](https://github.com/makigas/clank/compare/v0.27.1...v0.27.2) (2021-08-01)


### Bug Fixes

* wrong variable used for the bounty command ([b0cf92b](https://github.com/makigas/clank/commit/b0cf92b092315189c1e3b4efec328117f1dce7dd))

### [0.27.1](https://github.com/makigas/clank/compare/v0.27.0...v0.27.1) (2021-07-31)


### Bug Fixes

* ephemeral condition is wrong ([0196e78](https://github.com/makigas/clank/commit/0196e78a671fb3d6544aa4cfce92866982e7ddd5))

## [0.27.0](https://github.com/makigas/clank/compare/v0.26.0...v0.27.0) (2021-07-31)


### Features

* add bounties ([#396](https://github.com/makigas/clank/issues/396)) ([7ce8c10](https://github.com/makigas/clank/commit/7ce8c1015f6a4508db4bffc86f30ad389530b8c1))
* detect message permalinks and embed them ([c36aa05](https://github.com/makigas/clank/commit/c36aa056d6b7fc3ffcb105dec2040c10ce456267)), closes [#383](https://github.com/makigas/clank/issues/383)

## [0.26.0](https://github.com/makigas/clank/compare/v0.25.0...v0.26.0) (2021-07-29)


### Features

* new response embeds for hooks and interactions ([#394](https://github.com/makigas/clank/issues/394)) ([828fd7f](https://github.com/makigas/clank/commit/828fd7f6941452d6b994a607601a4784d8c6be38))
* **verify:** display seconds until cooldown ([bfe4212](https://github.com/makigas/clank/commit/bfe421224128503383fb971e6ba1361477a8a27e))


### Bug Fixes

* welcome messages are not being presented ([179b996](https://github.com/makigas/clank/commit/179b996086622a520f88dc79d3a91ae758dc700f))

## [0.25.0](https://github.com/makigas/clank/compare/v0.24.1...v0.25.0) (2021-07-28)


### Features

* add a function to build message embeds ([c8eeadc](https://github.com/makigas/clank/commit/c8eeadcc762000f92806064306b36bd5f1dffeca))
* handle un-pinning in the pin hook ([f1aa1ea](https://github.com/makigas/clank/commit/f1aa1eafe7c958312fb7e0951e37edd909218ed5))


### Refactor

* use the new message quote in pins ([1982d3c](https://github.com/makigas/clank/commit/1982d3cd7502dc2477ff1930ced5fa93b8d599dd))

### [0.24.1](https://github.com/makigas/clank/compare/v0.24.0...v0.24.1) (2021-07-26)


### Bug Fixes

* catch errors during command interactions ([#379](https://github.com/makigas/clank/issues/379)) ([5cf03cc](https://github.com/makigas/clank/commit/5cf03cce8854cccbf9323a77e958852055e02bb9))


### Refactor

* **dev:** remove CodeQL ([#386](https://github.com/makigas/clank/issues/386)) ([1eb922e](https://github.com/makigas/clank/commit/1eb922e34fb60253c1f664ad3c2b7da06a38cd21))
* wrap command manipulations in a client ([#378](https://github.com/makigas/clank/issues/378)) ([52af2ba](https://github.com/makigas/clank/commit/52af2bae8caff4c5667bce9e00a489a487ff3777))

## [0.24.0](https://github.com/makigas/clank/compare/v0.23.0...v0.24.0) (2021-07-21)


### Features

* disclose the amount of points to level up ([#369](https://github.com/makigas/clank/issues/369)) ([4533e99](https://github.com/makigas/clank/commit/4533e99f95b9a52f2630b5f07a43a8d23fd67f8f))
* reply commands ([#360](https://github.com/makigas/clank/issues/360)) ([ce7f2fa](https://github.com/makigas/clank/commit/ce7f2facdcba7c070d5aa2d433263183f04daabf))

## [0.23.0](https://github.com/makigas/clank/compare/v0.22.0...v0.23.0) (2021-07-13)


### Features

* KarmaV2 ([#365](https://github.com/makigas/clank/issues/365)) ([c3e59fc](https://github.com/makigas/clank/commit/c3e59fc3b3f176dbf965704ee6fde7a9d0d27a5b))


### Refactor

* extract sendResponse into its own function ([#366](https://github.com/makigas/clank/issues/366)) ([6134bc2](https://github.com/makigas/clank/commit/6134bc2ced939bfb3e3b78d1b800b40db2ba0bba))
* remove trusted roles ([#352](https://github.com/makigas/clank/issues/352)) ([797f1e3](https://github.com/makigas/clank/commit/797f1e33c5a18980f842a17174feb113ea79af70))

## [0.22.0](https://github.com/makigas/clank/compare/v0.21.0...v0.22.0) (2021-06-26)


### Features

* create a factory to run interactions ([c101678](https://github.com/makigas/clank/commit/c101678b5d4a9245eeac0ec953950dbb6c9f09da))
* delete remaining commands ([e47f3bf](https://github.com/makigas/clank/commit/e47f3bf1f2dd03c869cad7e2ca9f8c505a1d66e2))
* include dsc.gg in the antispam system ([8d22a33](https://github.com/makigas/clank/commit/8d22a33aa3f71d48ebc1ed820246fc3d956121e0))
* migrate !primo to /primo ([2a9cb8c](https://github.com/makigas/clank/commit/2a9cb8c22f5224b3b39aff0416a82449afe97d6f))
* migrate raid command to slash command ([9ecfdbb](https://github.com/makigas/clank/commit/9ecfdbb6a335403836c8d9b4bf973590f22794b9))
* remove !helper command ([4d10559](https://github.com/makigas/clank/commit/4d105596a23748c81cb1cd79c7b1337c69f06b45))
* replace addautorole and removeautorole with REST endpoints ([9f5d9a4](https://github.com/makigas/clank/commit/9f5d9a4b0780bbcaafaff6b6853c90ef29fb0afc))
* replace voicerole commands with REST endpoints ([78f40e7](https://github.com/makigas/clank/commit/78f40e713fce6908e6a9719aa221d71e8fa94c3a))
* transition !warn command to interaction ([65ff19a](https://github.com/makigas/clank/commit/65ff19a60e519d8b931340975ea6c4f0f4ac3b20))


### Refactor

* make karma stats part of the Member ([0267588](https://github.com/makigas/clank/commit/02675880d7ddd510dbbeb7235872183d072b709a))
* replace custom types with discord-api-types ([6d966f0](https://github.com/makigas/clank/commit/6d966f04a1221e2d07fea959bf4c8327e07cac23))

## [0.21.0](https://github.com/makigas/clank/compare/v0.20.1...v0.21.0) (2021-06-08)


### Features

* grant +1 of karma on :wave: ([5004543](https://github.com/makigas/clank/commit/50045435fd292e81ed0ba9ea4766d94aab4249c3))
* handle karma using a slash command ([58363cf](https://github.com/makigas/clank/commit/58363cf8e16c65b2266654e5442045bb6df65fe4))


### Refactor

* split karma and report by type ([6626d59](https://github.com/makigas/clank/commit/6626d592e81a69397635ea84ff374b936e5a5e7e))

### [0.20.1](https://github.com/makigas/clank/compare/v0.20.0...v0.20.1) (2021-05-30)


### Bug Fixes

* member mutenotified tag is not being set ([3a3e0ca](https://github.com/makigas/clank/commit/3a3e0ca389f928fceeb4097c17c70f50db0b5618))

## [0.20.0](https://github.com/makigas/clank/compare/v0.19.0...v0.20.0) (2021-05-28)


### Features

* automatically expire warns ([f66ac27](https://github.com/makigas/clank/commit/f66ac27dad0517dff0ea0195766355f0fdf2c587))
* automatically mute members with -3 karma ([4e79ecd](https://github.com/makigas/clank/commit/4e79ecdb9537dbcfbeb746fff9b122d9baed93c7))
* handle heart as another +1 for karma ([a67b36d](https://github.com/makigas/clank/commit/a67b36ddbd8e66381eb37e313ac2b96bd7357a64))


### Bug Fixes

* code doesn't run because that's not how type systems work ([5720d20](https://github.com/makigas/clank/commit/5720d20e4456aa3b013c8e945b46d8a488a87714))
* wrong evaluation of undefined variable ([0bfc498](https://github.com/makigas/clank/commit/0bfc498b5bf238f657d23baddfb769b8fadb3951))


### Refactor

* inline XDG_CONFIG_HOME instead of using a dep ([d43db30](https://github.com/makigas/clank/commit/d43db304534be1dc0984790d0d9670afd7ed273e))

## [0.19.0](https://github.com/makigas/clank/compare/v0.18.0...v0.19.0) (2021-04-25)


### Features

* add members with karma to the allowlist for links ([f61cccf](https://github.com/makigas/clank/commit/f61cccf83a30d1ed85de9405b0cebe8cb5eedc66))

## [0.18.0](https://github.com/makigas/clank/compare/v0.17.1...v0.18.0) (2021-04-04)


### Features

* add clankctl commands for getting and setting karma ([7ece349](https://github.com/makigas/clank/commit/7ece349a11d9aecdc8d3bd61431ec461c3539fe2))
* add endpoints to control karma ([ab92978](https://github.com/makigas/clank/commit/ab9297879d8e7c53858758ecef33c3c0eff1ab73))


### Bug Fixes

* case sensitivity on file import ([d9492df](https://github.com/makigas/clank/commit/d9492df7e204783cd3b50cb0f907a8f06276b4db))
* commands starting with ! should not grant karma ([acf308c](https://github.com/makigas/clank/commit/acf308c94f694d0c6d63f6ea596863b360dbc0ae))

### [0.17.1](https://github.com/makigas/clank/compare/v0.17.0...v0.17.1) (2021-03-26)


### Bug Fixes

* handle negative points ([5565c41](https://github.com/makigas/clank/commit/5565c4124db868060b9568cfda5f009168172c6e))

## [0.17.0](https://github.com/makigas/clank/compare/v0.16.1...v0.17.0) (2021-03-19)


### Features

* add more levels to the karma system ([#262](https://github.com/makigas/clank/issues/262)) ([20596dc](https://github.com/makigas/clank/commit/20596dc62dbfdc8fff740a826e529be2e07c0365))

### [0.16.1](https://github.com/makigas/clank/compare/v0.16.0...v0.16.1) (2021-03-06)


### Features

* **karma:** add command to yield the karma of a member ([263ce87](https://github.com/makigas/clank/commit/263ce8796b6790a62e70b026aa592393889bb3d1))


### Bug Fixes

* **karma:** !setkarma is giving karma to the sender ([a1e08f9](https://github.com/makigas/clank/commit/a1e08f9e7fb6fd52c5979ae7c6c715147ac25b58))

## [0.16.0](https://github.com/makigas/clank/compare/v0.15.0...v0.16.0) (2021-03-06)


### Features

* add members to role when they reach level 10 ([e8c0704](https://github.com/makigas/clank/commit/e8c070422be330eda7a2e5094a8be9a0047159c4))
* **karma:** add karma backlog ([2e0aa43](https://github.com/makigas/clank/commit/2e0aa4366aa49ec58f14d14c2d86202bbf62d94b))
* grant points for every message sent ([237d3a6](https://github.com/makigas/clank/commit/237d3a63ba42112fd993a47fc97e2785f638439f))


### Bug Fixes

* **antiflood:** forget deleted messages ([f5cafeb](https://github.com/makigas/clank/commit/f5cafeb73c33bbd684b2a65d878cc667f4cf4fd6))
* compilation error due to function prototype ([030bdff](https://github.com/makigas/clank/commit/030bdffc08e0e9b05b924c5a4cf0a75630dea525))


### Refactor

* extract karma logic to lib/karma.ts ([561d160](https://github.com/makigas/clank/commit/561d160ffbafade32f83f2d095ce2aefdde71dc3))
* **karma:** move karma database to Client ([6b90bc9](https://github.com/makigas/clank/commit/6b90bc9d2141a69f3428c229f56323e9331892b3))

## [0.15.0](https://github.com/makigas/clank/compare/v0.14.1...v0.15.0) (2021-02-12)


### Features

* add AutoRole hook ([bf1947b](https://github.com/makigas/clank/commit/bf1947b7f5a1f58daea21ecf485d3ed5aae9418d))
* allow restarting a hook ([c915fcc](https://github.com/makigas/clank/commit/c915fcc90315f14ebbb9869ce7f1b405cd6be3c8))


### Bug Fixes

* exclude unverified members from antiflood ([c6f9f65](https://github.com/makigas/clank/commit/c6f9f659cc4d9e0361aa73168fc741691f0f328c)), closes [#242](https://github.com/makigas/clank/issues/242)

### [0.14.1](https://github.com/makigas/clank/compare/v0.14.0...v0.14.1) (2021-02-11)


### Bug Fixes

* disable Level 1 messages for trusted members ([e1ccd72](https://github.com/makigas/clank/commit/e1ccd72eb81e358acdb5c01ec7c6c7b4e22d24a1))

## [0.14.0](https://github.com/makigas/clank/compare/v0.13.0...v0.14.0) (2021-02-10)


### Features

* **karma:** put a different message for level up to level 1 ([3b01bc6](https://github.com/makigas/clank/commit/3b01bc67dc21c14370dc0e52f5d2295cbc4e3f5c))
* add karma ([#239](https://github.com/makigas/clank/issues/239)) ([5592fc8](https://github.com/makigas/clank/commit/5592fc80e54408edf14bf1bfa0c905052f331775))

## [0.13.0](https://github.com/makigas/clank/compare/v0.12.0...v0.13.0) (2021-01-17)


### Features

* add Counter ([01ccee3](https://github.com/makigas/clank/commit/01ccee3de06b4c0dd4c13e36051cd05907a1dab8))
* add expirable Tags ([ccc399d](https://github.com/makigas/clank/commit/ccc399d02b6d42d6eb13564973fb21e037a1b848))
* add multiple TTL expiration strategies ([f932509](https://github.com/makigas/clank/commit/f9325090c6c6b319e2245411de1e5c6f20c69817))
* add roles when members join voice channels ([18027fe](https://github.com/makigas/clank/commit/18027fe5cb4e1861d3a89f64c224552adc0f1eab))
* add TagBag ([c525cf6](https://github.com/makigas/clank/commit/c525cf60d5acbc549638a0e6cbd4bcb2fa396b57))
* add TTL strategies to Counters ([301fd13](https://github.com/makigas/clank/commit/301fd13d6a917786168330d8675628564b2d09c8))
* handle duplicate messages (flooding) ([6da4210](https://github.com/makigas/clank/commit/6da4210b187ee4cbfe58c5dcf0ae5427e60ea79c)), closes [#185](https://github.com/makigas/clank/issues/185)


### Bug Fixes

* exclude spec directory when building code ([c764f8d](https://github.com/makigas/clank/commit/c764f8d2fed2596782981eeb8d3c94ba3e8cc885))
* forgot to update some breaking changes ([848530c](https://github.com/makigas/clank/commit/848530c8cd6c071d1f4ee00e9c9501f4ac67ee5e))
* tweak antispam rules ([330b13c](https://github.com/makigas/clank/commit/330b13c18c99cfe7e7ce25f3dc281ff1f707c200))


### Refactor

* **ops:** run JavaScript GitHub Actions ([b81e2f9](https://github.com/makigas/clank/commit/b81e2f9e4657033f8dac6a01ec82c37a5704eebd))
* unit test Tag and Counter classes ([757af6b](https://github.com/makigas/clank/commit/757af6b90fbc5fb8c89b1ec7dd54a65fe01a1b12))

## [0.12.0](https://github.com/makigas/clank/compare/v0.11.2...v0.12.0) (2020-12-06)


### Features

* add hook registry ([4ef2c25](https://github.com/makigas/clank/commit/4ef2c2551bc237940a3ced67c577da0cb7ddedf5))
* add karma bag ([de13e0d](https://github.com/makigas/clank/commit/de13e0d93bc410aceb09055833f7049abe6a3871))
* add tombstones ([c534d67](https://github.com/makigas/clank/commit/c534d676880c768ffc6afcd768a7c93a48b3a7b0))
* moderate users with links disabled ([7bdd695](https://github.com/makigas/clank/commit/7bdd6956dd56af06654063b30e1ab8191d4b2ec9))


### Refactor

* import commands as ES Modules ([31c9365](https://github.com/makigas/clank/commit/31c93654692f3af15d9345990608075fe7ba16bf))

### [0.11.2](https://github.com/makigas/clank/compare/v0.11.1...v0.11.2) (2020-10-30)


### Bug Fixes

* fix usage of Intents ([8f5aadc](https://github.com/makigas/clank/commit/8f5aadce45d4efa5a8324448b32deedfbd60931e))

### [0.11.1](https://github.com/makigas/clank/compare/v0.11.0...v0.11.1) (2020-10-29)


### Bug Fixes

* declare intents for the bot ([338f045](https://github.com/makigas/clank/commit/338f045a5e0f936dddef5b0c886029cb1b49a89f))

## [0.11.0](https://github.com/makigas/clank/compare/v0.10.1...v0.11.0) (2020-10-28)

### [0.10.1](https://github.com/makigas/clank/compare/v0.10.0...v0.10.1) (2020-10-28)


### Features

* add logger to capture bot actions ([dc92a3e](https://github.com/makigas/clank/commit/dc92a3e413dbe63150e1dc1e0a4726a0a69d0e33))

## [0.10.0](https://github.com/makigas/clank/compare/v0.9.0...v0.10.0) (2020-10-18)


### Features

* don't dispatch antispam on trusted members ([9feeba8](https://github.com/makigas/clank/commit/9feeba8d7898fa53beab1bc66bfb39c790d193df)), closes [#184](https://github.com/makigas/clank/issues/184)
* enhance antispam system ([8803083](https://github.com/makigas/clank/commit/8803083b8a42438e90a00776ce423c7d90e5a2fe)), closes [#183](https://github.com/makigas/clank/issues/183)

## [0.9.0](https://github.com/makigas/clank/compare/v0.8.0...v0.9.0) (2020-09-25)


### Features

* add antiraid mode ([#177](https://github.com/makigas/clank/issues/177)) ([5bc35dd](https://github.com/makigas/clank/commit/5bc35dddbed0f8413b92e039faa563fc2254881d))
* remove messages that match invite codes ([#178](https://github.com/makigas/clank/issues/178)) ([19851f2](https://github.com/makigas/clank/commit/19851f24b56aa4072ff78cbb20c154ea3b23a169))


### Bug Fixes

* make the cooldown message less aggresive ([9958878](https://github.com/makigas/clank/commit/995887878a89f43ca35c40a26dc86e44a55eba8e))

## [0.8.0](https://github.com/makigas/clank/compare/v0.7.2...v0.8.0) (2020-09-19)


### Features

* add experimental clankctl command ([e69881a](https://github.com/makigas/clank/commit/e69881a7415ff6e0d46bab4d72cf881962731360))
* enhance verification flow ([efd517c](https://github.com/makigas/clank/commit/efd517cc5c6636f3651cf633326de484c0a23e64))
* expose guilds through the HTTP API ([59660fd](https://github.com/makigas/clank/commit/59660fd1b55d7e6d5f952ed27d00f9688377de23))
* introduce tags ([e812754](https://github.com/makigas/clank/commit/e8127542b4300195935b542fb4b4ee69188f6b4b))
* use webhooks for modlog events ([cd91852](https://github.com/makigas/clank/commit/cd91852e45e5b0d805c68bc66c33947029d0f8e8))


### Bug Fixes

* downgrade to axios 0.19.x to avoid bugs ([53f6922](https://github.com/makigas/clank/commit/53f6922c7b330e65496fd4f542fe3b1018983303))
* verifier may throw if message.member is null ([5dd0242](https://github.com/makigas/clank/commit/5dd024278733b6058ec6feaa49cbac080b0ede7b))


### Refactor

* centralize modlog event pushing ([2c3c6d6](https://github.com/makigas/clank/commit/2c3c6d6b09c8151058e4138a682726c50b5b787d))
* ffmpeg is not neccessary in Docker ([e034ec9](https://github.com/makigas/clank/commit/e034ec9d098395f5db56c6b06705828f5a5b7f4f))

### [0.7.2](https://github.com/makigas/clank/compare/v0.7.1...v0.7.2) (2020-07-19)


### Bug Fixes

* sometimes GuildMember#joinedAt yields null ([3817b0d](https://github.com/makigas/clank/commit/3817b0d901af00fa8093cb3431dfbad853c55052)), closes [#159](https://github.com/makigas/clank/issues/159) [#9](https://github.com/makigas/clank/issues/9)

### [0.7.1](https://github.com/makigas/clank/compare/v0.7.0...v0.7.1) (2020-07-02)


### Features

* **mod:** log bans into the private modlog ([#157](https://github.com/makigas/clank/issues/157)) ([f3194bf](https://github.com/makigas/clank/commit/f3194bfb5cdda0aefa71eaf34383c0a5877dadbe))
* **mod:** log wastebin events ([#156](https://github.com/makigas/clank/issues/156)) ([8157b8f](https://github.com/makigas/clank/commit/8157b8f8487975faa8f3c291ff6fa7d19374386b))
* **mod:** send successful verifications to modlog ([#155](https://github.com/makigas/clank/issues/155)) ([1138a1c](https://github.com/makigas/clank/commit/1138a1ceb283753af7edce5e19fe20398002bc2b))

## [0.7.0](https://github.com/makigas/clank/compare/v0.6.2...v0.7.0) (2020-06-25)

### [0.6.2](https://github.com/makigas/clank/compare/v0.6.1...v0.6.2) (2020-06-16)

### [0.6.1](https://github.com/makigas/clank/compare/v0.6.0...v0.6.1) (2020-06-13)


### Features

* disallow !helper to users who have been warned ([#145](https://github.com/makigas/clank/issues/145)) ([9b80377](https://github.com/makigas/clank/commit/9b80377ea1aa879f27cb31dd6ef16ee3ba21d75c))
* include channel in the WarnModlogMessage ([#127](https://github.com/makigas/clank/issues/127)) ([38cd055](https://github.com/makigas/clank/commit/38cd055b1a190e050e73e2dcf396f844915cf7ce))
* include link in the warned message ([#128](https://github.com/makigas/clank/issues/128)) ([5f656ca](https://github.com/makigas/clank/commit/5f656ca9c16e19d163d9d3aa11a610a88df56b8c)), closes [#107](https://github.com/makigas/clank/issues/107)


### Bug Fixes

* channels are not being found ([#114](https://github.com/makigas/clank/issues/114)) ([ca42ed3](https://github.com/makigas/clank/commit/ca42ed39c5f31cb6d257ba922f3bdaf2d2b7bf58))
* shutdown when the disconnect event is received ([#110](https://github.com/makigas/clank/issues/110)) ([f4ecc03](https://github.com/makigas/clank/commit/f4ecc035f83da947c261f46d6fd5072fc3ebe63c))

## [0.6.0](https://github.com/makigas/clank/compare/v0.5.1...v0.6.0) (2020-05-01)


### Features

* automatic moderation actions ([#94](https://github.com/makigas/clank/issues/94)) ([8561535](https://github.com/makigas/clank/commit/8561535b53f09062e4792fe04a2c4a47cf628fff))


### Refactor

* extract server settings into custom class ([#105](https://github.com/makigas/clank/issues/105)) ([2435eee](https://github.com/makigas/clank/commit/2435eee1fa00c8f4901a0b418dda985a24b28ddc))
* remove !presence and !activity ([#106](https://github.com/makigas/clank/issues/106)) ([0dc9f15](https://github.com/makigas/clank/commit/0dc9f151d57564ed389ce61b0c4f753fbab48f6a)), closes [#33](https://github.com/makigas/clank/issues/33)
* wrap role and channel accessors in Server class ([#104](https://github.com/makigas/clank/issues/104)) ([1656ba9](https://github.com/makigas/clank/commit/1656ba9d6506355ac783ed00422f8bd0216a1816))

### [0.5.1](https://github.com/makigas/clank/compare/v0.5.0...v0.5.1) (2020-04-26)

## [0.5.0](https://github.com/makigas/clank/compare/v0.4.2...v0.5.0) (2020-04-24)


### Refactor

* remove !horn command ([#93](https://github.com/makigas/clank/issues/93)) ([318bdb6](https://github.com/makigas/clank/commit/318bdb6f1cc75a218c3c10218210f2b07df7f6bf)), closes [#32](https://github.com/makigas/clank/issues/32)
* use fancier modlog messages ([#99](https://github.com/makigas/clank/issues/99)) ([267027f](https://github.com/makigas/clank/commit/267027fa45f6b582d9b04bb1f599cb0eaa8066ee))

## [0.4.2](https://github.com/makigas/clank/compare/v0.4.1...v0.4.2) (2019-12-07)


### Bug Fixes

* load commands ending in .js when Clank starts ([cd76601](https://github.com/makigas/clank/commit/cd76601d3b44bbb1ef2bdb9e7053e948b6299543))
* wait until client.destroy() promise resolves ([c9b5149](https://github.com/makigas/clank/commit/c9b51498419cf32735c34c47afce63a57ad3c851))



## [0.4.1](https://github.com/makigas/clank/compare/v0.4.0...v0.4.1) (2019-12-06)


### Bug Fixes

* actually build the program in Dockerfile ([78bda69](https://github.com/makigas/clank/commit/78bda6951f618ef3f4797aec0b822c9051fe57ef))
* tag Docker image as latest ([603cac5](https://github.com/makigas/clank/commit/603cac57479955ba28463dd9ebb9c1d6ef557dee))


### Features

* integrate with GitHub Registry ([#45](https://github.com/makigas/clank/issues/45)) ([0c98884](https://github.com/makigas/clank/commit/0c98884e3e92a3649484f3f03f31dc1e04a452f6))
* release to Docker when a release gets published ([#46](https://github.com/makigas/clank/issues/46)) ([265e81b](https://github.com/makigas/clank/commit/265e81bb7a14067ecc0a331a65dc7f6ee3acf7aa))



# [0.4.0](https://github.com/makigas/clank/compare/v0.3.3...v0.4.0) (2018-07-01)



## [0.3.3](https://github.com/makigas/clank/compare/v0.3.2...v0.3.3) (2018-06-16)



## [0.3.2](https://github.com/makigas/clank/compare/v0.3.1...v0.3.2) (2018-06-02)



## [0.3.1](https://github.com/makigas/clank/compare/v0.3.0...v0.3.1) (2018-05-27)



# [0.3.0](https://github.com/makigas/clank/compare/v0.2.0...v0.3.0) (2018-05-27)



# [0.2.0](https://github.com/makigas/clank/compare/v0.1.0...v0.2.0) (2018-05-06)



# 0.1.0 (2017-12-29)
