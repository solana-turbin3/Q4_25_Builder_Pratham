# Q4_25_Builder_Pratham

My PoWs during the Q4 2025 Solana builder's cohort here in Turbin3.

## Overview

This repository contains my work throughout the Q4 2025 Solana Builder's Cohort. Each week's projects are organized in their respective directories, showcasing my progress and learning journey in Solana development.

## Weekly Progress

### [Week 0](week-0/): Rust & TypeScript Prerequisites
- **Rust Prerequisites Tutorial**: [Rust_Prerequisites_Tutorial.pdf](week-0/Rust_Prerequisites_Tutorial.pdf)
- **TypeScript Prerequisites Tutorial**: [TS_Prerequisites_Tutorial.docx.pdf](week-0/TS_Prerequisites_Tutorial.docx.pdf)
- **Airdrop Program**: Basic Solana program for airdropping tokens
  - [Source Code](week-0/airdrop/)
- **Airdrop Program 2**: Enhanced airdrop functionality in Rust
 - [Source Code](week-0/airdrop2/)

### [Week 1](week-1/): Solana Fundamentals
- **Solana Starter**: Complete Solana development starter kit
  - [Repository](week-1/solana-starter/) (Git Submodule)
  - Includes Rust and TypeScript implementations
  - Covers NFT creation, SPL tokens, and vault operations

### [Week 2](week-2/): Anchor Framework
- **Anchor Escrow**: Smart contract for token swaps with escrow functionality
  - [Repository](week-2/anchor-escrow/) (Git Submodule)
  - Implements make/take/refund escrow patterns
- **Anchor Vault**: Secure vault program for asset storage
 - [Repository](week-2/anchor-vault/) (Git Submodule)

### [Week 3](week-3/): Advanced Anchor Development
- **Anchor AMM**: Automated Market Maker implementation
 - [Repository](week-3/anchor-amm-starter-q4-25/) (Git Submodule)
- **Anchor MPL Core**: Metaplex Core functionality implementation
  - [Repository](week-3/anchor-mplxcore-starter-q4-25/) (Git Submodule)
  - Includes NFT collection management and creator whitelisting

### [Week 4](week-4/): Gaming & Staking Applications
- **Dice Game**: On-chain dice game with betting functionality
  - [Repository](week-4/anchor-dice-game-starter-q4-25/) (Git Submodule)
- **NFT Staking**: NFT staking program with rewards
  - [Repository](week-4/anchor-nft-staking-starter-q4-25/) (Git Submodule)

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

- `week-1/solana-starter`
- `week-2/anchor-escrow`
- `week-2/anchor-vault`
- `week-3/anchor-amm-starter-q4-25`
- `week-3/anchor-mplxcore-starter-q4-25`
- `week-4/anchor-dice-game-starter-q4-25`
- `week-4/anchor-nft-staking-starter-q4-25`

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
