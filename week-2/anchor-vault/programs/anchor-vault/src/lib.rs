use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

declare_id!("9S6MegtkX5ep4QtzkKnjFdZTcjYyYD6TqHPuhmQ4JUSV");

#[program]
pub mod anchor_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(&ctx.bumps)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        ctx.accounts.withdraw(amount)
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
       ctx.accounts.close()
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {


    #[account(mut)]
    pub user: Signer<'info>,    // Signer

    #[account(
        init,
        payer = user,
        seeds = [b"state", user.key().as_ref()],
        bump,
        space = VaultState::DISCRIMINATOR.len()  + VaultState::INIT_SPACE
    )]
    pub vault_state: Account<'info, VaultState>,    // Vault State

    #[account(
        mut,
        seeds = [b"vault", vault_state.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,    // Vault account

    pub system_program: Program<'info, System>,

}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, bump: &InitializeBumps) -> Result<()> {
        let rent_exempt = Rent::get()?.minimum_balance(self.vault.to_account_info().data_len());

        let cpi_program = self.system_program.to_account_info();
        let cpi_account = Transfer{
            from: self.user.to_account_info(),
            to: self.vault.to_account_info(),
    };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_account);

        transfer(cpi_ctx, rent_exempt)?;

        self.vault_state.state_bump = bump.vault_state;
        self.vault_state.vault_bump = bump.vault;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [b"vault", vault_state.key().as_ref()],
        bump = vault_state.vault_bump
    )]

    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Deposit<'info> {
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.user.to_account_info(),
            to: self.vault.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer(cpi_ctx, amount)?;

        Ok(())
    }
}


#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [b"vault", vault_state.key().as_ref()],
        bump = vault_state.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info(),
        };

        let bump_seed = self.vault_state.vault_bump;
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"vault".as_ref(),
            self.vault_state.to_account_info().key.as_ref(),
            &[bump_seed],
        ]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer(cpi_ctx, amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Close<'info> {

    #[account(
        mut,
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump,
        close = user
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [b"vault", vault_state.key().as_ref()],
        bump = vault_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> Close<'info> {
    pub fn close(&mut self) -> Result<()> {
        // Transfer all remaining lamports from vault to user
        let vault_balance = self.vault.to_account_info().lamports();

        if vault_balance > 0 {
            let cpi_program = self.system_program.to_account_info();

            let cpi_accounts = Transfer {
                from: self.vault.to_account_info(),
                to: self.user.to_account_info(),
            };

            let bump_seed = self.vault_state.vault_bump;
            let signer_seeds: &[&[&[u8]]] = &[&[
                b"vault".as_ref(),
                self.vault_state.to_account_info().key.as_ref(),
                &[bump_seed],
            ]];

            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

            transfer(cpi_ctx, vault_balance)?;
        }

        Ok(())
    }
}


#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub vault_bump: u8,
    pub state_bump: u8
}