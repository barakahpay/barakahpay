//! # BarakahPay Escrow Contract
//!
//! Purpose-bound escrow for cross-border remittances on Stellar & Soroban.
//!
//! A sender locks tokens with a specific purpose (initially school fees) bound to
//! a verified institution. Funds are released only when the institution submits
//! a valid proof of service. If the institution does not claim before timeout,
//! the sender can refund.
//!
//! ## Lifecycle
//!
//! ```text
//! create_escrow (sender) --> Pending
//!    Pending + release (institution + proof) --> Released
//!    Pending + timeout + refund (sender) --> Refunded
//! ```
//!
//! ## Safety guarantees
//!
//! - No admin can withdraw funds. Funds only leave via `release` or `refund`.
//! - Only the specified institution can trigger `release`.
//! - Only the original sender can trigger `refund`, and only after `timeout_at`.
//! - Every state transition emits an event for indexer consumption.

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, BytesN,
    Env, Symbol,
};

// -----------------------------------------------------------------------------
// TTL constants (measured in ledgers; 1 ledger ≈ 5 seconds on Stellar)
// -----------------------------------------------------------------------------

const DAY_IN_LEDGERS: u32 = 17_280;

/// Escrow records live at least 30 days on-chain; extended on read/write.
const ESCROW_TTL_BUMP: u32 = DAY_IN_LEDGERS * 30;
const ESCROW_TTL_THRESHOLD: u32 = DAY_IN_LEDGERS * 25;

/// Contract instance (admin config) TTL ≈ 7 days per bump.
const INSTANCE_TTL_BUMP: u32 = DAY_IN_LEDGERS * 7;
const INSTANCE_TTL_THRESHOLD: u32 = DAY_IN_LEDGERS * 3;

/// Minimum escrow window: 1 hour. Below this makes little sense in practice
/// and prevents institutions from being unfairly locked out.
const MIN_TIMEOUT_SECONDS: u64 = 3_600;

/// Maximum escrow window: 90 days. Beyond this, senders should re-evaluate.
const MAX_TIMEOUT_SECONDS: u64 = 60 * 60 * 24 * 90;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/// The category of remittance being made. MVP supports SchoolFees only;
/// future categories are additive without breaking storage layout.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Purpose {
    SchoolFees = 0,
    // Reserved for phase 2:
    // Medical = 1,
    // Utility = 2,
    // Grocery = 3,
}

/// Lifecycle state of an escrow.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Pending = 0,
    Released = 1,
    Refunded = 2,
}

/// The full escrow record persisted per `escrow_id`.
#[contracttype]
#[derive(Clone)]
pub struct Escrow {
    pub sender: Address,
    pub institution: Address,
    pub token: Address,
    pub amount: i128,
    pub purpose: Purpose,
    pub reference: Symbol,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub timeout_at: u64,
    pub proof: Option<BytesN<32>>,
}

/// Storage key namespace.
#[contracttype]
pub enum DataKey {
    Admin,
    Escrow(BytesN<32>),
}

// -----------------------------------------------------------------------------
// Errors
// -----------------------------------------------------------------------------

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidAmount = 3,
    InvalidTimeout = 4,
    EscrowNotFound = 5,
    EscrowAlreadyExists = 6,
    NotPending = 7,
    NotTimedOut = 8,
    TimedOut = 9,
}

