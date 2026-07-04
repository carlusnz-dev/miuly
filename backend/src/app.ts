import express from 'express';

const app = express();
const admin = express();
app.use('/admin', admin);

app.listen(8000, (error) => {
  if (error) {
    throw error;
  }
  console.log('Servidor rodando na porta 8000');
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/user/:id', (req, res) => {
  res.send(`user ${req.params.id}`);
});
