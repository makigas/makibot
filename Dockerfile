# CLANK DOCKERFILE 🤖

# Alpine Linux because I can only afford slim images.
FROM node:10.1-alpine

# Please, use the issue tracker instead of this.
LABEL maintainer="dani@danirod.es"

# Installs ffmpeg for being able to talk in voice channels.
RUN apk add --no-cache --update ffmpeg dumb-init

# Let's get this started.
RUN mkdir /clank
WORKDIR /clank

# Install dependencies
ADD package.json package.json
ADD package-lock.json package-lock.json
RUN apk add --virtual npm-deps --no-cache --update python git build-base && \
    npm install && \
    apk del npm-deps

# Install remaining files
ADD . .

# So Node.js has a hard time running an application as PID 1. To catch
# SIGTERM and SIGINT and gracefully log out the bot, our entrypoint here
# is an init process whose only responsability is to start npm and catch
# our signals just to forward them to the script.
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
