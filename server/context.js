// File: blockchain.js
// This file contains the core logic for interacting with the blockchain contracts.
// It's imported by server.js.

"use server";

const { ethers, Contract } = require('ethers');
const IdentityProxyABI = require('./abi/@onchain-id/solidity/contracts/proxy/IdentityProxy.sol/IdentityProxy.json');
const IdentityRegistry = require('./abi/registry/IdentityRegistry.sol/IdentityRegistry.json');

const IMPLEMENTATION_AUTHORITY = '0x22b1394F0b70513423747964B0A3352B1703Fffc';
const IDENTITY_REGISTRY = '0x7Eb85534067f0E123c85e60aBD8AF00EF642c361';

// Helper function to ensure environment variables are loaded
function checkEnvVariables() {
    if (!process.env.ADMIN_PRIVATE_KEY || !process.env.RPC_URL) {
        throw new Error("Missing required environment variables (ADMIN_PRIVATE_KEY or RPC_URL).");
    }
}

// Deploys a new IdentityProxy contract for a user.
async function deployIdentityProxy(userAddress) {
    console.log("Deploying Identity Proxy...");
    checkEnvVariables();
    
    try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const factory = new ethers.ContractFactory(
            IdentityProxyABI.abi,
            IdentityProxyABI.bytecode,
            adminWallet
        );
        const identity = await factory.deploy(IMPLEMENTATION_AUTHORITY, userAddress);
        await identity.deployed();
        console.log(`Identity Proxy deployed at: ${identity.address}`);
        return identity; // Return the full contract object

    } catch (error) {
        console.error("🔴 [ERROR] An error occurred during Identity Proxy deployment:", error);
        throw error;
    }
}

// A wrapper function that calls deployIdentityProxy and returns the address.
async function identityProxy(userAddress) {
    console.log("Deploying Identity for user:", userAddress);
    try {
        const identityContract = await deployIdentityProxy(userAddress);
        console.log("✅ Identity Proxy deployed successfully.");
        return identityContract.address;

    } catch (error) {
        console.error(`🔴 [ERROR] Failed to complete the identityProxy process for user ${userAddress}:`, error);
        throw error;
    }
}

// Registers the newly created identity in the main registry.
// MODIFIED: This function now accepts the identity's address instead of the full contract object.
async function registerIdentity(identityAddress, userAddress, countryCode) {
    console.log(`Registering identity at ${identityAddress} for user: ${userAddress}`);
    checkEnvVariables();

    try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const identityRegistry = new ethers.Contract(IDENTITY_REGISTRY, IdentityRegistry.abi, adminWallet);

        const txResponse = await identityRegistry.registerIdentity(
            userAddress,
            identityAddress,
            countryCode
        );

        const txReceipt = await txResponse.wait();
        console.log(`✅ User identity registered with transaction: ${txReceipt.transactionHash}`);
        return txReceipt.transactionHash;

    } catch (error) {
        console.error(`🔴 [ERROR] Failed to register identity for ${userAddress}:`, error);
        throw error;
    }
}

// Checks if a user is verified in the identity registry.
async function identityStatus(userAddress) {
    console.log(`Checking identity status for ${userAddress}...`);
    checkEnvVariables();
    try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        const identityRegistry = new ethers.Contract(IDENTITY_REGISTRY, IdentityRegistry.abi, provider);
        const isVerified = await identityRegistry.isVerified(userAddress);
        
        console.log(`Identity status for ${userAddress}: ${isVerified}`);
        return isVerified;

    } catch (error) {
        console.error(`🔴 [ERROR] Failed to retrieve identity status for ${userAddress}:`, error);
        throw error;
    }
}

module.exports = {
    identityProxy,
    registerIdentity,
    identityStatus
};
