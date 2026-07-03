//! # BarakahPay Institution Registry
//!
//! On-chain KYB-gated registry of institutions eligible to receive BarakahPay
//! escrow payments. In v0.1 this focuses on **schools** in the Pakistan corridor;
//! `Category` reserves discriminants for hospitals, utilities, and groceries.
//!
//! ## KYB lifecycle
//!
//! ```text
//!     register (admin) --> Pending
//!         Pending + verify (admin)     --> Verified
//!         Verified + suspend (admin)   --> Suspended
//!         Suspended + reinstate (admin) -> Verified
//!         Verified | Suspended + revoke (admin) --> Revoked (terminal)
//! ```
//!
//! ## Design notes
//!
//! - **The registry does not custody funds.** It only maintains eligibility state.
//! - Each Stellar address may be registered **at most once**. Reverse lookup is O(1).
//! - `Revoked` is terminal — once revoked, an institution's `id` cannot be reused.
//! - Bank account details are stored as a **hash only** to preserve privacy;
//!   off-chain systems hold the plaintext and verify against the hash.
//! - Backend orchestrators should call `is_verified` before letting a sender
//!   create an escrow for a given institution.

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    Symbol,
};

// -----------------------------------------------------------------------------
// TTL constants (ledgers; 1 ledger ≈ 5 seconds on Stellar)
// -----------------------------------------------------------------------------

const DAY_IN_LEDGERS: u32 = 17_280;

/// Institution records live at least 60 days; extended on every read/write.
const INSTITUTION_TTL_BUMP: u32 = DAY_IN_LEDGERS * 60;
const INSTITUTION_TTL_THRESHOLD: u32 = DAY_IN_LEDGERS * 50;

const INSTANCE_TTL_BUMP: u32 = DAY_IN_LEDGERS * 7;
const INSTANCE_TTL_THRESHOLD: u32 = DAY_IN_LEDGERS * 3;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/// The kind of institution. Only `School` is active in v0.1.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Category {
    School = 0,
    // Reserved for phase 2:
    // Hospital = 1,
    // Utility = 2,
    // Grocery = 3,
}

/// The KYB lifecycle state of an institution.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum KybStatus {
    Pending = 0,
    Verified = 1,
    Suspended = 2,
    Revoked = 3,
}

/// Full record for a registered institution.
#[contracttype]
#[derive(Clone)]
pub struct Institution {
    pub id: BytesN<32>,
    pub name: Symbol,
    pub category: Category,
    pub kyb_status: KybStatus,
    pub address: Address,
    pub bank_account_hash: BytesN<32>,
    pub location: Symbol,
    pub registered_at: u64,
    pub verified_at: Option<u64>,
}

/// Storage key namespace.
#[contracttype]
pub enum DataKey {
    Admin,
    Institution(BytesN<32>),
    IdByAddress(Address),
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
    InstitutionNotFound = 3,
    InstitutionAlreadyExists = 4,
    AddressAlreadyRegistered = 5,
    InvalidStatusTransition = 6,
    RevokedIsFinal = 7,
}

// -----------------------------------------------------------------------------
// Contract
// -----------------------------------------------------------------------------

