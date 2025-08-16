// File: server.js
// This is the main entry point for the application.
// It sets up an Express server to handle API requests.

// Load environment variables from .env file
require('dotenv').config(); 

const express = require('express');
const { identityProxy, registerIdentity, identityStatus } = require('./context');

const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies from incoming requests
app.use(express.json());

// --- API Endpoints ---

/**
 * @route POST /deploy
 * @desc Deploys an IdentityProxy contract for a given user address.
 * @body { "userAddress": "0x..." }
 * @returns { "address": "0x..." } or an error message.
 */
app.post('/deploy', async (req, res) => {
    const { userAddress } = req.body;
    if (!userAddress) {
        return res.status(400).json({ error: 'userAddress is required in the request body.' });
    }

    try {
        const deployedAddress = await identityProxy(userAddress);
        res.status(201).json({ address: deployedAddress });
    } catch (error) {
        res.status(500).json({ error: 'Failed to deploy identity proxy.', details: error.message });
    }
});

/**
 * @route POST /register
 * @desc Registers a deployed identity in the main registry.
 * @body { "userAddress": "0x...", "identityAddress": "0x...", "countryCode": "US" }
 * @returns { "transactionHash": "0x..." } or an error message.
 */
app.post('/register', async (req, res) => {
    const { userAddress, identityAddress, countryCode } = req.body;
    if (!userAddress || !identityAddress || !countryCode) {
        return res.status(400).json({ error: 'userAddress, identityAddress, and countryCode are required.' });
    }

    try {
        const txHash = await registerIdentity(identityAddress, userAddress, countryCode);
        res.status(200).json({ transactionHash: txHash });
    } catch (error) {
        res.status(500).json({ error: 'Failed to register identity.', details: error.message });
    }
});

/**
 * @route GET /status/:userAddress
 * @desc Checks the verification status of a user.
 * @param {string} userAddress - The user's wallet address in the URL path.
 * @returns { "isVerified": boolean } or an error message.
 */
app.get('/status/:userAddress', async (req, res) => {
    const { userAddress } = req.params;
    if (!userAddress) {
        return res.status(400).json({ error: 'userAddress is required in the URL path.' });
    }

    try {
        const isVerified = await identityStatus(userAddress);
        res.status(200).json({ isVerified });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get identity status.', details: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
});
