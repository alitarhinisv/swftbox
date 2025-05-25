# SwftBox - Order Processing System

SwftBox is a robust order processing system built with NestJS and GraphQL. It handles CSV file uploads containing order data, processes them asynchronously, and provides real-time status updates through a GraphQL API.

## Features

- CSV File Upload: Bulk order processing through CSV file uploads
- Asynchronous Processing: Orders are processed in the background using RabbitMQ
- Real-time Status Updates: Track order processing status in real-time
- Order Validation: Comprehensive validation of order data including:
  - Address validation
  - Inventory checking
  - Shipping calculation
  - Risk assessment
- Detailed Logging: Comprehensive logging for debugging and monitoring
- Pagination: Efficient data retrieval with offset-based pagination
- Status Filtering: Filter orders by their processing status
- Analytics: Order metrics aggregated by city
- Health Monitoring: REST endpoint for system health checks

## Architecture

### Tech Stack
- **Backend Framework**: NestJS
- **API**: GraphQL with Apollo Server
- **Database**: PostgreSQL with TypeORM
- **Message Queue**: RabbitMQ
- **File Processing**: csv-parse
- **Type Safety**: TypeScript

### Core Components
1. **Upload Module**: Handles file uploads and initial processing
2. **Order Module**: Manages order processing and status updates
3. **Queue Module**: Handles asynchronous processing using RabbitMQ
4. **Health Module**: System health monitoring

### Data Flow
1. Client uploads CSV file → Upload Service
2. Upload Service parses file → Creates Order records
3. Orders queued in RabbitMQ → Order Consumer processes each order
4. Order Processor performs validations and updates status
5. Client can query order status through GraphQL API

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- RabbitMQ
- Docker (optional)

### Environment Setup
Create a \`.env.development\` file in the root directory:

\`\`\`env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=swftbox
DB_PASSWORD=swftbox
DB_DATABASE=swftbox

# RabbitMQ
RABBITMQ_URL=amqp://swftbox:swftbox@localhost:5672

# GraphQL
GRAPHQL_PLAYGROUND=true
CSRF_PREVENTION=false

# App
NODE_ENV=development
PORT=3000
\`\`\`

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone <repository-url>
   cd swftbox
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the database and RabbitMQ (using Docker):
   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. Run migrations:
   \`\`\`bash
   npm run typeorm:migration:run
   \`\`\`

5. Start the application:
   \`\`\`bash
   npm run start:dev
   \`\`\`

### Usage

1. Access GraphQL Playground: http://localhost:3000/graphql

2. Upload Orders:
   \`\`\`graphql
   mutation UploadOrders($file: Upload!) {
     uploadOrders(file: $file) {
       id
       filename
       totalOrders
       status
     }
   }
   \`\`\`

3. Check Upload Status:
   \`\`\`graphql
   query GetUploadStatus($uploadId: ID!) {
     getUploadStatus(uploadId: $uploadId) {
       id
       filename
       totalOrders
       status
       orders {
         orderId
         status
       }
     }
   }
   \`\`\`

4. Get Orders with Pagination:
   \`\`\`graphql
   query GetOrders($uploadId: ID!, $limit: Float, $offset: Float, $status: String) {
     getOrders(uploadId: $uploadId, limit: $limit, offset: $offset, status: $status) {
       orderId
       customerEmail
       status
       errorReason
     }
   }
   \`\`\`

5. Get Order Metrics by City:
   \`\`\`graphql
   query GetOrdersByCity {
     getOrdersByCity {
       city
       orderCount
       totalQuantity
     }
   }
   \`\`\`

   This query returns aggregated order metrics for each city:
   - `city`: Name of the city
   - `orderCount`: Total number of orders from this city
   - `totalQuantity`: Sum of quantities ordered from this city

   Example response:
   \`\`\`json
   {
     "data": {
       "getOrdersByCity": [
         {
           "city": "New York",
           "orderCount": 150,
           "totalQuantity": 427
         },
         {
           "city": "Los Angeles",
           "orderCount": 89,
           "totalQuantity": 234
         }
       ]
     }
   }
   \`\`\`

6. Health Check:
   The application provides a REST endpoint for health monitoring:

   ```bash
   curl http://localhost:3000/health
   ```

   Response:
   ```json
   {
     "status": "ok",
     "info": {
       "database": {
         "status": "up"
       },
       "messageQueue": {
         "status": "up"
       }
     },
     "error": {},
     "details": {
       "database": {
         "status": "up"
       },
       "messageQueue": {
         "status": "up"
       }
     }
   }
   ```

   The health check endpoint monitors:
   - Database connection status
   - RabbitMQ connection status
   - Overall application health

### CSV File Format
Orders CSV should have the following columns:
- order_id (format: ORD-XXXXXX)
- customer_email
- product_sku (format: SKU-XXXXXXXX)
- quantity
- address
- city

Example:
\`\`\`csv
order_id,customer_email,product_sku,quantity,address,city
ORD-123456,customer@example.com,SKU-ABCD1234,2,"123 Main St",New York
\`\`\`

## Testing

Run unit tests:
\`\`\`bash
npm run test
\`\`\`

Run e2e tests:
\`\`\`bash
npm run test:e2e
\`\`\`

## License

[MIT License](LICENSE)
