# MongoDB Models

This directory contains all MongoDB models and services for the CircularChain application.

## Models

### User Model (`UserModel.ts`)
Stores user information including wallet addresses, profiles, and roles.

**Fields:**
- `walletAddress`: User's Ethereum wallet address
- `name`: User's full name
- `companyName`: Company name
- `addressText`: Physical address
- `role`: User role (user, agent, admin, pending)
- `nonce`: Authentication nonce
- `isAvailable`: Availability status for agents

### Order Model (`OrderModel.ts`)
Stores order information synchronized with blockchain data.

**Fields:**
- `orderId`: Blockchain order ID
- `listingId`: Associated listing ID
- `listingName`: Product name
- `seller/buyer`: Wallet addresses and names
- `deliveryAgent`: Assigned agent details
- `quantity/totalAmount`: Order details
- `status`: Order status (AWAITING_AGENT, AWAITING_DELIVERY, COMPLETE, REFUNDED)
- `agentConfirmed/buyerConfirmed`: Confirmation status
- `deliveryStatus`: Delivery progress (0-4)
- `transactionHash/blockNumber`: Blockchain references

### Transaction Model (`TransactionModel.ts`)
Stores blockchain transaction data for auditing and analytics.

**Fields:**
- `transactionHash`: Ethereum transaction hash
- `blockNumber/blockHash`: Block information
- `from/to`: Sender and receiver addresses
- `value/gasUsed/gasPrice`: Transaction details
- `status`: Success/failure status
- `type`: Transaction type (ORDER_CREATED, AGENT_ASSIGNED, etc.)
- `orderId/listingId`: Associated entities
- `eventData`: Parsed smart contract events

### Listing Model (`ListingModel.ts`)
Stores product/listing information synchronized with blockchain.

**Fields:**
- `listingId`: Blockchain listing ID
- `name/companyName`: Product and seller details
- `seller`: Wallet address
- `pricePerUnit/quantityAvailable`: Pricing and inventory
- `imageHashes/dataHash`: IPFS references
- `category/materialType/location`: Classification
- `certifications/complianceInfo`: Regulatory data
- `isActive`: Listing status

## Services

### OrderService
Handles all order-related database operations:
- `create()` - Create new orders
- `findByUser()` - Get orders for a specific user
- `updateStatus()` - Update order status
- `updateDeliveryStatus()` - Update delivery progress
- `assignAgent()` - Assign delivery agent
- `getStats()` - Get order statistics

### ListingService
Manages product listings:
- `create()` - Create new listings
- `findActive()` - Get active listings
- `search()` - Search listings with filters
- `updateQuantity()` - Update inventory
- `getCategories()` - Get available categories

### TransactionService
Manages blockchain transaction records:
- `create()` - Record new transactions
- `findByOrder()` - Get transactions for an order
- `findByUser()` - Get user's transactions
- `getStats()` - Transaction statistics
- `getVolume()` - Volume analytics

## Usage

```typescript
import { OrderService, ListingService, TransactionService } from '@/lib/services';

// Create a new order
const order = await OrderService.create({
  orderId: 123,
  listingId: 456,
  seller: '0x...',
  buyer: '0x...',
  // ... other fields
});

// Find active listings
const listings = await ListingService.findActive();

// Get user orders
const userOrders = await OrderService.findByUser(walletAddress);
```

## Database Connection

All services automatically connect to MongoDB using the `dbConnect()` utility from `@/lib/dbConnect`.

## Indexes

All models include appropriate MongoDB indexes for efficient queries:
- Single field indexes on frequently queried fields
- Compound indexes for complex queries
- Text indexes for search functionality

## Data Synchronization

These models are designed to work alongside blockchain data:
- Store off-chain metadata and analytics
- Cache frequently accessed data
- Provide search and filtering capabilities
- Maintain audit trails for transactions