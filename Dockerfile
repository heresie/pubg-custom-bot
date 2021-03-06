FROM node:latest

ENV WORKDIR=/bot

RUN mkdir -p ${WORKDIR}  && \
    apt-get update       && \
    apt-get install -y      \
              ffmpeg     && \
    rm -rf /var/lib/apt/lists/*

COPY bot/package.json ${WORKDIR}

RUN mkdir -p ${WORKDIR} && \
    cd ${WORKDIR}       && \
    npm install

COPY bot/ ${WORKDIR}

ENTRYPOINT ["node", "/bot/src/main.js"]
