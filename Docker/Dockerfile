FROM  exoplatform/ubuntu:20.04

# Install OpenJdk Java 11 SDK
WORKDIR /usr/src/app

RUN apt-get update && apt-get -y install openjdk-11-jdk-headless

RUN apt-get install git -y
RUN apt-get install nodejs -y 
RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash






RUN apt-get install npm -y
RUN npm install -g npm@6.14.17



RUN git clone https://github.com/abdul-manaan/lya

RUN npm i @andromeda/mir-sa -g
RUN npm i @andromeda/mir-da -g

RUN apt-get update
RUN apt install vim -y

WORKDIR /usr/src/app/lya

ENTRYPOINT ["/bin/bash"]


