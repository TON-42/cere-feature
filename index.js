const express = require('express');
const { FileStorage, File, JsonSigner, TESTNET } = require('@cere-ddc-sdk/file-storage');
const { Readable } = require('stream');
require('dotenv').config();

const app = express();
app.use(express.json());

const bucketId = BigInt(process.env.DDC_BUCKET);

// Load the Cere wallet backup JSON file
const WalletSeedPhrase = require('./6RVH5JcwnHaeehPANp3XLdW6qtyNPwnvPW2LCbApTbidNtch.json');
const passphrase = process.env.CERE_WALLET_PASSPHRASE; // The passphrase to decrypt the wallet

let fileStorage;

// initialize FileStorage Async
(async () => {
    try {
        const signer = new JsonSigner(WalletSeedPhrase, { passphrase });
        console.log('Signer created');
        fileStorage = await FileStorage.create(signer, TESTNET);
        console.log('FileStorage client created');
    } catch (error) {
        console.error('Error initializing FileStorage:', error);
        process.exit(1); // Exit if initialization fails
    }
})();

// Start the server only after initialization is complete
app.listen(process.env.PORT || 3000, () => {
    if (fileStorage) {
        console.log(`Server is running on port ${process.env.PORT || 3000}`);
    }
});

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.post('/dappstorage', async (req, res) => {
    try {
        let fileBuffer;

        if (process.env.INDEV === '1') {
            // Generate file content with the current date
            const currentDate = new Date().toISOString();
            fileBuffer = Buffer.from(currentDate, 'utf-8');
            console.log('Uploading current date:', currentDate);
        } else {
            // Use the file content provided in the API call
            fileBuffer = Buffer.from(req.body.file, 'base64');
            console.log('Uploading received file content');
        }

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

// Clean up on exit
process.on('SIGINT', async () => {
    if (fileStorage) {
        await fileStorage.disconnect();
    }
    process.exit();
});
