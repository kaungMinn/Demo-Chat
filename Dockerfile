FROM node:19-alpine

COPY package.json /app/
COPY tsconfig.json /app/
COPY src /app/src/
COPY .env /app/

WORKDIR /app

RUN npm install

CMD ["npm", "run", "dev"]