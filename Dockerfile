FROM node:latest

ENV WORKDIR=/bot

COPY bot/ ${WORKDIR}

RUN cd ${WORKDIR} && \
    npm install

ENTRYPOINT ["node", "/bot/index.js"]
