# SentinelX - AI Fraud Detection API with x402 on Stellar

A cutting-edge fraud detection system that combines AI-powered analysis with the x402 payment protocol on the Stellar network. Built for the Stellar Hacks: Agents Hackathon — **now running REAL on-chain x402 payments** (v2 spec, Coinbase facilitator, fees sponsored).

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
- **Payment Protocol**: x402 v2 on Stellar (`@x402/core`, `@x402/stellar`, `@x402/next`, `@x402/fetch`)
- **Facilitator**: Coinbase x402 facilitator (`stellar:testnet`, sponsored fees)
- **AI/ML**: Custom fraud detection engine with pattern matching

## Features

### Fraud Detection Engine
- 16+ sophisticated scam pattern detection
- Heuristic scoring system (0-100)
- Multi-layer analysis: URL, wallet, email, behavioral patterns
- Real-time threat level assessment (LOW, MEDIUM, HIGH, CRITICAL)

### x402 Payment Integration
- **Real on-chain payments** (x402 v2): 402 → sign auth entry → facilitator verify + settle → analysis
- Stellar testnet USDC (SEP-41); fees sponsored by the Coinbase facilitator
- Real `txHash` persisted per payment via the `onAfterSettle` hook
- Browser payments (testnet secret signing) + agent payments (CLI)
- Demo mode (`X402_MODE=demo`) preserved for offline demos

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

## Real x402 payments (live mode)

POST `/api/analyze` is protected by **real** x402 (protocol v2) on `stellar:testnet`:

1. `POST /api/analyze` without payment → `402` + `payment-required` header (base64 JSON with `accepts`: amount, USDC contract, `payTo`, `areFeesSponsored: true`)
2. The client signs a **Soroban auth entry** for a USDC transfer (`exact` scheme)
3. The **Coinbase x402 facilitator** verifies and settles **on-chain** (fees sponsored)
4. The route returns the analysis; the real `txHash` is stored in the DB by the `onAfterSettle` hook

Configuration lives in `.env` (`X402_MODE`, `X402_NETWORK`, `X402_PRICE`, `X402_PAY_TO`, `X402_FACILITATOR_URL`, optional `X402_ASSET_CONTRACT` for non-USDC assets). See `.env.example`.

### Agent integration (5 lines)

```ts
import { x402Client } from "@x402/core/client";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { createEd25519Signer } from "@x402/stellar";
import { wrapFetchWithPayment } from "@x402/fetch";

const client = new x402Client().register("stellar:testnet", new ExactStellarScheme(createEd25519Signer(SECRET, "stellar:testnet")));
const fetchWithPay = wrapFetchWithPayment(fetch, client);

const res = await fetchWithPay("https://sentinelx402.netlify.app/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "http://bit.ly/free-xlm-giveaway" }),
});
const analysis = await res.json(); // riskScore, threatLevel, prediction…
```

### CLI: pay for a real analysis

```bash
# one-time testnet setup (custom TUSDC SEP-41 token via a real Soroban SAC contract,
# funded via friendbot — no Circle faucet needed for e2e tests)
node scripts/setup-testnet.mjs

# pay 0.01 per request, for real
CLIENT_PRIVATE_KEY=S... node scripts/agent-client.mjs \
  http://localhost:3111/api/analyze '{"url":"http://bit.ly/free-xlm-giveaway"}'
```

> The agent **never pays blindly**: it validates every payment requirement before signing
> (pay-to allow-list via `X402_ALLOWED_PAY_TO`, spend cap via `X402_MAX_SPEND`, asset
> allow-list) with a `registerPolicy` hook, and maps failures to friendly messages
> (insufficient balance, expired authorization, replay/double-charge).

### Hashes de prueba (Stellar testnet)

