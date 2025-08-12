const IMPLEMENTATION_AUTHORITY = '0x22b1394F0b70513423747964B0A3352B1703Fffc';
const IDENTITY_REGISTRY = '0x7Eb85534067f0E123c85e60aBD8AF00EF642c361';
import IdentityProxyABI from '../abi/@onchain-id/solidity/contracts/proxy/IdentityProxy.sol/IdentityProxy.json';
import IdentityRegistry from '../abi/@onchain-id/solidity/contracts/registry/IdentityRegistry.sol/IdentityRegistry.json';
import { ethers } from 'hardhat';


async function deployIdentityProxy(userAddress) {

    console.log("Deploying Identity Proxy...");
    const OnchainId = require('@onchain-id/solidity');
    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, ethers.provider);
    const factory = await new ethers.ContractFactory(
        IdentityProxyABI.abi,
        IdentityProxyABI.bytecode,
        adminWallet
    );
    const identity = await factory.deploy(IMPLEMENTATION_AUTHORITY, userAddress);
    await identity.deployed();
    console.log(`Identity Proxy deployed at: ${identity.address}`);
    return ({ identity: identity, instance: ethers.getContractAt("identity", identity.address, adminWallet) });

}


export const identityProxy = async (userAddress) => {

    console.log("Deploying Identity for user:", userAddress);

    const { identity, instance } = await deployIdentityProxy(userAddress);

    console.log("Identity Proxy deployed successfully.");

    return (identity.address);

}


export async function registerIdentity(identity, userAddress, countryCode) {
    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, ethers.provider);
    const identityRegistry = new ethers.Contract(IDENTITY_REGISTRY, IdentityRegistry.abi, adminWallet);

    console.log("Registering identity for user:", userAddress);
    const userIdentity = await identityRegistry.registerIdentity(
        userAddress,
        identity.address,
        countryCode
    );

    const tx = await userIdentity.wait();
    console.log(`User identity registered with transaction: ${userIdentity.hash}`);

    return tx.hash;
}

export const identityStatus = async (userAddress) => {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const identityRegistry = new ethers.Contract(IDENTITY_REGISTRY, IdentityRegistry.abi, provider);
    const identityStatusVariable = await identityRegistry.isVerified(userAddress);
    console.log(`Identity status for ${userAddress}: ${identity}`);
    return identityStatusVariable;

}