FROM node:latest
MAINTAINER Complic <info@complic.eu>

# ENV NODE_ENV production
ADD app/ /var/node/app

WORKDIR /var/node/app

ENTRYPOINT npm install && node app.js
#ENTRYPOINT node app.js
