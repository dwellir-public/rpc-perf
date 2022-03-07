### Load testing RPC Node

#### Prerequisites
- This was tested with node.js version `v14.18.3` and yarn version `1.22.17`.
- Locally running 3 polkadot node instances on version `v0.9.9-rc3`, one acting as RPC node and 2 other as validators. 
- Prometheus and grafana servers to monitor metrics.

#### Steps
- To install dependencies, run `yarn` in the root directory of the project.
- Build polkadot node binary with `cargo build --release`
- Run the 1st boot node
```
./target/release/polkadot \
--base-path /tmp/alice \
--chain dev \
--alice \
--port 30333 \
--ws-port 9945 \
--rpc-port 9933 \
--node-key 0000000000000000000000000000000000000000000000000000000000000001 \
--telemetry-url "wss://telemetry.polkadot.io/submit/ 0" \
--validator
```
- Run 2nd node as validator
```
./target/release/polkadot \
--base-path /tmp/bob \
--chain dev \
--bob \
--port 30334 \
--ws-port 9946 \
--rpc-port 9934 \
--telemetry-url "wss://telemetry.polkadot.io/submit/ 0" \
--validator \
--bootnodes /ip4/127.0.0.1/tcp/30333/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp
```

- Run 3rd node to which the test suite will connect to
```
./target/release/polkadot \
--base-path /tmp/rpc \
--chain dev \
--port 30335 \
--ws-port 9944 \
--rpc-port 9935 \
--telemetry-url "wss://telemetry.polkadot.io/submit/ 0" \
--rpc-methods Unsafe
--ws-max-connections 1000
```