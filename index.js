const express = require('express');
const { FileStorage, File, TESTNET } = require('@cere-ddc-sdk/file-storage');
const { Readable } = require('stream');
require('dotenv').config();

const app = express();
app.use(express.json());

const user = process.env.DDC_WALLET_MNEMONIC;
const bucketId = BigInt(process.env.DDC_BUCKET);

let fileStorage;

// Initialize CERE DDC FileStorage Client
(async () => {
    fileStorage = await FileStorage.create(user, TESTNET);
    console.log('CERE FileStorage Client connected');
})();

app.post('/dapp/store', async (req, res) => {
    try {
        // WARNING: file is sent as a base64 string
        const fileBuffer = Buffer.from(req.body.file, 'base64');
        const fileStats = { size: fileBuffer.length };
        const fileStream = Readable.from(fileBuffer);

        const ddcFile = new File(fileStream, fileStats);

        // Store the file into DDC with SDK
        const fileCid = await fileStorage.store(bucketId, ddcFile);
        console.log('File stored into bucket', bucketId, 'with CID', fileCid);

        // Respond with the CERE storage URL
        res.json({
            message: 'File stored successfully',
            fileUrl: `https://storage.testnet.cere.network/${bucketId}/${fileCid}`
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
    if (fileStorage) {
        await fileStorage.disconnect();
    }
    process.exit();
});
