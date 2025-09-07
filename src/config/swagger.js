const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Top Up Games API',
      version: '1.0.0',
      description: 'API untuk aplikasi top up games dengan fitur manajemen produk, transaksi, dan user',
      contact: {
        name: 'API Support',
        email: 'support@topupgames.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username unik'
            },
            name: {
              type: 'string',
              description: 'Nama lengkap user'
            },
            role: {
              type: 'string',
              enum: ['admin', 'customer'],
              description: 'Role user'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Product ID'
            },
            name: {
              type: 'string',
              description: 'Nama produk'
            },
            price: {
              type: 'integer',
              description: 'Harga produk dalam rupiah'
            },
            discount: {
              type: 'integer',
              description: 'Persentase diskon (0-100)',
              nullable: true
            },
            is_populer: {
              type: 'boolean',
              description: 'Status popularitas produk'
            },
            total_diamond: {
              type: 'integer',
              description: 'Jumlah diamond yang didapat'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Transaction ID'
            },
            userId: {
              type: 'integer',
              description: 'ID user yang melakukan transaksi'
            },
            productId: {
              type: 'integer',
              description: 'ID produk yang dibeli'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Jumlah pembayaran'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'SUCCESS', 'FAILED'],
              description: 'Status transaksi'
            },
            paymentMethod: {
              type: 'string',
              description: 'Metode pembayaran'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            product: {
              $ref: '#/components/schemas/Product'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Pesan error'
            },
            details: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Detail error validasi'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // Path ke file routes untuk dokumentasi
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};