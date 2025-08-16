"use server";

import { ethers, Contract } from 'ethers'; // Import the 'Contract' type
import { Address } from 'viem';
import IdentityProxyABI from '../../../abi/@onchain-id/solidity/contracts/proxy/IdentityProxy.sol/IdentityProxy.json';
import IdentityRegistry from '../../../abi/registry/IdentityRegistry.sol/IdentityRegistry.json';

const IMPLEMENTATION_AUTHORITY = '0x22b1394F0b70513423747964B0A3352B1703Fffc';
const IDENTITY_REGISTRY = '0x7Eb85534067f0E123c85e60aBD8AF00EF642c361';

// This function now explicitly returns a Promise that resolves to a Contract object.
export async function deployIdentityProxy(userAddress: Address): Promise<Contract> {
    console.log("Deploying Identity Proxy...");
    console.log("private key:", process.env.ADMIN_PRIVATE_KEY);
    console.log("RPC URL:", process.env.RPC_URL);
    if (!process.env.ADMIN_PRIVATE_KEY || !process.env.RPC_URL) {
        // Throw an error if environment variables are not set. This is safer.
        throw new Error("Missing required environment variables (ADMIN_PRIVATE_KEY or RPC_URL).");
    }
    
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
        return identity; // Return the contract object directly.

    } catch (error) {
        console.error("🔴 [ERROR] An error occurred during Identity Proxy deployment:", error);
        throw error;
    }
}

export const identityProxy = async (userAddress: Address) => {
    console.log("Deploying Identity for user:", userAddress);
    try {
        // The destructuring is no longer needed since we return the contract directly.
        const identityContract = await deployIdentityProxy(userAddress);
        console.log("✅ Identity Proxy deployed successfully.");
        return identityContract.address;

    } catch (error) {
        console.error(`🔴 [ERROR] Failed to complete the identityProxy process for user ${userAddress}:`, error);
        throw error;
    }
}

// Add the 'Contract' type to the 'identity' parameter.
export async function registerIdentity(identity: Contract, userAddress: Address, countryCode: string) {
    console.log("Registering identity for user:", userAddress);
    try {
        if (!process.env.ADMIN_PRIVATE_KEY || !process.env.RPC_URL) {
            throw new Error("Missing required environment variables.");
        }
         const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const identityRegistry = new ethers.Contract(IDENTITY_REGISTRY, IdentityRegistry.abi, adminWallet);

        const userIdentity = await identityRegistry.registerIdentity(
            userAddress,
            identity.address, // Now TypeScript knows 'identity' has an 'address' property.
            countryCode
        );

        const tx = await userIdentity.wait();
        console.log(`✅ User identity registered with transaction: ${userIdentity.hash}`);
        return tx.hash;

    } catch (error) {
        console.error(`🔴 [ERROR] Failed to register identity for ${userAddress}:`, error);
        throw error;
    }
}

export const identityStatus = async (userAddress: Address) => {
    console.log(`Checking identity status for ${userAddress}...`);
    try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        const identityRegistry = new ethers.Contract(IDENTITY_REGISTRY, IdentityRegistry.abi, provider);
        const identityStatusVariable = await identityRegistry.isVerified(userAddress);
        
        console.log(`Identity status for ${userAddress}: ${identityStatusVariable}`);
        return identityStatusVariable;

    } catch (error) {
        console.error(`🔴 [ERROR] Failed to retrieve identity status for ${userAddress}:`, error);
        throw error;
    }
}