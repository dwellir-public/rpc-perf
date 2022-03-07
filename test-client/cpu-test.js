// Required imports
import { traverseBlocks } from './read-blocks.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { performance } from 'perf_hooks';
import * as log from 'fancylog'

const ADDRESS = process.env.WS_ADDRESS || 'ws://127.0.0.1:9944';
// const ADDRESS = process.env.WS_ADDRESS || 'wss://kusama-rpc.polkadot.io';
const CONNECTIONS = process.env.CONN || 10;
const TOTAL_BLOCKS = 256;
const RUN_TAG = process.env.TAG || 'X';

// Execute script
async function main() {
  const provider = new WsProvider(ADDRESS);
  const api = await ApiPromise.create({ provider: provider });
  let currentBlock = await api.rpc.chain.getBlock();
  const endBlock = currentBlock.block.header.number;
  log.info(`(Shell ${RUN_TAG}) Current block: ${currentBlock.block.header.number}`);
  const startBlock = endBlock - TOTAL_BLOCKS;

  var startTime = performance.now();
  let conn = Number.parseInt(CONNECTIONS, 10);
  let tasks = [];
  let offset = RUN_TAG * CONNECTIONS;
  for (let i = 0; i < conn; i++) {
    tasks.push(traverseBlocks(ADDRESS, startBlock, endBlock, i + offset)
      .catch(error => log.error(error)));
  }

  Promise.all(tasks).then(() => {
    var endTime = performance.now();
    log.info(`(Shell ${RUN_TAG}) Total running time for the test with ${endBlock - startBlock} parallel connections and ${TOTAL_BLOCKS} blocks/connection took ${(endTime - startTime) / 1000} seconds to finish`);
    log.warn(`Finished processing shell ${RUN_TAG}.`)
    process.exit();
  }).catch(error => {
    log.error(error.message)
  });
}

main().catch(console.error);
