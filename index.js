const express = require('express');
const { FileStorage, File, JsonSigner, TESTNET } = require('@cere-ddc-sdk/file-storage');
const { Readable } = require('stream');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());

const bucketId = BigInt(process.env.DDC_BUCKET);

// Load the Cere wallet backup JSON file
const WalletSeedPhrase = require('./6RVH5JcwnHaeehPANp3XLdW6qtyNPwnvPW2LCbApTbidNtch.json');
const passphrase = process.env.CERE_WALLET_PASSPHRASE; // The passphrase to decrypt the wallet

let fileStorage;

// Initialize CERE DDC FileStorage Client using the JsonSigner
(async () => {
    const signer = new JsonSigner(WalletSeedPhrase, { passphrase });
    fileStorage = await FileStorage.create(signer, TESTNET);
    console.log('CERE FileStorage Client connected');
})();

app.post('/dapp/store', async (req, res) => {
    try {
        // WARNING: file is sent as a base64 string
        const fileBuffer = Buffer.from(req.body.file, 'base64');
        const fileStats = { size: fileBuffer.length };
        const fileStream = Readable.from(fileBuffer);

        const ddcFile = new File(fileStream, fileStatadd .s);

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
