const express = require('express');
const cors = require('cors');
const path = require('path');
const bfhlRoutes = require('./routes/bfhl');
const config = require('./config');

const app = express();


app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, '..', 'frontend')));


app.use('/', bfhlRoutes);

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(config.PORT, () => {
  console.log(`✓ BFHL server running on http://localhost:${config.PORT}`);
  console.log(`✓ API endpoint: POST http://localhost:${config.PORT}/bfhl`);
  console.log(`✓ Frontend:     http://localhost:${config.PORT}`);
});