Pagos **reales, on-chain**, verificables en [stellar.expert](https://stellar.expert/explorer/testnet):

| Hash | Origen | Monto | Resultado |
|---|---|---|---|
| [`b2c6739a876a10ef8ffbbf58ceaf9c24f17cd3117601e21bac86198f587a6bae`](https://stellar.expert/explorer/testnet/tx/b2c6739a876a10ef8ffbbf58ceaf9c24f17cd3117601e21bac86198f587a6bae) | Agente CLI (`scripts/agent-client.mjs`) | 0.01 TUSDC (100000 atomic) | Análisis de fraude devuelto tras el pago |
| [`263e31bc22f0bcc1d049dde93c2c309d19c61556ceb214433301bdc46dfeb29b`](https://stellar.expert/explorer/testnet/tx/263e31bc22f0bcc1d049dde93c2c309d19c61556ceb214433301bdc46dfeb29b) | UI del navegador (firma in-browser) | 0.01 TUSDC (100000 atomic) | Riesgo 57/MEDIUM devuelto tras el pago |

Ambos son transferencias SAC (`transfer` event) del contrato TUSDC
[`CCIDIQ56ZRGTTSPEALP6LK6IET4PF24TPW743XPL6R767SKMJHREGFTE`](https://stellar.expert/explorer/testnet/contract/CCIDIQ56ZRGTTSPEALP6LK6IET4PF24TPW743XPL6R767SKMJHREGFTE)
del emisor cliente `GDQP…BNHZ` al servicio `GCNC…KFGW`, liquidadas por el facilitador x402 de
Coinbase (`https://www.x402.org/facilitator`) con fees patrocinados. El flujo con USDC real de
Circle usa el mismo código con el contrato `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`.

### Verificar un recibo on-chain

El verificador consulta la transacción por hash con **Stellar RPC** (`getTransaction`), decodifica
el evento `transfer` del contrato y valida **activo, monto y destinatario** antes de aceptar el
recibo. Un hash nunca se acepta dos veces (protección anti-replay):

```bash
node scripts/verify-payment.mjs b2c6739a876a10ef8ffbbf58ceaf9c24f17cd3117601e21bac86198f587a6bae \
  --asset CCIDIQ56ZRGTTSPEALP6LK6IET4PF24TPW743XPL6R767SKMJHREGFTE \
  --payTo GCNCKN6ZKZB2FZAVPVEU3B2RA6ETYHUDFXU473CUGBJD2U7LG4OEKFGW \
  --amount 100000
# → ✓ VERIFIED receipt … (asset / from / to / amount)
```

Rechazos cubiertos y probados (22 tests unitarios en `__tests__/x402-verify.test.ts`): activo
incorrecto, destinatario incorrecto, monto incorrecto y hash repetido (replay).

### Demo y pitch (3 min)

**Demo (60–90 s):** ① abrir la UI, pegar una URL de scam, ver el `402` con los requisitos de pago
en la consola de red → ② firmar y pagar 0.01 con la wallet de testnet → recibir el análisis con
riesgo y el hash real enlazado a stellar.expert → ③ repetir desde la terminal con
`scripts/agent-client.mjs` (agente autónomo) → ④ verificar el recibo con
`scripts/verify-payment.mjs` y mostrar un rechazo de replay.

**Pitch (3 min):**
- **Problema (45 s):** cada fraude cuesta dinero y cada API de seguridad cobra suscripciones
  fijas; los agentes de IA y las apps pequeñas no pueden pagar un SaaS por API-call.
- **Usuario (60 s):** cualquier app o agente que necesite verificar una URL/mensaje/wallet
  sospechosa: paga 0.01 por análisis con USDC en Stellar, sin cuenta, sin suscripción,
  sin tarjetas — solo HTTP y x402.
- **Por qué Stellar (30 s):** fees de centavos patrocinados por el facilitador, autorización de
  pago nativa (auth entry) y liquidación on-chain verificable por hash.
- **Siguiente paso (45 s):** (1) USDC real de Circle en mainnet, (2) plan de sprint para el track
  "Agente que paga" (tope de gasto persistente, smart accounts) y el track "Verificación de
  pagos" (verificador por hash como servicio, ya prototipado en `scripts/verify-payment.mjs`),
  (3) marketplace de análisis por lotes para agentes.

### Wallets for x402 (auth-entry signing)

Varial, Hana, HOT, Klever, OneKey, Scopuly (per the
[Stellar x402 docs](https://developers.stellar.org/docs/build/agentic-payments/x402)).
The bundled analyzer UI also supports testnet secret-key signing in-browser.

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
    x402.ts             # x402 demo-mode (simulated) payment utilities
    x402-live.ts        # REAL x402 v2 integration (@x402/stellar, facilitator, settlement hook)
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
