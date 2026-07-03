#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, Ledger, LedgerInfo},
    token, Address, BytesN, Env,
};

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

fn setup_env() -> Env {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set(LedgerInfo {
        timestamp: 1_700_000_000,
        protocol_version: 22,
        sequence_number: 100,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 16,
        min_persistent_entry_ttl: 4096,
        max_entry_ttl: 6_312_000,
    });
    env
}

fn create_token<'a>(
    env: &Env,
    admin: &Address,
) -> (token::Client<'a>, token::StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let addr = sac.address();
    (
        token::Client::new(env, &addr),
        token::StellarAssetClient::new(env, &addr),
    )
}

struct Ctx<'a> {
    env: Env,
    contract_id: Address,
    client: EscrowContractClient<'a>,
    admin: Address,
    sender: Address,
    institution: Address,
    token: token::Client<'a>,
}

fn setup_ctx() -> Ctx<'static> {
    let env = setup_env();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let institution = Address::generate(&env);

    let (token, token_admin) = create_token(&env, &admin);
    token_admin.mint(&sender, &1_000_000);

    client.initialize(&admin);

    Ctx {
        env,
        contract_id,
        client,
        admin,
        sender,
        institution,
        token,
    }
}

fn make_id(env: &Env, byte: u8) -> BytesN<32> {
    BytesN::from_array(env, &[byte; 32])
}

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------

#[test]
fn test_initialize_sets_admin() {
    let c = setup_ctx();
    assert_eq!(c.client.get_admin(), c.admin);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_double_initialize_fails() {
    let c = setup_ctx();
    // Second initialize should panic with AlreadyInitialized (2)
    c.client.initialize(&c.admin);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_get_admin_before_init_fails() {
    let env = setup_env();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    // Should panic with NotInitialized (1)
    client.get_admin();
}

// -----------------------------------------------------------------------------
// Create escrow
// -----------------------------------------------------------------------------

#[test]
fn test_create_escrow_locks_tokens() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);
    let reference = symbol_short!("STU001");

    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &50_000,
        &Purpose::SchoolFees,
        &reference,
        &(86_400 * 30),
    );

    let e = c.client.get_escrow(&id);
    assert_eq!(e.sender, c.sender);
    assert_eq!(e.institution, c.institution);
    assert_eq!(e.amount, 50_000);
    assert_eq!(e.purpose, Purpose::SchoolFees);
    assert_eq!(e.reference, reference);
    assert_eq!(e.status, EscrowStatus::Pending);
    assert_eq!(e.proof, None);

    assert_eq!(c.token.balance(&c.contract_id), 50_000);
    assert_eq!(c.token.balance(&c.sender), 950_000);
    assert_eq!(c.token.balance(&c.institution), 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_create_zero_amount_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);
    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &0,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &(86_400 * 30),
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_create_negative_amount_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);
    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &-1,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &(86_400 * 30),
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_create_timeout_too_short_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);
    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &50_000,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &1_800, // 30 min — below MIN_TIMEOUT_SECONDS
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_create_timeout_too_long_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);
    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &50_000,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &(60 * 60 * 24 * 100), // 100 days — above MAX_TIMEOUT_SECONDS
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_create_duplicate_id_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);
    let reference = symbol_short!("STU001");

    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &50_000,
        &Purpose::SchoolFees,
        &reference,
        &(86_400 * 30),
    );

    // Same id — second create must panic
    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &10_000,
        &Purpose::SchoolFees,
        &reference,
        &(86_400 * 30),
    );
}

// -----------------------------------------------------------------------------
// Release
// -----------------------------------------------------------------------------

