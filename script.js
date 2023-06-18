const ethers = require('ethers');
const { shuffled } = require('ethers/lib/utils');
const fs = require('fs');
const abi = require('./abi.json');


const provider = new ethers.providers.JsonRpcProvider('https://zkevm-rpc.com');
const contractAddress = '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9';

function parseKeys() {
  const data = fs.readFileSync('keys.txt').toString();
  const keys = data.split('\n');
  return keys;
}

export async function fuck(min, max, maxTxs) {
  const keys = parseKeys();
  let wallets = keys.map(key => new ethers.Wallet(key.startsWith('0x') ? key : '0x' + key, provider));
  let walletData = {};
  for (let i = 0; i < wallets.length; i++) {
    walletData[wallets[i].address] = {
      address: wallets[i].address,
      privateKey: wallets[i].privateKey,
      count: 0,
      weth: false,
    };
  }

  while (true) {
    wallets = shuffled(wallets);
    const contract = new ethers.Contract(contractAddress, abi, wallets[0]);

    if (walletData[wallets[0].address].count > maxTxs) {
      wallets.shift();
      if (wallets.length === 0) {
        console.log('no more wallets left');
        break;
      }
      continue;
    }

    console.log('wallet address: ', wallets[0].address);
    console.log('tx count: ', walletData[wallets[0].address].count);

    if (walletData[wallets[0].address].weth) {

      let balance;
        while (true) {
        try {
          balance = await contract.balanceOf(wallets[0].address);
        } catch (e) {
          console.log(e);
          continue;
        }
        break;
      }

      if (balance < 0) {
        continue;
      }

      const value = balance.mul((Math.random() * 100).toFixed(0)).div(100);

      let withdraw;
      let gasLimit;
      while (true) {
        try {
          gasLimit = await contract.estimateGas.withdraw(value);
          withdraw = await contract.withdraw(value, { gasLimit });
        } catch (e) {
          console.log(e);
          continue;
        }
        break;
      }

      let receipt;
      while (true) {
        try {
          receipt = await withdraw.wait();
        } catch (e) {
          console.log(e);
          continue;
        }
        break;
      }
      console.log('unwrap tx: ', receipt.transactionHash);
      walletData[wallets[0].address].weth = false;
      walletData[wallets[0].address].count++;
    } else {
      let balance;
      while (true) {
        try {
          balance = await wallets[0].getBalance();
        } catch (e) {
          console.log(e);
          continue;
        }
        break;
      }

      if (balance < 0) {
        continue;
      }

      const value = balance.mul((Math.random() * 100).toFixed(0)).div(100);

      let deposit;
      let gasLimit;
      while (true) {
        try {
          gasLimit = await contract.estimateGas.deposit({ value });
          deposit = await contract.deposit({ value, gasLimit });
        } catch (e) {
          console.log(e);
          continue;
        }
        break;
      }

      let receipt;
      while (true) {
        try {
          receipt = await deposit.wait();
        } catch (e) {
          console.log(e);
          continue;
        }
        break;
      }

      console.log('wrap tx: ', receipt.transactionHash);
      walletData[wallets[0].address].weth = true;
      walletData[wallets[0].address].count++;
    }
    // wait min - max minutes
    promiseTime = (Math.random() * (max - min) + min) * 60 * 1000;
    console.log('waiting for ', promiseTime / 1000, ' seconds');
    console.log('\n');
    await new Promise(resolve => setTimeout(resolve, promiseTime));
  }
}
