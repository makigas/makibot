# CLANK DOCKERFILE 🤖
# made with ❤️ by your friends at makigas

FROM node:12-alpine
RUN mkdir /clank
WORKDIR /clank

# Server dependencies
RUN apk add --no-cache --update ffmpeg dumb-init

# Add source code
ADD . .

# Compile Typescript into dist
RUN apk add --virtual npm-deps --no-cache --update python git build-base && \
    npm install && \
    npm run build && \
    npm cache clean --force && \
    rm -rf node_modules && \
    apk del npm-deps

# Then install runtime dependencies only
RUN apk add --virtual npm-deps --no-cache --update python git build-base && \
    npm i --only=production && \
    npm cache clean --force && \
    apk del npm-deps

# Set entrypoint
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/cli.js"]
