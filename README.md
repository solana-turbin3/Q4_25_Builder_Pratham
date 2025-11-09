# Q4_25_Builder_Pratham

My PoWs during the Q4 2025 Solana builder's cohort here in Turbin3.

## Overview

This repository contains my work throughout the Q4 2025 Solana Builder's Cohort. All projects are organized in the root directory, showcasing my progress and learning journey in Solana development.

## Projects

### [Week 0](week-0/): Rust & TypeScript Prerequisites
- **Rust Prerequisites Tutorial**: [Rust_Prerequisites_Tutorial.pdf](week-0/Rust_Prerequisites_Tutorial.pdf)
- **TypeScript Prerequisites Tutorial**: [TS_Prerequisites_Tutorial.docx.pdf](week-0/TS_Prerequisites_Tutorial.docx.pdf)
- **Airdrop Program**: Basic Solana program for airdropping tokens
  - [Source Code](week-0/airdrop/)
- **Airdrop Program 2**: Enhanced airdrop functionality in Rust
 - [Source Code](week-0/airdrop2/)

### Solana Fundamentals
- **[Solana Starter](solana-starter/)**: Complete Solana development starter kit (Git Submodule)
 - Includes Rust and TypeScript implementations
  - Covers NFT creation, SPL tokens, and vault operations

### Anchor Framework
- **[Anchor Escrow](anchor-escrow/)**: Smart contract for token swaps with escrow functionality (Git Submodule)
  - Implements make/take/refund escrow patterns
- **[Anchor Vault](anchor-vault/)**: Secure vault program for asset storage (Git Submodule)

### Advanced Anchor Development
- **[Anchor AMM](anchor-amm-starter-q4-25/)**: Automated Market Maker implementation (Git Submodule)
- **[Anchor MPL Core](anchor-mplxcore-starter-q4-25/)**: Metaplex Core functionality implementation (Git Submodule)
  - Includes NFT collection management and creator whitelisting

### Gaming & Staking Applications
- **[Dice Game](anchor-dice-game-starter-q4-25/)**: On-chain dice game with betting functionality (Git Submodule)
- **[NFT Staking](anchor-nft-staking-starter-q4-25/)**: NFT staking program with rewards (Git Submodule)

## [Capstone Project](capstone/)

Work in progress - Advanced Solana application combining concepts learned throughout the cohort.

## Technologies Used

- **Rust**: Smart contract development
- **TypeScript**: Client-side applications and tests
- **Anchor**: Solana framework for smart contract development
- **Solana CLI**: Solana blockchain interaction tools
- **SPL Tokens**: Solana Program Library tokens
- **Metaplex**: NFT and digital asset standards

## Git Submodule Management

This repository uses Git submodules to manage individual project repositories. The following projects are integrated as submodules:

- `solana-starter`
- `anchor-escrow`
- `anchor-vault`
- `anchor-amm-starter-q4-25`
- `anchor-mplxcore-starter-q4-25`
- `anchor-dice-game-starter-q4-25`
- `anchor-nft-staking-starter-q4-25`

### Working with Submodules

To clone this repository with all submodules:
```bash
git clone --recursive https://github.com/pantha704/q4-2025.git
```

To initialize and update submodules after cloning:
```bash
git submodule init
git submodule update
```

To pull latest changes from all submodules:
```bash
git submodule foreach git pull origin main
```

## Prerequisites

- Solana CLI tools installed
- Anchor CLI (version 0.32.1 or later) installed via AVM
- Node.js and Yarn for client-side development
- Rust and Cargo for smart contract development

## Getting Started

Each project directory contains its own README with specific setup instructions. Clone this repository and navigate to the project of interest to get started.

To work with this repository:

1. Clone with submodules:
   ```bash
   git clone --recursive https://github.com/pantha704/q4-2025.git
   ```

2. Navigate to any project directory and follow the specific README instructions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
