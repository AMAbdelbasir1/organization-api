# Development stage
FROM node:18.15.0 as development

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "start:dev" ]

# Production stage
FROM node:18.15.0 as production

WORKDIR /app

COPY package.json .

RUN npm install --only=production
RUN npm install -g @nestjs/cli

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]
