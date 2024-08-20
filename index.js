const express = require('express');
const axios = require('axios'); // to make HTTP requests to another service

const app = express();
app.use(express.json());

app.post('/dapp', async (req, res) => {
    try {
        const modifiedRequest = {
            ...req.body,
            extraData: 'extra added data'
        };

        // Forward
        const response = await axios.post('https://CERE_API', modifiedRequest);

        // Send the response back to frontend
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error forwarding request');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
