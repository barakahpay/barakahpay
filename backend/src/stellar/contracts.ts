import { nativeToScVal, xdr } from '@stellar/stellar-sdk';
import {
  escrowContract,
  registryContract,
  simulateRead,
  Address,
} from './client.js';

// -----------------------------------------------------------------------------
// Registry contract read helpers
// -----------------------------------------------------------------------------

export async function getRegistryAdmin(): Promise<string> {
  return await simulateRead<string>(registryContract, 'get_admin');
}

export async function isInstitutionVerified(onchainId: string): Promise<boolean> {
  const idBytes = Buffer.from(onchainId.replace(/^0x/, ''), 'hex');
  if (idBytes.length !== 32) {
    throw new Error(`Institution id must be 32 bytes; got ${idBytes.length}`);
  }
  const scId = xdr.ScVal.scvBytes(idBytes);
  return await simulateRead<boolean>(registryContract, 'is_verified', [scId]);
}

export async function getInstitutionOnchain(onchainId: string): Promise<unknown> {
  const idBytes = Buffer.from(onchainId.replace(/^0x/, ''), 'hex');
  const scId = xdr.ScVal.scvBytes(idBytes);
  return await simulateRead(registryContract, 'get_institution', [scId]);
}

export async function getInstitutionByAddressOnchain(
  address: string
): Promise<unknown> {
  const scAddress = new Address(address).toScVal();
  return await simulateRead(registryContract, 'get_institution_by_address', [
    scAddress,
  ]);
}

// -----------------------------------------------------------------------------
// Escrow contract read helpers
// -----------------------------------------------------------------------------

export async function getEscrowAdmin(): Promise<string> {
  return await simulateRead<string>(escrowContract, 'get_admin');
}

export async function getEscrow(escrowId: string): Promise<unknown> {
  const idBytes = Buffer.from(escrowId.replace(/^0x/, ''), 'hex');
  const scId = xdr.ScVal.scvBytes(idBytes);
  return await simulateRead(escrowContract, 'get_escrow', [scId]);
}

// -----------------------------------------------------------------------------
// Utility helpers
// -----------------------------------------------------------------------------

export function toScAmount(amount: string | bigint): xdr.ScVal {
  return nativeToScVal(BigInt(amount), { type: 'i128' });
}

export function hexToScBytesN(hex: string): xdr.ScVal {
  const buf = Buffer.from(hex.replace(/^0x/, ''), 'hex');
  if (buf.length !== 32) {
    throw new Error(`Expected 32-byte hex, got ${buf.length} bytes`);
  }
  return xdr.ScVal.scvBytes(buf);
}
