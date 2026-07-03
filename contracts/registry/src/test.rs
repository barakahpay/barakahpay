#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, Ledger, LedgerInfo},
    Address, BytesN, Env,
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

struct Ctx<'a> {
    env: Env,
    client: RegistryContractClient<'a>,
    admin: Address,
    inst_address: Address,
}

fn setup_ctx() -> Ctx<'static> {
    let env = setup_env();
    let contract_id = env.register(RegistryContract, ());
    let client = RegistryContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let inst_address = Address::generate(&env);

    client.initialize(&admin);

    Ctx {
        env,
        client,
        admin,
        inst_address,
    }
}

fn id(env: &Env, byte: u8) -> BytesN<32> {
    BytesN::from_array(env, &[byte; 32])
}

fn register_sample(c: &Ctx, sample_id: u8) -> BytesN<32> {
    let inst_id = id(&c.env, sample_id);
    c.client.register(
        &inst_id,
        &symbol_short!("Alfalah"),
        &Category::School,
        &c.inst_address,
        &id(&c.env, 99),
        &symbol_short!("Lahore"),
    );
    inst_id
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
    c.client.initialize(&c.admin);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_get_admin_before_init_fails() {
    let env = setup_env();
    let contract_id = env.register(RegistryContract, ());
    let client = RegistryContractClient::new(&env, &contract_id);
    client.get_admin();
}

// -----------------------------------------------------------------------------
// Register
// -----------------------------------------------------------------------------

#[test]
fn test_register_creates_pending_institution() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);

    let inst = c.client.get_institution(&inst_id);
    assert_eq!(inst.id, inst_id);
    assert_eq!(inst.name, symbol_short!("Alfalah"));
    assert_eq!(inst.category, Category::School);
    assert_eq!(inst.kyb_status, KybStatus::Pending);
    assert_eq!(inst.address, c.inst_address);
    assert_eq!(inst.location, symbol_short!("Lahore"));
    assert_eq!(inst.verified_at, None);
    assert!(!c.client.is_verified(&inst_id));
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_register_duplicate_id_fails() {
    let c = setup_ctx();
    register_sample(&c, 1);

    // Same id, different address
    let other_addr = Address::generate(&c.env);
    c.client.register(
        &id(&c.env, 1),
        &symbol_short!("Other"),
        &Category::School,
        &other_addr,
        &id(&c.env, 99),
        &symbol_short!("Karachi"),
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_register_duplicate_address_fails() {
    let c = setup_ctx();
    register_sample(&c, 1);

    // Different id, same address
    c.client.register(
        &id(&c.env, 2),
        &symbol_short!("Other"),
        &Category::School,
        &c.inst_address,
        &id(&c.env, 99),
        &symbol_short!("Karachi"),
    );
}

// -----------------------------------------------------------------------------
// Verify
// -----------------------------------------------------------------------------

#[test]
fn test_verify_transitions_pending_to_verified() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);

    c.client.verify(&inst_id);

    let inst = c.client.get_institution(&inst_id);
    assert_eq!(inst.kyb_status, KybStatus::Verified);
    assert!(inst.verified_at.is_some());
    assert!(c.client.is_verified(&inst_id));
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_verify_already_verified_fails() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    c.client.verify(&inst_id);
    // Second verify should fail (not Pending anymore)
    c.client.verify(&inst_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_verify_unknown_id_fails() {
    let c = setup_ctx();
    c.client.verify(&id(&c.env, 99));
}

// -----------------------------------------------------------------------------
// Suspend / Reinstate
// -----------------------------------------------------------------------------

#[test]
fn test_suspend_verified() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    c.client.verify(&inst_id);
    c.client.suspend(&inst_id, &symbol_short!("audit"));

    let inst = c.client.get_institution(&inst_id);
    assert_eq!(inst.kyb_status, KybStatus::Suspended);
    assert!(!c.client.is_verified(&inst_id));
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_suspend_pending_fails() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    // Not verified yet
    c.client.suspend(&inst_id, &symbol_short!("audit"));
}

#[test]
fn test_reinstate_suspended_back_to_verified() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    c.client.verify(&inst_id);
    c.client.suspend(&inst_id, &symbol_short!("audit"));
    c.client.reinstate(&inst_id);

    let inst = c.client.get_institution(&inst_id);
    assert_eq!(inst.kyb_status, KybStatus::Verified);
    assert!(c.client.is_verified(&inst_id));
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_reinstate_verified_fails() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    c.client.verify(&inst_id);
    // Already Verified — can't reinstate
    c.client.reinstate(&inst_id);
}

