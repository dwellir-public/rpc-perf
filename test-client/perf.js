import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';

// Configuration
const maxConnections = 300
const factor = 100;
const rpcNode = 'ws://16.170.253.239:9966';

let keyring, wsProvider, totalAccounts, funders;

async function run() {
  const api = await ApiPromise.create({ provider: wsProvider });
  keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
  wsProvider = new WsProvider(rpcNode);

  funders = initialiseFunders();
  totalAccounts = funders.length * factor;
  console.log("Number of accounts to be created for the test:", totalAccounts)

  await fundAccounts(api);
  await simulateClients(maxConnections, 6);
  console.log("Reached maximum connections. Won't create any more.")
}

async function simulateClients(numberOfConnections, waitBetweenNewConnections = 6) {
  for (var i = 0; i < numberOfConnections; i++) {
    console.log("Creating connection:", i)
    const api = await ApiPromise.create({ provider: wsProvider });
    simulateTransfers(api, i)
    await sleep(waitBetweenNewConnections)
  }
}

function initialiseFunders() {
  const alice = keyring.createFromUri('//Alice');
  const bob = keyring.createFromUri('//Bob');
  const charlie = keyring.createFromUri('//Charlie');
  const dave = keyring.createFromUri('//Dave');
  const eve = keyring.createFromUri('//Eve');
  const ferdie = keyring.createFromUri('//Ferdie');
  return [alice, bob, charlie, dave, eve, ferdie];
}

async function fundAccounts(api) {
  console.log("Initiating funding of seed accounts")
  for (var f = 0; f < funders.length; f++) {
    let funderBalance = Math.floor(await getBalance(api, funders[f].address));
    const txs = [];
    for (var r = 0; r < factor; r++) {
      const fundAccountSeed = f * factor + r;
      txs[r] = api.tx.balances.transfer(getAccount(fundAccountSeed).address, Math.floor(funderBalance / (2 * factor)))
    }

    if (f < funders.length - 1) {
      fundBatch(api, funders[f], txs)
    }
    else {
      console.log("Waiting for funding blocks to finalise....");
      await fundBatch(api, funders[f], txs);
      console.log("Initialisation complete!");
    }

  }

  async function fundBatch(api, funder, txs) {
    return new Promise(async (resolve, reject) => {
      const unsub = await api.tx.utility.batch(txs).signAndSend(funder, async ({ events = [], status }) => {
        if (status.isFinalized) {
          unsub();
          resolve();
        }
      });
    });
  }
}




async function simulateTransfers(api, connectionID) {
  let transfers = 0;
  while (true) {
    const senderSeed = randomSeed();
    const receiverSeed = randomSeed(); // sending to own account is valid transaction
    await sendTokens(api, senderSeed, receiverSeed);
    console.log("Stats: Total transfer count:", ++transfers, "via connection:", connectionID);
  }
}

async function sendTokens(api, senderSeed, receiverSeed) {
  return new Promise(async (resolve, reject) => {

    const sender = getAccount(senderSeed);
    const receiver = getAccount(receiverSeed);
    const transfer = api.tx.balances.transfer(receiver.address, 1);
    const unsub = await transfer.signAndSend(sender, { nonce: -1 }, async ({ events = [], status }) => {
      if (status.isInBlock) {
        console.log("Transfer ", senderSeed, "-->", receiverSeed);
        unsub();
        resolve();
      }
    });
  });
}

async function sleep(seconds) {
  await new Promise(r => setTimeout(r, seconds * 1000));
}

function randomSeed() {
  return Math.floor(Math.random() * totalAccounts);
}

async function getBalance(api, address) {
  let { data: { free: previousFree }, nonce: previousNonce } = await api.query.system.account(address);
  return previousFree.toString()
}

async function getFeeInfo(api, sender, receiver) {
  const info = await api.tx.balances
    .transfer(receiver.address, 123)
    .paymentInfo(sender);

  console.log(`
  class=${info.class.toString()},
  weight=${info.weight.toString()},
  partialFee=${info.partialFee} or ${info.partialFee.toHuman()}
`);

}

function getAccount(seed) {
  return keyring.createFromUri("//Alice/" + ("00000" + seed).slice(-6));
}

run()