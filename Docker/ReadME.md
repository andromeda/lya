# Docker File to run Lya and Mir

# Install
```
docker build -t "lya:2.0" .
```

# How to run?
```
docker run --rm -it --entrypoint bash "lya:2.0"

# Run the following commands inside the docker:
nvm install 8.9.4
npm install -g npm@6.14.17
npm install
```
