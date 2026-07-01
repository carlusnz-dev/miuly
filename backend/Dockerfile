FROM node:24
WORKDIR /src

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

CMD [ "npm", "start" ]