#[test]
fn test_release_transfers_to_institution() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);
    let proof = make_id(&c.env, 9);

    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &50_000,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &(86_400 * 30),
    );

    c.client.release(&id, &proof);

    let e = c.client.get_escrow(&id);
    assert_eq!(e.status, EscrowStatus::Released);
    assert_eq!(e.proof, Some(proof));

    assert_eq!(c.token.balance(&c.institution), 50_000);
    assert_eq!(c.token.balance(&c.contract_id), 0);
    assert_eq!(c.token.balance(&c.sender), 950_000);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_release_nonexistent_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 99);
    let proof = make_id(&c.env, 9);
    c.client.release(&id, &proof);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_release_already_released_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);
    let proof = make_id(&c.env, 9);

    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &50_000,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &(86_400 * 30),
    );

    c.client.release(&id, &proof);
    // Second release on same escrow must panic
    c.client.release(&id, &proof);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_release_after_timeout_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);
    let proof = make_id(&c.env, 9);

    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &50_000,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &(86_400 * 7),
    );

    // Advance ledger past timeout
    c.env.ledger().with_mut(|li| {
        li.timestamp += 86_400 * 8;
    });

    c.client.release(&id, &proof);
}

// -----------------------------------------------------------------------------
// Refund
// -----------------------------------------------------------------------------

#[test]
fn test_refund_after_timeout_returns_to_sender() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);

    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &50_000,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &(86_400 * 7),
    );

    // Advance past timeout
    c.env.ledger().with_mut(|li| {
        li.timestamp += 86_400 * 8;
    });

    c.client.refund(&id);

    let e = c.client.get_escrow(&id);
    assert_eq!(e.status, EscrowStatus::Refunded);

    assert_eq!(c.token.balance(&c.sender), 1_000_000);
    assert_eq!(c.token.balance(&c.contract_id), 0);
    assert_eq!(c.token.balance(&c.institution), 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #8)")]
fn test_refund_before_timeout_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);

    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &50_000,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &(86_400 * 30),
    );

    // No time advance — refund must fail
    c.client.refund(&id);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_refund_nonexistent_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 99);
    c.client.refund(&id);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_refund_already_released_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 1);
    let proof = make_id(&c.env, 9);

    c.client.create_escrow(
        &id,
        &c.sender,
        &c.institution,
        &c.token.address,
        &50_000,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &(86_400 * 7),
    );

    c.client.release(&id, &proof);

    // Advance past timeout — but escrow is already released
    c.env.ledger().with_mut(|li| {
        li.timestamp += 86_400 * 8;
    });

    c.client.refund(&id);
}

// -----------------------------------------------------------------------------
// Multiple escrows
// -----------------------------------------------------------------------------

#[test]
fn test_multiple_escrows_isolated() {
    let c = setup_ctx();
    let id1 = make_id(&c.env, 1);
    let id2 = make_id(&c.env, 2);
    let proof = make_id(&c.env, 9);

    c.client.create_escrow(
        &id1,
        &c.sender,
        &c.institution,
        &c.token.address,
        &30_000,
        &Purpose::SchoolFees,
        &symbol_short!("STU001"),
        &(86_400 * 30),
    );

    c.client.create_escrow(
        &id2,
        &c.sender,
        &c.institution,
        &c.token.address,
        &20_000,
        &Purpose::SchoolFees,
        &symbol_short!("STU002"),
        &(86_400 * 30),
    );

    // Release only the first
    c.client.release(&id1, &proof);

    let e1 = c.client.get_escrow(&id1);
    let e2 = c.client.get_escrow(&id2);
    assert_eq!(e1.status, EscrowStatus::Released);
    assert_eq!(e2.status, EscrowStatus::Pending);

    assert_eq!(c.token.balance(&c.institution), 30_000);
    assert_eq!(c.token.balance(&c.contract_id), 20_000);
    assert_eq!(c.token.balance(&c.sender), 950_000);
}

// -----------------------------------------------------------------------------
// Get escrow
// -----------------------------------------------------------------------------

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_get_nonexistent_escrow_fails() {
    let c = setup_ctx();
    let id = make_id(&c.env, 99);
    c.client.get_escrow(&id);
}
