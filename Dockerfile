FROM node:18.14.2-slim

RUN apt-get update && apt-get install sox libsox-fmt-mp3 -y

#libsox-fmt-all
WORKDIR /spotify-radio/


COPY package.json package-lock.json /spotify-radio/

RUN npm ci --silent

COPY . .

USER node

CMD npm run live-reload
