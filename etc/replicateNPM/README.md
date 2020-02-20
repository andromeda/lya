# Replicating the Registry

We want to replicate the entire npmjs registry.

## Instalation

```shell
$ # We download the couchdb image from dockerhub and run it
$ docker pull couchdb
$ docker run -d --name my-couchdb couchdb
$ docker run -p 5984:5984 -d couchdb
$
$ # Check that everything runs
$ curl -X GET http://localhost:5984
$ 
$ # We replicate the registry to local
$ # https://skimdb.npmjs.com/registry or
$ # https://replicate.npmjs.com/ (??)
$ curl -X POST http://127.0.0.1:5984/_replicate -d '{"source":"https://skimdb.npmjs.com/registry", "target":"http://localhost:5984/registry", "create_target":true}' -H "Content-Type: application/json" 
$
$ # We need to use verdacio since the api from npm is deprecated
$ npm install -g verdaccio
$ verdacio # And close it
$
$ # Edit the config.yaml to add http://localhost:5984/registry
$ # And let proxy point to the local couchdb database
$ # Run verdacio again
$ verdacio
$
$ # On an another tab we can install from the local registry like:
$ npm install --registry http://localhost:4873   jest
$
```

## More info

- https://hub.docker.com/_/couchdb
- https://nozzlegear.com/blog/couchdb-replication-fails-when-running-in-a-docker-container
- http://127.0.0.1:5984/_utils/
- https://github.com/npm/npm-registry-couchapp#replicating-the-registry
- https://verdaccio.org/docs/en/linking-remote-registry
