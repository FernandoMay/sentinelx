# SentinelX - AI Fraud Detection API with x402 on Stellar

A cutting-edge fraud detection system that combines AI-powered analysis with the x402 payment protocol on the Stellar network. Built for the Stellar Hacks: Agents Hackathon.

## Overview

SentinelX is a comprehensive fraud detection platform that:
- **Analyzes** messages, URLs, wallets, and combined inputs for fraud patterns
- **Implements** the x402 payment protocol for secure, per-request billing
- **Detects** 16+ scam patterns using advanced heuristic scoring
- **Provides** real-time API endpoints for integration
- **Features** an autonomous agent demo showcasing batch analysis capabilities

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: SQLite (production-ready)
- **Payment Protocol**: x402 on Stellar testnet
- **AI/ML**: Custom fraud detection engine with pattern matching

## Features

### Fraud Detection Engine
- 16+ sophisticated scam pattern detection
- Heuristic scoring system (0-100)
- Multi-layer analysis: URL, wallet, email, behavioral patterns
- Real-time threat level assessment (LOW, MEDIUM, HIGH, CRITICAL)

### x402 Payment Integration
- Seamless 402 payment flow implementation
- Stellar testnet integration with USDC
- Automatic payment verification
- Transaction tracking and persistence

### Autonomous Agent Demo
- Batch fraud analysis capabilities
- Automatic x402 payment processing
- Real-time console output with typewriter effects
- Multi-task agent simulation

### Beautiful UI/UX
- Dark cybersecurity theme with emerald green accents
- Responsive design for all devices
- Interactive components and animations
- Live statistics dashboard

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd sentinelx
```

2. **Install dependencies**
```bash
bun install
# or
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
bun run db:push
bun run db:generate
```

5. **Start the development server**
```bash
bun run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### POST /api/analyze
Main fraud analysis endpoint with x402 payment flow.

**Request:**
```json
{
  "inputType": "message|url|wallet|combined",
  "inputContent": "content to analyze",
  "walletAddress": "optional wallet for payment"
}
```

**Response:**
```json
{
  "riskScore": 85.2,
  "threatLevel": "HIGH",
  "prediction": "phishing_attack",
  "recommendedAction": "block_and_report",
  "paymentVerified": true,
  "details": {...}
}
```

### GET /api/analyze/history
Retrieve analysis history from the database.

### GET /api/stats
Get aggregate statistics and system metrics.

### POST /api/agent/demo
Trigger autonomous agent demo with batch analysis.

### GET /api/x402/info
Get x402 protocol information and configuration.

## Database Schema

The application uses three main models:

- **Analysis**: Stores fraud analysis results with payment verification
- **Payment**: Tracks x402 payments and transactions
- **AgentSession**: Manages autonomous agent sessions and statistics

## Development

### Available Scripts

- `bun run dev` - Start development server on port 3000
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run db:push` - Push database schema changes
- `bun run db:generate` - Generate Prisma client
- `bun run db:migrate` - Run database migrations
- `bun run db:reset` - Reset database

### Project Structure

```
src/
  app/                    # Next.js app router
    api/                 # API routes
      analyze/           # Fraud analysis endpoints
      agent/             # Agent demo endpoints
      stats/             # Statistics endpoints
      x402/              # x402 protocol endpoints
  components/
    sentinel/            # Main application components
  lib/
    fraud-engine.ts      # Core fraud detection logic
    x402.ts             # x402 protocol utilities
    prisma.ts           # Database client
```

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Next.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stellar (optional for production)
STELLAR_NETWORK="testnet"
STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
```

## Deployment

### Production Build

1. **Build the application**
```bash
bun run build
```

2. **Start production server**
```bash
bun run start
```

### Docker Deployment

A `Dockerfile` can be created for containerized deployment:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN bun install
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

## Security Features

- **Input Validation**: All inputs are validated using Zod schemas
- **Rate Limiting**: API endpoints implement rate limiting
- **Secure Payments**: x402 protocol ensures secure per-request billing
- **Data Privacy**: Analysis data is stored securely with encryption options

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for **Stellar Hacks: Agents Hackathon**
- Uses the **x402 payment protocol** on Stellar
- Powered by **Next.js 16** and **shadcn/ui**
- Fraud detection patterns based on real-world scam analysis

## Support

For questions and support:
- Create an issue in the repository
- Check the API documentation at `/api-docs` in the application
- Review the agent demo for implementation examples

---

**SentinelX** - Protecting users from fraud with AI and blockchain technology.
