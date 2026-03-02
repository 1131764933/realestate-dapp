# Real Estate DApp

A Web2 + Web3 hybrid real estate booking platform built with React, Node.js, and Solidity.

## Project Overview

This is a real estate booking DApp that demonstrates full-stack Web3 development skills. Users can browse properties, connect wallet, make bookings, and mint NFTs as booking vouchers.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Mantine UI, wagmi |
| Backend | Node.js, Express, MongoDB |
| Smart Contract | Solidity, Hardhat, OpenZeppelin |
| Authentication | Auth0 |
| Wallet | MetaMask |

## Features

- Browse property listings
- Connect wallet (MetaMask)
- Book properties with ETH payment
- Mint NFT as booking voucher
- Cancel bookings
- View booking history

## Project Structure

```
realestate-dapp/
├── contracts/           # Smart contracts (Solidity)
├── backend/             # Node.js backend
│   └── src/
│       ├── routes/      # API routes
│       ├── models/      # MongoDB models
│       ├── services/    # Business logic
│       └── utils/       # Utilities
├── frontend/            # React frontend
│   └── src/
│       ├── pages/       # Page components
│       ├── config/      # Configuration
│       └── context/     # React contexts
└── docs/               # Documentation
    └── plan/           # Task plans
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- MetaMask wallet

### Installation

1. Install dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

2. Configure environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit .env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
```

3. Start local blockchain
```bash
cd contracts
npx hardhat node
```

4. Deploy contracts
```bash
npx hardhat run scripts/deploy.js --network localhost
```

5. Start backend
```bash
cd backend
npm run dev
```

6. Start frontend
```bash
cd frontend
npm run dev
```

## Smart Contract

The `BookingContract` includes:

- Property management (add, activate, deactivate)
- Booking with date validation
- Booking status machine (Pending → Confirmed → Completed/Cancelled)
- NFT minting for bookings
- BitMap optimization for date storage
- Reentrancy protection

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/properties | List all properties |
| GET | /api/properties/:id | Get property details |
| POST | /api/bookings | Create booking |
| GET | /api/bookings/user/:address | Get user bookings |
| POST | /api/bookings/:id/mint-nft | Mint NFT |
| POST | /api/bookings/:id/cancel | Cancel booking |

## Demo Flow

1. Open frontend at http://localhost:5173
2. Connect MetaMask wallet
3. Select a property and choose dates
4. Confirm booking in MetaMask
5. View bookings in "My Bookings" page
6. Mint NFT as booking voucher

## Gas Optimization

- Used BitMap for date storage (1 bit per day)
- Minimal storage operations
- Off-chain data storage for property details

## Security

- OpenZeppelin contracts (ERC721, Ownable, ReentrancyGuard)
- Owner-only functions for property management
- Booking owner validation for cancellations and NFT minting

## License

MIT

---

Built for Web3 interview demonstration
