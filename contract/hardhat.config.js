require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // solidity: "0.8.20",
  // viaIR: true, // <--- This is the key fix for "Stack too deep"
  solidity: {
    version: "0.8.20", // Make sure this matches your contract pragma
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // <--- This is the key fix for "Stack too deep"
    },
  },
  networks: {
    hardhat: {
      accounts: {
        // mnemonic: process.env.SEED_PHRASE,
      },
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/F_gFlWSYe1f0h0SSER30j",
      // accounts: ["e512992f7bea5586253462f6d66b1ae322cd1621e9f775dd2c51da3afbdc84e2"] // your wallet private key for deployment
      accounts: ["3b2c11b20da69cae9eeaef863c8706a15ff54046806d86ed66c60520302de3c7"] // your wallet private key for deployment
    },
  },
};

