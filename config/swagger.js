const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Node Session Cookie API',
      version: '1.0.0',
      description: 'API documentation for Node Session Cookie project',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./routes/*.js'], // tất cả file route có comment @swagger
};

const swaggerSpec = swaggerJsdoc(options);

// Xuất file swagger.json
fs.writeFileSync(path.join(__dirname, '../swagger.json'), JSON.stringify(swaggerSpec, null, 2));

console.log('✅ swagger.json created successfully!');

module.exports = swaggerSpec;
