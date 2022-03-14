# rpcperf

## Running test on dev nodes

`DB_CACHE=128 CONN=20 docker-compose --profile dev up --abort-on-container-exit`


## Running test on Polkadot prod node

- This test will need to be in sync with polkadot network. To make the sync faster run the following command which will download the latest chain snapshot (~45G).
`docker-compose run prefetch-data`

- Spin up prod network and tests with 

`docker-compose --profile prod build && DB_CACHE=128 docker-compose --profile prod up --abort-on-container-exit`

// TODO
- make file
- dump prometheus metrics
- snapshot of grafana graph
- tell how many connections
- set db-cache
- test configuration using env files
- artillery
- flamegraph node


// less peers, more peers, less db cache, more db cache, different versions of polkadot node
// node-version: v2.3.4