# rpcperf

## Running test on dev nodes

`DB_CACHE=128 CONN=20 docker-compose --profile dev up --abort-on-container-exit`


## Running test on Polkadot prod node

- This test will need to be in sync with polkadot network. To make the sync faster run the following command which will download the latest chain snapshot (~45G).
`make download-snapshot`

- Rebuild test client when code changes or new code is pulled from repository

`make build `

- Spin up prod network and tests with 

`make test`

- To run tests with custom environment, define and pass an environment file

`make test TEST_ENV=low-cache.env`


## TODO
- Flame graph
- less peers, more peers, less db cache, more db cache, different versions of polkadot node
- node-version: v2.3.4