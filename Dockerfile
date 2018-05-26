# CLANK DOCKERFILE 🤖

# Alpine Linux because I can only afford slim images.
FROM node:10.1.2-alpine

# Please, use the issue tracker instead of this.
LABEL maintainer="dani@danirod.es"

# Installs ffmpeg for being able to talk in voice channels.
# Python and Alpine SDK required because of node-opus – also related to voice.
# Git is required to fetch some unstable dependencies at the moment.
RUN apk add --no-cache --update alpine-sdk ffmpeg git python

# Let's get this started.
RUN mkdir /clank
WORKDIR /clank

# Install dependencies
ADD package.json package.json
ADD package-lock.json package-lock.json
RUN npm install

# Install remaining files
ADD . .

# So Node.js has a hard time running an application as PID 1. To catch
# SIGTERM and SIGINT and gracefully log out the bot, our entrypoint here
# is an init process whose only responsability is to start npm and catch
# our signals just to forward them to the script.
RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64
RUN chmod +x /usr/local/bin/dumb-init
ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]
CMD ["npm", "start"]
