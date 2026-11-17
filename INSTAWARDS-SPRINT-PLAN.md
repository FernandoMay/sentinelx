# SentinelX — Plan de sprint Instawards (tracks Agente que paga + Verificación de pagos)

> SentinelX compite en el bootcamp x402 de Stellar Apex en el track **API de pago (x402)**.
> Los otros dos tracks del bootcamp (**Agente que paga** y **Verificación de pagos**) se
> implementan en el próximo sprint de Instawards. Este documento mapea el trabajo ya existente
> contra los 5 criterios de cada track y define lo que falta.

---

## Estado actual (base que ya existe)

| Pieza | Archivo | Estado |
|---|---|---|
| Agente pagador con `@x402/fetch` | `scripts/agent-client.mjs` | ✅ Paga real en testnet (hash `b2c6739a…`) |
| Policy de seguridad (allowlist payTo + tope de gasto) | `scripts/agent-client.mjs` | ✅ `registerPolicy` con `X402_ALLOWED_PAY_TO`, `X402_MAX_SPEND` |
| Verificador on-chain por hash | `scripts/verify-payment.mjs` | ✅ RPC `getTransaction` + evento SAC `transfer` |
| Validación pura (activo/monto/destinatario/replay) | `src/lib/x402-verify.ts` | ✅ 22 tests unitarios |
| Errores amigables (saldo, expiración, replay) | `scripts/agent-client.mjs` | ✅ |
| Server anti doble cobro | `src/lib/x402-live.ts` (`onAfterSettle`) | ✅ guard por `txHash` |

---

## Track 1 — "Agente que paga (x402)"

**Criterio 1 · Commits por sesión (30%)** — los 15 commits del temario (3 por sesión) en el repo
del equipo, con el tipo y contenido de cada sesión. *Falta: alinear con el temario real cuando se
publique; la base (agent-client, policy, docs) ya está commiteada.*

**Criterio 2 · Pago x402 del agente (20%)** — el agente llama a una API x402 con `@x402/fetch`,
paga en USDC desde su wallet dedicada y obtiene la respuesta; hashes reales en stellar.expert.
- ✅ Ya funciona: `scripts/agent-client.mjs` paga 0.01 real →
  [`b2c6739a…`](https://stellar.expert/explorer/testnet/tx/b2c6739a876a10ef8ffbbf58ceaf9c24f17cd3117601e21bac86198f587a6bae)
- 🔜 Sprint: pasar de TUSDC a **USDC real de Circle** (faucet), demo con 2 APIs distintas para
  mostrar reutilización, log estructurado del recibo (hash + monto + receptor).

**Criterio 3 · Integración Stellar del agente (15%)** — wallet dedicada con trustline USDC,
contrato USDC `C…`, emisor `G…` en la trustline, red `stellar:testnet`. **Suma si usa smart
accounts.**
- ✅ Wallet dedicada del agente con trustline (setup en `scripts/setup-testnet.mjs`).
- 🔜 Sprint: smart account del agente (SAC + auth de umbrales o sesión) para firmar pagos sin
  exponer la S-key; migrar `setup-testnet.mjs` a USDC real (faucet.circle.com).

**Criterio 4 · Tope de gasto y errores (20%)** — tope que rechaza pagos al superarlo; saldo
insuficiente, autorización expirada y reintentos sin pagar a ciegas; sin secretos en el repo.
- ✅ Tope de gasto por pago (`X402_MAX_SPEND`) vía `registerPolicy`.
- 🔜 Sprint: **tope de gasto persistente** (presupuesto diario/semanal guardado en la DB con
  acumulado por wallet del agente), suite de tests de rechazo del policy, test e2e que agote el
  presupuesto y confirme el rechazo, rotación de secretos por env en despliegue.

**Criterio 5 · Documentación y pitch (15%)** — README con cómo correrlo, hashes de prueba y pitch
de 3 min.
- ✅ README ya documenta el agente (integración en 5 líneas, CLI, hashes, seguridad).
- 🔜 Sprint: página/README propio del agente + pitch regrabado centrado en el agente autónomo.

---

## Track 2 — "Verificación de pagos"

**Criterio 1 · Commits por sesión (30%)** — ídem track 1 (alinear con temario real).

**Criterio 2 · Pagos x402 verificados (15%)** — pagos reales en testnet que el verificador
revisa; hashes en el README y abribles en stellar.expert.
- ✅ Dos hashes verificados con éxito:
  [`b2c6739a…`](https://stellar.expert/explorer/testnet/tx/b2c6739a876a10ef8ffbbf58ceaf9c24f17cd3117601e21bac86198f587a6bae)
  y
  [`263e31bc…`](https://stellar.expert/explorer/testnet/tx/263e31bc22f0bcc1d049dde93c2c309d19c61556ceb214433301bdc46dfeb29b)

**Criterio 3 · Verificación on-chain correcta (25%)** — consulta por hash con Stellar RPC
(`getTransaction`) y valida contrato USDC, monto y destinatario antes de aceptar el recibo.
- ✅ `scripts/verify-payment.mjs`: RPC `getTransaction` → decodifica evento `transfer` del SAC →
  valida activo (contrato `C…`), destinatario (`G…`) y monto atómico exacto.
- 🔜 Sprint: convertirlo en **servicio** (`GET /api/verify?tx=…` sobre `src/lib/x402-verify.ts`)
  para que terceros verifiquen recibos de SentinelX vía HTTP, con `stellar.expert` como fallback
  de visualización.

**Criterio 4 · Rechazos y seguridad (15%)** — rechaza monto, destinatario o activo incorrecto con
tests; no acepta un hash dos veces; sin secretos en el repo.
- ✅ 22 tests unitarios de `validateTransfer`/`validatePaymentRequirements`/`assertHashNotSeen`;
  replay rechazado (archivo de estado `.x402-verified.json` + tests case-insensitive).
- 🔜 Sprint: mover el replay-protection del archivo de estado a la DB (`Payment.txHash` unique
  index), tests de rechazo sobre el endpoint `/api/verify`, fuzz básico de XDR malformado.

**Criterio 5 · README y pitch final (15%)** — ídem track 1; el pitch final incluirá la demo del
verificador rechazando un recibo manipulado.

---

## Orden de trabajo sugerido (sprint ~2 semanas)

1. **D1–D2:** USDC real de Circle en testnet (faucet) + migrar setup/scripts/README de TUSDC.
2. **D3–D5:** Tope de gasto persistente del agente (DB) + tests del policy + test e2e de agotamiento.
3. **D6–D8:** Servicio `/api/verify` con replay en DB (unique index) + tests de rechazo del endpoint.
4. **D9–D10:** Smart account del agente (opcional, suma puntos) + hardening de secretos.
5. **D11–D12:** Grabar demos separadas por track + regenerar hashes con USDC real + pitch final.
6. **Continuo:** 3 commits por sesión alineados al temario cuando se publique.
