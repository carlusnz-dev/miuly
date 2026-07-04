import express from 'express';
import http from 'http';

const app = express();
const admin = express();
app.use('/admin', admin)

const server = app.listen(8000, (error) => {
    if (error) {
        throw error
    }
    console.log('Servidor rodando na porta 8000')
})

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/user/:id', (req, res) => {
    res.send(`user ${req.params.id}`)
})