// -----------------------------------------------------------------------------
// Contract
// -----------------------------------------------------------------------------

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// One-time initialization. Sets the contract admin.
    ///
    /// The admin is a placeholder for future governance (upgrade authorization,
    /// emergency pause). It cannot withdraw funds from active escrows.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_BUMP);

        env.events()
            .publish((symbol_short!("init"),), admin);
        Ok(())
    }

    /// Return the admin address.
    pub fn get_admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    /// Create a new escrow. The sender locks `amount` of `token` for the
    /// specified `institution` and `purpose`. The `escrow_id` is caller-supplied
    /// and must be unique (backend generates a UUID or hash and passes it in).
    ///
    /// Tokens are transferred from `sender` to this contract's address at call
    /// time. Sender must have approved the token transfer via `require_auth`.
    pub fn create_escrow(
        env: Env,
        escrow_id: BytesN<32>,
        sender: Address,
        institution: Address,
        token: Address,
        amount: i128,
        purpose: Purpose,
        reference: Symbol,
        timeout_seconds: u64,
    ) -> Result<(), Error> {
        sender.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if timeout_seconds < MIN_TIMEOUT_SECONDS || timeout_seconds > MAX_TIMEOUT_SECONDS {
            return Err(Error::InvalidTimeout);
        }

        let key = DataKey::Escrow(escrow_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::EscrowAlreadyExists);
        }

        // Pull tokens into the contract's custody.
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        let now = env.ledger().timestamp();
        let escrow = Escrow {
            sender: sender.clone(),
            institution: institution.clone(),
            token,
            amount,
            purpose,
            reference,
            status: EscrowStatus::Pending,
            created_at: now,
            timeout_at: now + timeout_seconds,
            proof: None,
        };

        env.storage().persistent().set(&key, &escrow);
        env.storage()
            .persistent()
            .extend_ttl(&key, ESCROW_TTL_THRESHOLD, ESCROW_TTL_BUMP);

        env.events().publish(
            (symbol_short!("create"), sender, institution),
            (escrow_id, amount, purpose),
        );

        Ok(())
    }

    /// Institution submits proof of service and releases the escrowed funds.
    /// Funds are transferred from the contract to the institution's address.
    ///
    /// - Only the exact institution named in the escrow can call this.
    /// - Must be called before `timeout_at`; after timeout, only refund is possible.
    pub fn release(env: Env, escrow_id: BytesN<32>, proof: BytesN<32>) -> Result<(), Error> {
        let key = DataKey::Escrow(escrow_id.clone());
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::EscrowNotFound)?;

        if escrow.status != EscrowStatus::Pending {
            return Err(Error::NotPending);
        }

        escrow.institution.require_auth();

        let now = env.ledger().timestamp();
        if now > escrow.timeout_at {
            return Err(Error::TimedOut);
        }

        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.institution,
            &escrow.amount,
        );

        escrow.status = EscrowStatus::Released;
        escrow.proof = Some(proof.clone());
        env.storage().persistent().set(&key, &escrow);
        env.storage()
            .persistent()
            .extend_ttl(&key, ESCROW_TTL_THRESHOLD, ESCROW_TTL_BUMP);

        env.events().publish(
            (
                symbol_short!("release"),
                escrow.sender.clone(),
                escrow.institution.clone(),
            ),
            (escrow_id, proof, escrow.amount),
        );

        Ok(())
    }

    /// Sender refunds their escrow after the timeout has elapsed.
    ///
    /// - Only the original sender can call this.
    /// - Only callable after `timeout_at` has passed.
    /// - Only valid on escrows still in `Pending` state.
    pub fn refund(env: Env, escrow_id: BytesN<32>) -> Result<(), Error> {
        let key = DataKey::Escrow(escrow_id.clone());
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::EscrowNotFound)?;

        if escrow.status != EscrowStatus::Pending {
            return Err(Error::NotPending);
        }

        escrow.sender.require_auth();

        let now = env.ledger().timestamp();
        if now <= escrow.timeout_at {
            return Err(Error::NotTimedOut);
        }

        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.sender,
            &escrow.amount,
        );

        escrow.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&key, &escrow);
        env.storage()
            .persistent()
            .extend_ttl(&key, ESCROW_TTL_THRESHOLD, ESCROW_TTL_BUMP);

        env.events().publish(
            (symbol_short!("refund"), escrow.sender.clone()),
            (escrow_id, escrow.amount),
        );

        Ok(())
    }

    /// Read-only: fetch the full escrow record.
    pub fn get_escrow(env: Env, escrow_id: BytesN<32>) -> Result<Escrow, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(Error::EscrowNotFound)
    }
}

#[cfg(test)]
mod test;
