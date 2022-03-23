// Required imports
import { traverseBlocks } from './read-blocks.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import * as log from 'fancylog';
import fetch from "node-fetch";
import * as fs from 'fs';
import axios from 'axios';


const ADDRESS = process.env.WS_ADDRESS || 'ws://127.0.0.1:9944';
const BASE_CONNECTIONS = process.env.CONCURRENT_CONNECTIONS_BASE || 5;
const PEAK_CONNECTIONS = process.env.CONCURRENT_CONNECTIONS_PEAK || 100;
const WAIT_TIME = process.env.CONCURRENT_CONNECTIONS_WAIT_TIME_IN_SEC || 1;
const TOTAL_REQ = process.env.TOTAL_REQUESTS || 1000;
const TOTAL_BLOCKS = 256;
const TEST_DIR = process.env.TEST_DIR || 'misc';


// Execute script
async function main() {
  const provider = new WsProvider(ADDRESS);
  const api = await ApiPromise.create({ provider: provider });
  
  // wait for chain to sync
  await chainSync(api);

  let currentBlock = await api.rpc.chain.getBlock();
  const endBlock = currentBlock.block.header.number;
  const startBlock = endBlock - TOTAL_BLOCKS;

  let startDate = new Date();
  let baseConnections = Number.parseInt(BASE_CONNECTIONS, 10);
  let waitTime = Number.parseInt(WAIT_TIME, 10);
  let peakConnections = Number.parseInt(PEAK_CONNECTIONS, 10);
  let totalRequests = Number.parseInt(TOTAL_REQ, 10);
  let requestsServed = 0;
  let connToAdd = baseConnections;
  let requestsPerConn = Math.ceil(totalRequests / peakConnections);
  
  let info = {
    counter: 0,
    connections: 0,
    total: totalRequests,
    startDate: startDate
  }

  log.info(`Test will make ${requestsPerConn} requests per user`);
  progress(info);

  // initialize users
  let users = [];
  for (let i = 0; i < peakConnections; i++) {
    const provider = new WsProvider(ADDRESS);
    users.push(await ApiPromise.create({ provider: provider }));
  }

  // simulate users until all the requests are served
  while (requestsServed < totalRequests) {
    connToAdd = rampUpConnectionCount(info.connections, peakConnections);
    // make more users active
    for (let i = 0; i < connToAdd; i++) {
      let requestsToServe = Math.min(requestsPerConn, totalRequests - requestsServed);
      traverseBlocks(users[info.connections], startBlock, endBlock, requestsToServe, info).catch(error => log.error(error));
      info.connections++;
      requestsServed += requestsToServe;
    }   
    
    // wait before ramping up the users
    await sleep(waitTime);
  }
    
}

// show progress twice every minute
async function progress(info) {
  while (info.counter < info.total) {
    let progress = Math.floor(info.counter * 100 / info.total);
    log.info(`Progress: ${info.counter}/${info.total} blocks, ${progress}% with ${info.connections} concurrent connections`);
    await sleep(30);
  }

  // when all requests are fulfilled, record and save the results
  recordResults(info.startDate, new Date());
}

function rampUpConnectionCount(currentConnections, maxConnections) {
  // start with 10% of connections
  if (currentConnections == 0) {
    return Math.floor(maxConnections / 10);
  }

  // double the connections every time
  let newConnectionsToAdd = currentConnections;
     
  return Math.min(newConnectionsToAdd, maxConnections - currentConnections);
}

async function chainSync(api) {
  // wait sometime before starting the tests
  sleep(15);
  let syncState = await api.rpc.system.syncState();
  let highestBlock = syncState.highestBlock;
  let currentBlock = syncState.currentBlock;
  log.info(`Highest Block= ${highestBlock} and Current Block = ${currentBlock}`);

  while (highestBlock - currentBlock > 3) {
    log.info(`Waiting for chain to complete syncing. ${highestBlock - currentBlock} to go!`);
    await sleep(3);
    syncState = await api.rpc.system.syncState();
    currentBlock = syncState.currentBlock;
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
  await fetchMetrics('http://substrate_node:9615/metrics', `${dir}/metrics-polkadot.txt`);
  let panels = 8;
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
