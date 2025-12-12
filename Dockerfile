FROM node
WORKDIR /project
COPY . /project
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt install -y vim
RUN npm install --global typescript vite
RUN npm install --include=dev --no-progress

CMD ["vite", "--host", "0.0.0.0"]
