use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};
use constant_product_curve::ConstantProduct;

use crate::{errors::AmmError, state::Config};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,
    #[account(
        has_one = mint_x,
        has_one = mint_y,
        seeds = [b"config", config.seed.to_le_bytes().as_ref()],
        bump = config.config_bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = config,
    )]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = config,
    )]
    pub vault_y: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = user,
    )]
    pub user_x: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = user,
    )]
    pub user_y: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Swap<'info> {
    pub fn swap(
        &mut self,
        is_x: bool, // If true, swap X for Y; if false, swap Y for X
        amount_in: u64,
        min_amount_out: u64,
    ) -> Result<()> {
        require!(self.config.locked == false, AmmError::PoolLocked);
        require!(amount_in > 0, AmmError::InvalidAmount);

        // Calculate the amount out based on the constant product formula
        let (vault_in_amount, vault_out_amount) = if is_x {
            (self.vault_x.amount, self.vault_y.amount)
        } else {
            (self.vault_y.amount, self.vault_x.amount)
        };

        // Calculate the amount out using the constant product formula with fee
        let fee_amount = (amount_in as u128)
            .checked_mul(self.config.fee as u128)
            .ok_or(AmmError::Overflow)?
            .checked_div(10000u128)
            .ok_or(AmmError::Underflow)?;
        let amount_in_after_fee = (amount_in as u128)
            .checked_sub(fee_amount)
            .ok_or(AmmError::Underflow)?;
        let new_vault_in_amount = (vault_in_amount as u128)
            .checked_add(amount_in_after_fee)
            .ok_or(AmmError::Overflow)?;
        let new_vault_out_amount = ((vault_out_amount as u128)
            .checked_mul(vault_in_amount as u128)
            .ok_or(AmmError::Overflow)?)
            .checked_div(new_vault_in_amount)
            .ok_or(AmmError::Underflow)?;
        let amount_out = (vault_out_amount as u128)
            .checked_sub(new_vault_out_amount)
            .ok_or(AmmError::Underflow)?;

        require!(amount_out >= min_amount_out as u128, AmmError::SlippageExceeded);

        // Transfer tokens from user to vault (input token)
        self.transfer_tokens_to_vault(is_x, amount_in)?;
        // Transfer tokens from vault to user (output token)
        self.transfer_tokens_from_vault(!is_x, amount_out as u64)?;

        Ok(())
    }

    fn transfer_tokens_to_vault(&self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to) = if is_x {
            (
                self.user_x.to_account_info(),
                self.vault_x.to_account_info(),
            )
        } else {
            (
                self.user_y.to_account_info(),
                self.vault_y.to_account_info(),
            )
        };

        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer {
            from,
            to,
            authority: self.user.to_account_info(),
        };

        let ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer(ctx, amount)
    }

    fn transfer_tokens_from_vault(&self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to) = if is_x {
            (
                self.vault_x.to_account_info(),
                self.user_x.to_account_info(),
            )
        } else {
            (
                self.vault_y.to_account_info(),
                self.user_y.to_account_info(),
            )
        };

        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer {
            from,
            to,
            authority: self.config.to_account_info(),
        };

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"config",
            &self.config.seed.to_le_bytes(),
            &[self.config.config_bump],
        ]];

        let ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer(ctx, amount)
    }
}