// -----------------------------------------------------------------------------
// Revoke (terminal)
// -----------------------------------------------------------------------------

#[test]
fn test_revoke_from_pending() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    c.client.revoke(&inst_id, &symbol_short!("fraud"));

    let inst = c.client.get_institution(&inst_id);
    assert_eq!(inst.kyb_status, KybStatus::Revoked);
    assert!(!c.client.is_verified(&inst_id));
}

#[test]
fn test_revoke_from_verified() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    c.client.verify(&inst_id);
    c.client.revoke(&inst_id, &symbol_short!("fraud"));

    let inst = c.client.get_institution(&inst_id);
    assert_eq!(inst.kyb_status, KybStatus::Revoked);
}

#[test]
fn test_revoke_from_suspended() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    c.client.verify(&inst_id);
    c.client.suspend(&inst_id, &symbol_short!("audit"));
    c.client.revoke(&inst_id, &symbol_short!("fraud"));

    let inst = c.client.get_institution(&inst_id);
    assert_eq!(inst.kyb_status, KybStatus::Revoked);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_revoke_already_revoked_fails() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    c.client.revoke(&inst_id, &symbol_short!("fraud"));
    // Second revoke on already-revoked
    c.client.revoke(&inst_id, &symbol_short!("again"));
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_verify_after_revoke_fails() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    c.client.revoke(&inst_id, &symbol_short!("fraud"));
    c.client.verify(&inst_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_reinstate_after_revoke_fails() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);
    c.client.verify(&inst_id);
    c.client.revoke(&inst_id, &symbol_short!("fraud"));
    c.client.reinstate(&inst_id);
}

// -----------------------------------------------------------------------------
// Reverse lookup
// -----------------------------------------------------------------------------

#[test]
fn test_get_institution_by_address() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);

    let inst = c.client.get_institution_by_address(&c.inst_address);
    assert_eq!(inst.id, inst_id);
    assert_eq!(inst.address, c.inst_address);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_get_institution_by_unknown_address_fails() {
    let c = setup_ctx();
    let random = Address::generate(&c.env);
    c.client.get_institution_by_address(&random);
}

// -----------------------------------------------------------------------------
// is_verified helper
// -----------------------------------------------------------------------------

#[test]
fn test_is_verified_lifecycle() {
    let c = setup_ctx();
    let inst_id = register_sample(&c, 1);

    // Pending
    assert!(!c.client.is_verified(&inst_id));

    // Verified
    c.client.verify(&inst_id);
    assert!(c.client.is_verified(&inst_id));

    // Suspended
    c.client.suspend(&inst_id, &symbol_short!("audit"));
    assert!(!c.client.is_verified(&inst_id));

    // Reinstated
    c.client.reinstate(&inst_id);
    assert!(c.client.is_verified(&inst_id));

    // Revoked
    c.client.revoke(&inst_id, &symbol_short!("fraud"));
    assert!(!c.client.is_verified(&inst_id));
}

#[test]
fn test_is_verified_unknown_returns_false() {
    let c = setup_ctx();
    assert!(!c.client.is_verified(&id(&c.env, 99)));
}

// -----------------------------------------------------------------------------
// Transfer admin
// -----------------------------------------------------------------------------

#[test]
fn test_transfer_admin() {
    let c = setup_ctx();
    let new_admin = Address::generate(&c.env);

    c.client.transfer_admin(&new_admin);

    assert_eq!(c.client.get_admin(), new_admin);
}

// -----------------------------------------------------------------------------
// Multiple institutions coexist
// -----------------------------------------------------------------------------

#[test]
fn test_multiple_institutions_isolated() {
    let c = setup_ctx();
    let id1 = register_sample(&c, 1);

    let addr2 = Address::generate(&c.env);
    let id2 = id(&c.env, 2);
    c.client.register(
        &id2,
        &symbol_short!("Beacon"),
        &Category::School,
        &addr2,
        &id(&c.env, 98),
        &symbol_short!("Karachi"),
    );

    c.client.verify(&id1);
    // id2 remains Pending

    assert!(c.client.is_verified(&id1));
    assert!(!c.client.is_verified(&id2));

    let inst2 = c.client.get_institution(&id2);
    assert_eq!(inst2.name, symbol_short!("Beacon"));
    assert_eq!(inst2.kyb_status, KybStatus::Pending);
}
