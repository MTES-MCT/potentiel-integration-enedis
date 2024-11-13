FROM node:lts AS deps
WORKDIR /app
COPY package*.json ./
    
RUN npm install

COPY . .


FROM deps AS builder
WORKDIR /app
RUN npm run build

FROM node:lts-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./

CMD ["node","./index.js"]