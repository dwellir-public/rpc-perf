// Required imports
import { ApiPromise, WsProvider } from '@polkadot/api';
import * as log from 'fancylog'
import { performance } from 'perf_hooks';


const address = process.env.WS_ADDRESS || 'ws://127.0.0.1:9996';
// const address = process.env.WS_ADDRESS || 'wss://kusama-rpc.polkadot.io';
const START_BLOCK = process.env.START_BLOCK || 0;
const END_BLOCK = process.env.END_BLOCK || 1000;

export async function traverseBlocks(address, start, end, totalCount, tag = "X", info) {
    const provider = new WsProvider(address);
    const api = await ApiPromise.create({ provider: provider });
    const length = end - start;
    let count = 0;
    while (count < totalCount) {
        const randomBlock = Math.floor(Math.random() * length) + start;
        const blockHash = await api.rpc.chain.getBlockHash(randomBlock);
        const rpcBlock = await api.rpc.chain.getBlock(blockHash);
        const apiAt = await api.at(blockHash);
        await apiAt.query.system.events();
        await apiAt.query.transactionStorage?.blockTransactions();
        let extrinsicSize = await apiAt.query.system.allExtrinsicsLen();
        count++;
        info.counter++;
    }
    // log.info(`${tag}::connection finished.`)
}

// Execute script
async function main() {
    // Create our API with a default connection to the local node
    let start = Number.parseInt(START_BLOCK, 10);
    let end = Number.parseInt(END_BLOCK, 10);
    await traverseBlocks(address, start, end);
}

// main().catch(console.error).finally(() => process.exit());
