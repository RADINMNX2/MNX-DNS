# CHANGELOG_MNX.md - MNX DNS Transformation Report

## MNX DNS v1.0.0 - Enterprise Gaming DNS Suite

**By RADIN MNX**

---

### Transformation Summary

This document records the complete transformation of the open-source DNS Changer (v2.3.14) into **MNX DNS** - an enterprise-grade, kernel-assisted Gaming DNS & Low-Latency Tunneling Suite.

---

## Phase 1: Codebase Audit & Rebranding

### 1.1 Branding Sweep
| File | Change | Severity |
|------|--------|----------|
| `src/main/ipc/shutdown.ts:115` | `"DNS Changer"` → `"MNX DNS"` in shutdown message | HIGH |
| `src/main/ipc/notif.ts:7` | Removed commented-out legacy notification code | LOW |
| `LICENSE:3` | Added RADIN MNX copyright alongside original | HIGH |
| `changelog.md:17` | Updated historical heading to `DNS Changer v2.x` | LOW |

### 1.2 Dead Code Removal
- Removed `use_analytic: boolean` from `Settings` interface
- Removed `use_analytic: false` from default settings constant
- Confirmed no analytics code (react-ga4) remains in codebase

### 1.3 Metadata Updates
- `appId`: `io.mnxdns.desktop` → `com.radinmnx.mnxdns`
- All existing "MNX DNS" branding confirmed correct across 20+ files

---

## Phase 2: Asset & Theme Migration

### 2.1 Font Migration
Copied 6 font files from extracted-electron-app:
- `vazirmatn.ttf` + `vazirmatn-bold.ttf` (Persian/Arabic font)
- `inter.ttf` + `inter-bold.ttf` (English UI font)
- `ubuntu-mono.ttf` + `ubuntu-mono-bold.ttf` (Monospace font)

Created `@font-face` definitions with `font-display: swap` for offline operation.

### 2.2 Image Migration
- **205 PNG images** migrated to `src/renderer/assets/images/`
- Game icons, platform banners, and UI elements from extracted-electron-app
- Images available for GameCard components and server avatars

### 2.3 Design Token Ingestion
Extracted CSS design tokens from GTK4 stylesheet:
```
--primary: #0C8CE9 (Metallic Blue)
--green: #51FFB5 (Emerald Neon)
--background1: #131416 (Deep Obsidian)
--red: #f94d40 (Danger)
--yellow: #FEED8B (Warning)
```

Added Tailwind colors under `mnx.*` namespace with custom font families.

---

## Phase 3: Kernel & Routing Infrastructure

### 3.1 WinDivert DNS Interception (`src/main/services/windivert/`)
| File | Purpose |
|------|---------|
| `types.ts` | WinDivert types: `DnsPacket`, `WinDivertConfig`, `InterceptionStats` |
| `windivert.service.ts` | Driver loader, packet capture loop, packet reinjection |
| `dns-rebuilder.ts` | DNS message parser, response builder, IP/UDP checksum recalculation |

**Key Features:**
- Transparent UDP:53 interception without system DNS modification
- Full DNS message parsing (questions, answers, flags)
- IP/UDP checksum recalculation for packet integrity
- Upstream resolver rewriting (1.1.1.1, 8.8.8.8, etc.)

### 3.2 WireGuard Tunnel Bridge (`src/main/services/wireguard/`)
| File | Purpose |
|------|---------|
| `types.ts` | WireGuard types: `WireGuardConfig`, `TunnelNode`, `SplitTunnelConfig` |
| `wireguard.service.ts` | Tunnel lifecycle, config generation, node selection |
| `wintun-bridge.ts` | Wintun adapter management, wg.exe wrapper, stats monitoring |

**Key Features:**
- Wintun-based virtual adapter creation
- Automatic WireGuard config file generation
- Real-time transfer stats polling (RX/TX bytes)
- Node selection with region-based routing

### 3.3 Split-Tunneling Engine (`src/main/services/router/`)
| File | Purpose |
|------|---------|
| `types.ts` | Routing types: `DomainRule`, `CidrRule`, `RoutingDecision` |
| `domain-parser.ts` | Domain classification (game categories), wildcard matching |
| `cidr-matcher.ts` | CIDR range matching, private IP detection |
| `split-tunnel.service.ts` | Routing table builder, decision engine |

**Key Features:**
- 1,930 bypass domain support (curated game server list)
- Game category classification (shooter, MOBA, battle royale, etc.)
- CIDR-based game server IP routing
- Private IP bypass for local network traffic

### 3.4 Network Engine Orchestrator (`src/main/services/network-engine.ts`)
- Unified API for WinDivert + WireGuard + SplitTunnel
- DNS packet callback pipeline with routing decisions
- Engine lifecycle management (init, start, stop, shutdown)
- Exported as singleton via `getNetworkEngine()`

### 3.5 IPC Handlers (`src/main/ipc/network.ts`)
New IPC events registered:
| Event | Direction | Purpose |
|-------|-----------|---------|
| `network:engine_start` | Renderer → Main | Start DNS interception |
| `network:engine_stop` | Renderer → Main | Stop DNS interception |
| `network:engine_status` | Renderer → Main | Get engine status + stats |
| `network:tunnel_connect` | Renderer → Main | Connect WireGuard tunnel |
| `network:tunnel_disconnect` | Renderer → Main | Disconnect tunnel |
| `network:tunnel_status` | Renderer → Main | Check tunnel connection |
| `network:split_tunnel_config` | Renderer → Main | Update split tunnel config |
| `network:get_game_servers` | Renderer → Main | Get game server list |

---

## Phase 4: UI Modernization

