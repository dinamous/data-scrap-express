const app = require('./src/app');

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    console.log(`Swagger UI disponível em http://localhost:${PORT}/api-docs`);
  });
}