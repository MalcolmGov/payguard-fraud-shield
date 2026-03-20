# PayGuard SDK

> Real-time fraud detection for payments — built for Africa.

[![npm version](https://img.shields.io/npm/v/@payguard/sdk.svg)](https://www.npmjs.com/package/@payguard/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @payguard/sdk
```

## Quick Start

```typescript
import payguard from '@payguard/sdk';

// 1. Initialize (once at app startup)
await payguard.initialize({
  apiKey: 'pk_sandbox_your_key_here',
  environment: 'sandbox',
});

// 2. Monitor payment input fields (optional — enhances detection)
const cleanup = payguard.monitorInput(document.getElementById('amount-input'));

// 3. Assess risk before payment confirmation
const result = await payguard.assessRisk({
  transactionId: 'TXN-2026-001234',
  amount: 15000.00,
  currency: 'ZAR',
  channel: 'mobile_banking',
  paymentMethod: 'eft',
  customerId: 'CUST-98765',
});

// 4. Act on the decision
switch (result.decision) {
  case 'ALLOW':
    proceedWithPayment();
    break;
  case 'WARN':
    showWarningDialog(result.warningMessage);
    break;
  case 'BLOCK':
    blockTransaction(result.blockReason);
    break;
}
```

## Features

| Feature | Description |
|---------|-------------|
| **Risk Assessment** | Real-time ALLOW / WARN / BLOCK decisions in < 100ms |
| **Device Fingerprinting** | Canvas, WebGL, audio, hardware — identifies unique devices |
| **Bot Detection** | Detects Selenium, Puppeteer, PhantomJS, headless browsers |
| **Behavioural Signals** | Paste events, keystroke cadence, rapid form completion |
| **Anomaly Detection** | Iframe embedding, screen recording, DevTools, Tor browser |
| **Shadow Mode** | Observe-only mode for PoC pilots — logs but never blocks |
| **Fail-Open** | Never blocks payments due to SDK errors or network issues |
| **TypeScript** | Full type definitions included |

## Shadow Mode (PoC Pilots)

For proof-of-concept testing, enable shadow mode to record decisions without affecting users:

```typescript
await payguard.initialize({
  apiKey: 'pk_live_your_key',
  environment: 'production',
  shadowMode: true, // Logs decisions but NEVER blocks
});
```

In shadow mode, `assessRisk()` always returns `ALLOW` but logs the real decision to your PayGuard dashboard. Perfect for comparing PayGuard against your existing fraud system.

## Configuration

```typescript
await payguard.initialize({
  apiKey: 'pk_sandbox_...',          // Required
  environment: 'sandbox',            // 'sandbox' or 'production'
  shadowMode: false,                 // true = observe only
  timeout: 5000,                     // API timeout (ms)
  failOpen: true,                    // ALLOW on errors (recommended)
  logLevel: 'warn',                  // 'debug' | 'info' | 'warn' | 'error' | 'none'
  signals: {
    deviceFingerprint: true,         // Collect device fingerprint
    pasteDetection: true,            // Detect clipboard paste events
    keystrokeCadence: true,          // Monitor typing patterns
    screenCapture: true,             // Detect screen recording
    iframeDetection: true,           // Detect iframe embedding
    botDetection: true,              // Detect automation tools
  },
});
```

## Reporting Outcomes

Report transaction outcomes to improve fraud model accuracy:

```typescript
// Transaction completed successfully
await payguard.reportOutcome({
  transactionId: 'TXN-2026-001234',
  outcome: 'completed',
});

// Fraud was confirmed later
await payguard.reportOutcome({
  transactionId: 'TXN-2026-001234',
  outcome: 'fraud_confirmed',
  fraudType: 'social_engineering',
});
```

## Signals Collected

| Signal | Category | Description |
|--------|----------|-------------|
| `WEBDRIVER_DETECTED` | Bot | Browser automation tool detected |
| `SELENIUM_DETECTED` | Bot | Selenium WebDriver detected |
| `CHROME_HEADLESS_SUSPECT` | Bot | Headless Chrome indicators |
| `RUNNING_IN_IFRAME` | Environment | Page loaded inside an iframe |
| `DEVTOOLS_LIKELY_OPEN` | Environment | Browser DevTools appears open |
| `CANVAS_BLOCKED` | Privacy | Canvas fingerprinting blocked (Tor) |
| `SLOW_EXECUTION_SUSPECT` | Device | Unusually slow JS execution (VM/emulator) |
| `PASTE_EVENT` | Behaviour | Account number pasted from clipboard |
| `RAPID_FORM_COMPLETION` | Behaviour | Form completed in under 3 seconds |
| `UNUSUAL_KEYSTROKE_CADENCE` | Behaviour | Non-human typing pattern detected |

## React Integration

```tsx
import payguard from '@payguard/sdk';
import { useEffect, useRef } from 'react';

function PaymentForm() {
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (amountRef.current) {
      const cleanup = payguard.monitorInput(amountRef.current);
      return cleanup;
    }
  }, []);

  const handleSubmit = async () => {
    const result = await payguard.assessRisk({
      transactionId: `TXN-${Date.now()}`,
      amount: 15000,
      currency: 'ZAR',
    });

    if (result.decision === 'BLOCK') {
      alert('Transaction blocked for security reasons.');
      return;
    }

    // Proceed with payment...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={amountRef} type="number" placeholder="Amount" />
      <button type="submit">Pay Now</button>
    </form>
  );
}
```

## Server-Side (Node.js)

```typescript
import { PayGuardClient } from '@payguard/sdk';

const payguard = new PayGuardClient();
await payguard.initialize({
  apiKey: 'pk_live_your_key',
  environment: 'production',
  signals: { deviceFingerprint: false }, // No DOM on server
});

// Server-to-server risk assessment
const result = await payguard.assessRisk({
  transactionId: req.body.txnId,
  amount: req.body.amount,
  currency: 'ZAR',
  customerId: req.user.id,
});
```

## Links

- **Dashboard:** [payguard.africa](https://payguard.africa)
- **Sandbox:** [payguard.africa/sandbox](https://payguard.africa/sandbox)
- **API Docs:** [payguard.africa/developers](https://payguard.africa/developers)
- **Live Demo:** [payguard.africa/demo](https://payguard.africa/demo)

## License

MIT © [Swifter Technologies (Pty) Ltd](https://swifter.co.za)
