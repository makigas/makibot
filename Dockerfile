# CLANK DOCKERFILE 🤖
# made with ❤️ by your friends at makigas

# ==============================================================================
# BASE IMAGE
FROM node:12-alpine AS base
RUN mkdir /clank
WORKDIR /clank


# ==============================================================================
# CLANK BUILD
FROM base AS compile

# Install package.json dependencies
ADD package.json package.json
ADD package-lock.json package-lock.json
RUN apk add --virtual npm-deps --no-cache --update python git build-base && \
    npm install && \
    npm cache clean --force && \
    apk del npm-deps

# Add and compile code.
ADD . .


# ==============================================================================
# UNPACK
FROM base AS clank

# Install dependencies
RUN apk add --no-cache --update ffmpeg dumb-init

# Prepare the pack.
ADD . .
COPY --from=compile /clank/dist dist
RUN apk add --virtual npm-deps --no-cache --update python git build-base && \
    npm i --only=production && \
    npm cache clean --force && \
    apk del npm-deps

# Set entrypoint
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/cli.js"]
