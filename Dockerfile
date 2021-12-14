FROM node:lts-slim

WORKDIR /var/olgitbridge/software
RUN apt-get update && apt-get upgrade -y && apt-get install --no-install-recommends git ca-certificates -y && apt-get clean
RUN git clone https://gitlab.com/axkibe/olgitbridge.git .
RUN npm install
RUN git config --global user.email "overleaf-git-bridge@system.changeme.invalid" && git config --global user.name "Overleaf Git Bridge"

COPY config.js /var/olgitbridge/software/config.js

ENTRYPOINT [ "node", "src/server.js" ]

