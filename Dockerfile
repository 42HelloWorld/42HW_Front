FROM node:16
WORKDIR /app/frontend
# COPY frontend/package.json .
# RUN npm install
COPY . .

EXPOSE 3090

# CMD ["npm", "run", "dev"]
CMD ["bash", "setup.sh"]