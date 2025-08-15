"use server"

const IMPLEMENTATION_AUTHORITY = '0x22b1394F0b70513423747964B0A3352B1703Fffc';
const IDENTITY_REGISTRY = '0x7Eb85534067f0E123c85e60aBD8AF00EF642c361';
import IdentityProxyABI from '../abi/@onchain-id/solidity/contracts/proxy/IdentityProxy.sol/IdentityProxy.json';
import IdentityRegistry from '../abi/registry/IdentityRegistry.sol/IdentityRegistry.json';
import { ethers } from 'ethers';



console.log("IdentityProxy module has been loaded!"); // This WILL run on page mount



async function deployIdentityProxy(userAddress) {
    console.log("Deploying Identity Proxy...");
    try {
        const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, ethers.providers.JsonRpcProvider(process.env.RPC_URL));
        const factory = await new ethers.ContractFactory(
            IdentityProxyABI.abi,
            IdentityProxyABI.bytecode,
            adminWallet
        );
        const identity = await factory.deploy(IMPLEMENTATION_AUTHORITY, userAddress);
        await identity.deployed();
        console.log(`Identity Proxy deployed at: ${identity.address}`);
        return ({ identity: identity, instance: "" });

    } catch (error) {
        console.error("🔴 [ERROR] An error occurred during Identity Proxy deployment:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}


export const identityProxy = async (userAddress) => {
    console.log("Deploying Identity for user:", userAddress);
    try {
        const { identity, instance } = await deployIdentityProxy(userAddress);
        console.log("✅ Identity Proxy deployed successfully.");
        return (identity.address);

    } catch (error) {
        console.error(`🔴 [ERROR] Failed to complete the identityProxy process for user ${userAddress}:`, error);
        throw error;
    }
}


export async function registerIdentity(identity, userAddress, countryCode) {
    console.log("Registering identity for user:", userAddress);
    try {
        const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, ethers.providers.JsonRpcProvider(process.env.RPC_URL));
        const identityRegistry = new ethers.Contract(IDENTITY_REGISTRY, IdentityRegistry.abi, adminWallet);

        const userIdentity = await identityRegistry.registerIdentity(
            userAddress,
            identity.address,
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

export const identityStatus = async (userAddress) => {
    console.log(`Checking identity status for ${userAddress}...`);
    try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        const identityRegistry = new ethers.Contract(IDENTITY_REGISTRY, IdentityRegistry.abi, provider);
        const identityStatusVariable = await identityRegistry.isVerified(userAddress);
        
        // Corrected the variable in the log message
        console.log(`Identity status for ${userAddress}: ${identityStatusVariable}`);
        return identityStatusVariable;

    } catch (error) {
        console.error(`🔴 [ERROR] Failed to retrieve identity status for ${userAddress}:`, error);
        throw error;
    }
}