#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
    /// One-time initialization. Sets the admin address.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_BUMP);

        env.events().publish((symbol_short!("init"),), admin);
        Ok(())
    }

    /// Return the admin address.
    pub fn get_admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    /// Transfer admin control to a new address. Both current and new must sign.
    pub fn transfer_admin(env: Env, new_admin: Address) -> Result<(), Error> {
        let current: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        current.require_auth();
        new_admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_BUMP);

        env.events().publish(
            (symbol_short!("adminxfer"), current),
            new_admin,
        );
        Ok(())
    }

    /// Register a new institution in `Pending` state. Admin only.
    ///
    /// - `id` must be unique across all institutions (backend generates a UUID/hash).
    /// - `address` must not already be registered to another institution.
    pub fn register(
        env: Env,
        id: BytesN<32>,
        name: Symbol,
        category: Category,
        address: Address,
        bank_account_hash: BytesN<32>,
        location: Symbol,
    ) -> Result<(), Error> {
        let admin = Self::require_admin(&env)?;

        let inst_key = DataKey::Institution(id.clone());
        if env.storage().persistent().has(&inst_key) {
            return Err(Error::InstitutionAlreadyExists);
        }

        let addr_key = DataKey::IdByAddress(address.clone());
        if env.storage().persistent().has(&addr_key) {
            return Err(Error::AddressAlreadyRegistered);
        }

        let now = env.ledger().timestamp();
        let institution = Institution {
            id: id.clone(),
            name: name.clone(),
            category,
            kyb_status: KybStatus::Pending,
            address: address.clone(),
            bank_account_hash,
            location,
            registered_at: now,
            verified_at: None,
        };

        env.storage().persistent().set(&inst_key, &institution);
        env.storage().persistent().set(&addr_key, &id);
        Self::bump_institution_ttl(&env, &id);
        Self::bump_address_ttl(&env, &address);

        env.events().publish(
            (symbol_short!("register"), admin, address),
            (id, name, category),
        );
        Ok(())
    }

    /// Move a Pending institution to Verified. Admin only.
    pub fn verify(env: Env, id: BytesN<32>) -> Result<(), Error> {
        let admin = Self::require_admin(&env)?;
        let mut inst = Self::load(&env, &id)?;

        match inst.kyb_status {
            KybStatus::Pending => {}
            KybStatus::Revoked => return Err(Error::RevokedIsFinal),
            _ => return Err(Error::InvalidStatusTransition),
        }

        inst.kyb_status = KybStatus::Verified;
        inst.verified_at = Some(env.ledger().timestamp());
        Self::save(&env, &inst);

        env.events().publish(
            (symbol_short!("verify"), admin),
            (id, inst.address),
        );
        Ok(())
    }

    /// Move a Verified institution to Suspended. Admin only.
    /// Suspended institutions can be reinstated back to Verified.
    pub fn suspend(env: Env, id: BytesN<32>, reason: Symbol) -> Result<(), Error> {
        let admin = Self::require_admin(&env)?;
        let mut inst = Self::load(&env, &id)?;

        match inst.kyb_status {
            KybStatus::Verified => {}
            KybStatus::Revoked => return Err(Error::RevokedIsFinal),
            _ => return Err(Error::InvalidStatusTransition),
        }

        inst.kyb_status = KybStatus::Suspended;
        Self::save(&env, &inst);

        env.events().publish(
            (symbol_short!("suspend"), admin),
            (id, inst.address, reason),
        );
        Ok(())
    }

    /// Bring a Suspended institution back to Verified. Admin only.
    pub fn reinstate(env: Env, id: BytesN<32>) -> Result<(), Error> {
        let admin = Self::require_admin(&env)?;
        let mut inst = Self::load(&env, &id)?;

        match inst.kyb_status {
            KybStatus::Suspended => {}
            KybStatus::Revoked => return Err(Error::RevokedIsFinal),
            _ => return Err(Error::InvalidStatusTransition),
        }

        inst.kyb_status = KybStatus::Verified;
        Self::save(&env, &inst);

        env.events().publish(
            (symbol_short!("reinstate"), admin),
            (id, inst.address),
        );
        Ok(())
    }

    /// Permanently revoke an institution. Admin only. Terminal — cannot be undone.
    pub fn revoke(env: Env, id: BytesN<32>, reason: Symbol) -> Result<(), Error> {
        let admin = Self::require_admin(&env)?;
        let mut inst = Self::load(&env, &id)?;

        if inst.kyb_status == KybStatus::Revoked {
            return Err(Error::RevokedIsFinal);
        }

        inst.kyb_status = KybStatus::Revoked;
        Self::save(&env, &inst);

        env.events().publish(
            (symbol_short!("revoke"), admin),
            (id, inst.address, reason),
        );
        Ok(())
    }

    /// Read-only: fetch an institution by id.
    pub fn get_institution(env: Env, id: BytesN<32>) -> Result<Institution, Error> {
        Self::load(&env, &id)
    }

    /// Read-only: fetch an institution by its Stellar address.
    pub fn get_institution_by_address(
        env: Env,
        address: Address,
    ) -> Result<Institution, Error> {
        let id: BytesN<32> = env
            .storage()
            .persistent()
            .get(&DataKey::IdByAddress(address))
            .ok_or(Error::InstitutionNotFound)?;
        Self::load(&env, &id)
    }

    /// Read-only helper: is this institution currently Verified?
    /// Backend orchestrators call this before allowing sender to create an escrow.
    pub fn is_verified(env: Env, id: BytesN<32>) -> bool {
        match Self::load(&env, &id) {
            Ok(inst) => inst.kyb_status == KybStatus::Verified,
            Err(_) => false,
        }
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    fn require_admin(env: &Env) -> Result<Address, Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_BUMP);
        Ok(admin)
    }

    fn load(env: &Env, id: &BytesN<32>) -> Result<Institution, Error> {
        let inst: Institution = env
            .storage()
            .persistent()
            .get(&DataKey::Institution(id.clone()))
            .ok_or(Error::InstitutionNotFound)?;
        Self::bump_institution_ttl(env, id);
        Ok(inst)
    }

    fn save(env: &Env, inst: &Institution) {
        env.storage()
            .persistent()
            .set(&DataKey::Institution(inst.id.clone()), inst);
        Self::bump_institution_ttl(env, &inst.id);
    }

    fn bump_institution_ttl(env: &Env, id: &BytesN<32>) {
        env.storage().persistent().extend_ttl(
            &DataKey::Institution(id.clone()),
            INSTITUTION_TTL_THRESHOLD,
            INSTITUTION_TTL_BUMP,
        );
    }

    fn bump_address_ttl(env: &Env, address: &Address) {
        env.storage().persistent().extend_ttl(
            &DataKey::IdByAddress(address.clone()),
            INSTITUTION_TTL_THRESHOLD,
            INSTITUTION_TTL_BUMP,
        );
    }
}

#[cfg(test)]
mod test;
