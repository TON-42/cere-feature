const express = require('express');
const { DdcClient, File, TESTNET } = require('@cere-ddc-sdk/ddc-client');
const { Readable } = require('stream');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(express.json());

const user = process.env.DDC_WALLET_MNEMONIC; // Access wallet mnemonic from environment variable
const bucketId = BigInt(process.env.DDC_BUCKET); // Access bucket ID from environment variable

let client;

// Initialize CERE DDC Client
(async () => {
    client = await DdcClient.create(user, TESTNET);
    console.log('CERE DDC Client connected');
})();

app.post('/dapp/store', async (req, res) => {
    try {
        // WARNING: file is sent as a base64 string
        const fileBuffer = Buffer.from(req.body.file, 'base64');
        const fileStats = { size: fileBuffer.length };
        const fileStream = Readable.from(fileBuffer);

        const ddcFile = new File(fileStream, fileStats);

        const fileUri = await client.store(bucketId, ddcFile);
        console.log('File stored into bucket', bucketId, 'with CID', fileUri.cid);

        // Respond with the CERE storage URL
        res.json({
            message: 'File stored successfully',
            fileUrl: `https://storage.testnet.cere.network/${bucketId}/${fileUri.cid}`
        });
    } catch (error) {
        console.error('Error storing file:', error);
        res.status(500).send('Error storing file');
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

process.on('SIGINT', async () => {
    if (client) {
        await client.disconnect();
    }
    process.exit();
});
