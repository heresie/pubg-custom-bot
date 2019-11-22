FROM node:latest

ENV WORKDIR=/bot

RUN mkdir -p ${WORKDIR}  && \
    apt-get update       && \
    apt-get install -y      \
              ffmpeg

COPY bot/package.json ${WORKDIR}
COPY bot/package-lock.json ${WORKDIR}

RUN mkdir -p ${WORKDIR} && \
    cd ${WORKDIR}       && \
    npm install

COPY bot/ ${WORKDIR}

ENTRYPOINT ["node", "/bot/src/index.js"]
