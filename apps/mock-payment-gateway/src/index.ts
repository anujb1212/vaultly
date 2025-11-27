import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(3004, () => {
    console.log('Mock Gateway running on http://localhost:3004');
});
