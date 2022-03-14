// Required imports
import { traverseBlocks } from './read-blocks.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { performance } from 'perf_hooks';
import * as log from 'fancylog';
import fetch from "node-fetch";
import * as fs from 'fs';
import axios from 'axios';


const ADDRESS = process.env.WS_ADDRESS || 'ws://127.0.0.1:9944';
// const ADDRESS = process.env.WS_ADDRESS || 'wss://kusama-rpc.polkadot.io';
const CONNECTIONS = process.env.CONN || 0;
const TOTAL_BLOCKS = 256;
const RUN_TAG = process.env.TAG || 'X';
const TEST_DIR = process.env.TEST_DIR || 'misc';

// Execute script
async function main() {
  const provider = new WsProvider(ADDRESS);
  const api = await ApiPromise.create({ provider: provider });
  await chainSync(api);

  let currentBlock = await api.rpc.chain.getBlock();
  const endBlock = currentBlock.block.header.number;
  log.info(`(Shell ${RUN_TAG}) Current block: ${currentBlock.block.header.number}`);
  const startBlock = endBlock - TOTAL_BLOCKS;

  let startDate = new Date();
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
    let endDate = new Date();
    log.info(`(Shell ${RUN_TAG}) Total running time for the test with ${endBlock - startBlock} parallel connections and ${TOTAL_BLOCKS} blocks/connection took ${(endTime - startTime) / 1000} seconds to finish`);
    log.warn(`Finished processing shell ${RUN_TAG}.`)

    recordResults(startDate, endDate);

  }).catch(error => {
    log.error(error.message)
  });
}

async function chainSync(api) {
  let syncState = await api.rpc.system.syncState();
  let highestBlock = syncState.highestBlock;
  let currentBlock = syncState.currentBlock;
  log.info(`Highest Block= ${highestBlock} and Current Block = ${currentBlock}`);

  while (highestBlock - currentBlock > 3) {
    log.info(`Waiting for chain to complete syncing. ${highestBlock - currentBlock} to go!`);
    await sleep(3);
    syncState = await api.rpc.system.syncState();
    currentBlock = syncState.currentBlock;
    log.info(`Current Block = ${currentBlock}`);
  }

  log.info(`Chain is now in sync!`);

}

async function sleep(seconds) {
  await new Promise(r => setTimeout(r, seconds * 1000));
}

async function fetchMetrics(url, filename) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.text())
      .then(data => {
        writeFile(data, filename);
        resolve()
      });
  })

}

async function recordResults(startDate, endDate) {
  let currentRun = TEST_DIR + "/" + startDate.getTime();
  let dir = `./etc/tests/${currentRun}`
  fs.mkdirSync(dir, { recursive: true })

  await fetchMetrics('http://cadvisor:8080/metrics', `${dir}/metrics-cadvisor.txt`);
  await fetchMetrics('http://node_exporter:9100/metrics', `${dir}/metrics-node-exporter.txt`);
  await fetchMetrics('http://polkadot:9615/metrics', `${dir}/metrics-polkadot.txt`);
  let panels = 5;
  for (let i = 1; i <= panels; i++) {
    await downloadImage(`http://admin:admin@grafana:3000/render/d-solo/pMEd7m0Mz/cadvisor-exporter?orgId=1&from=${startDate.getTime()}&to=${endDate.getTime}&panelId=${i}&width=1000&height=500`, `${dir}/panel-${i}.png`);
  } 
  log.info(`Results recorded at ${currentRun}`);
  process.exit();
}

function writeFile(content, filepath) {
  try {
    fs.writeFileSync(filepath, content);
    //file written successfully
  } catch (err) {
    log.error(err)
  }
}

async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  return new Promise((resolve, reject) => {
    response.data.pipe(fs.createWriteStream(filepath))
      .on('error', reject)
      .once('close', () => resolve(filepath));
  });
}

main().catch(console.error);
