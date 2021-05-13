# This stage installs our modules
FROM node:14.15.4
WORKDIR /app
# Aa wildcard is used to ensure both package.json AND package-lock.json are copeied whre available
COPY package*.json ./

RUN npm install
# Bundle app source
COPY . .
EXPOSE 5000
CMD ["npm", "start"]