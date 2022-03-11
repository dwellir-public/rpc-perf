# rpcperf

RPC Node Performance Issues

If you want to perform these tests on polkadot node, you can run the following command 
to download the chain snapshot in order to sync the node faster.

`docker-compose run prefetch-data`


Spin up prod network and tests with 
`DB_CACHE=128 docker-compose --profile prod up --abort-on-container-exit`
