require('dotenv').config();
const express = require('express');
const router = require('./src/routes/router.js');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs'); // Importe o YAMLJS

const app = express();
app.use(express.json());

const port = process.env.PORT || 8080;

// Carrega a especificação Swagger/OpenAPI
const swaggerDocument = YAML.load('./docs/swagger.yaml');

// Rota para a documentação Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/', router);

// Middleware para tratamento de erros (já existente no seu código)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    console.log(`Swagger UI disponível em http://localhost:${port}/api-docs`);
});