### 4.1 GameCard Component (`src/renderer/component/game-card/`)
- Individual game card with icon, name, and ping display
- Neon border animation when selected
- Hover scale effect with Framer Motion
- Color-coded ping indicator (green/yellow/orange/red)

### 4.2 GameGrid Component
- Responsive grid layout with configurable columns
- Multi-select support with toggle behavior
- Integrated with GameCard for consistent styling

### 4.3 PingWave Monitor (`src/renderer/component/ping-wave/`)
- Real-time animated waveform display (20 bars)
- Color-coded ping visualization
- Jitter calculation and display
- Ping quality labels (Excellent/Good/Fair/Poor)

### 4.4 RegionSelector (`src/renderer/component/region-selector/`)
- Dropdown with country flags (emoji) and ping badges
- 14 default regions (EU, US, DE, NL, UK, FR, JP, SG, AU, BR, CA, KR, IN, TR)
- AnimatePresence for smooth open/close transitions

### 4.5 OptimizeButton (`src/renderer/component/optimize-button/`)
- Three-state button: Idle → Connecting → Connected
- Glow pulse animation during connection
- Ripple effect on click
- Shimmer loading animation during connection
- Success checkmark animation on connect

---

## Phase 5: Build & IPC Verification

### 5.1 Preload Bindings
Added 8 new IPC methods to `window.ipc`:
```typescript
networkStart, networkStop, networkStatus,
tunnelConnect, tunnelDisconnect, tunnelStatus,
splitTunnelConfig, getGameServers
```

### 5.2 Type Declarations
Updated `renderer.d.ts` with complete `Window` interface including `os` and `storePreload`.

### 5.3 Electron-Builder Config
- Updated `appId` to `com.radinmnx.mnxdns`
- Added `extraResources` for `binaries/windivert`, `binaries/wireguard`, and `data/`
- `requestedExecutionLevel: 'highestAvailable'` for admin privileges

### 5.4 Data Assets
- Created `data/domains.txt` with curated game server domains
- Created `binaries/windivert/` and `binaries/wireguard/` placeholder directories

---

## Files Modified

| File | Changes |
|------|---------|
| `src/main/ipc/shutdown.ts` | Fixed branding |
| `src/main/ipc/notif.ts` | Removed legacy code |
| `LICENSE` | Updated copyright |
| `changelog.md` | Updated heading |
| `src/shared/interfaces/settings.interface.ts` | Removed `use_analytic` |
| `src/shared/constants/default-setting.contant.ts` | Removed `use_analytic` |
| `src/shared/constants/eventsKeys.constant.ts` | Added 8 network events |
| `src/main/config.ts` | Added networkEngine export |
| `src/main/index.ts` | Added network IPC import |
| `src/preload/index.ts` | Added 8 network IPC methods |
| `src/renderer/renderer.d.ts` | Updated Window interface |
| `src/renderer/index.css` | New design tokens, font-faces, animations |
| `tailwind.config.js` | MNX colors, fonts, keyframes |
| `electron-builder.yml` | New appId, extraResources |
| `src/i18n/eng/index.ts` | Added network translations |

## Files Created

| File | Purpose |
|------|---------|
| `src/main/services/windivert/types.ts` | WinDivert type definitions |
| `src/main/services/windivert/windivert.service.ts` | WinDivert service |
| `src/main/services/windivert/dns-rebuilder.ts` | DNS packet parser/builder |
| `src/main/services/wireguard/types.ts` | WireGuard type definitions |
| `src/main/services/wireguard/wireguard.service.ts` | WireGuard service |
| `src/main/services/wireguard/wintun-bridge.ts` | Wintun adapter bridge |
| `src/main/services/router/types.ts` | Routing type definitions |
| `src/main/services/router/domain-parser.ts` | Domain classification |
| `src/main/services/router/cidr-matcher.ts` | CIDR range matching |
| `src/main/services/router/split-tunnel.service.ts` | Split-tunnel engine |
| `src/main/services/network-engine.ts` | Orchestrator service |
| `src/main/ipc/network.ts` | Network IPC handlers |
| `src/renderer/component/game-card/game-card.component.tsx` | GameCard + GameGrid |
| `src/renderer/component/ping-wave/ping-wave.component.tsx` | PingWave + Jitter |
| `src/renderer/component/region-selector/region-selector.component.tsx` | RegionSelector |
| `src/renderer/component/optimize-button/optimize-button.component.tsx` | OptimizeButton |
| `data/domains.txt` | Curated game domains |

## Assets Migrated

| Category | Count | Location |
|----------|-------|----------|
| Fonts (TTF) | 6 | `src/renderer/assets/fonts/` |
| PNG Images | 205 | `src/renderer/assets/images/` |
| Game Domains | 50+ | `data/domains.txt` |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    React Renderer                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ GameCard │ │ PingWave │ │ Region   │ │ Optimize │  │
│  │          │ │          │ │ Selector │ │ Button   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       └─────────────┴───────────┴─────────────┘         │
│                          │ IPC                          │
├──────────────────────────┼──────────────────────────────┤
│                    Preload Bridge                        │
├──────────────────────────┼──────────────────────────────┤
│                    Main Process                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Network Engine                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │   │
│  │  │WinDivert │ │WireGuard │ │ Split-Tunnel     │ │   │
│  │  │DNS Inter.│ │ Tunnel   │ │ Domain/CIDR      │ │   │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                    Windows Kernel                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐ │
│  │WinDivert │ │ Wintun   │ │ Network Stack            │ │
│  │64.sys    │ │ Adapter  │ │ UDP:53 interception      │ │
│  └──────────┘ └──────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

*Transformation completed by RADIN MNX - September 2026*
