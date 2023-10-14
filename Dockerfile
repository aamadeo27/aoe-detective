FROM nikolaik/python-nodejs

RUN mkdir -p /usr/app

COPY tsconfig.json package.json yarn.lock /usr/app/
COPY src/ /usr/app/src
RUN cd /usr/app ; yarn install --frozen-lockfile
RUN cd /usr/app ; yarn run build

CMD [ "node","/usr/app/dist/bots.js" ]