# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
