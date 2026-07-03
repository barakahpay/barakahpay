import {
  Contract,
  Networks,
  rpc,
  scValToNative,
  TransactionBuilder,
  Address,
  xdr,
} from '@stellar/stellar-sdk';
import { config } from '@/config.js';

export const server = new rpc.Server(config.STELLAR_RPC_URL, {
  allowHttp: config.STELLAR_RPC_URL.startsWith('http://'),
});

export const networkPassphrase =
  config.STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

export const escrowContract = new Contract(config.ESCROW_CONTRACT_ID);
export const registryContract = new Contract(config.REGISTRY_CONTRACT_ID);

/**
 * Simulate a read-only contract call and return the native value.
 * Used for view functions like get_admin, get_escrow, is_verified.
 */
export async function simulateRead<T = unknown>(
  contract: Contract,
  method: string,
  args: xdr.ScVal[] = [],
  sourceAccount = 'GB6Q2YBYROB3F3IGIQZ3XZ4ZR5F2CWNAXCG37QR454Y65FS7KGP4FOZX'
): Promise<T> {
  const account = await server.getAccount(sourceAccount);
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  const retval = 'result' in sim && sim.result ? sim.result.retval : null;
  if (!retval) return null as T;

  return scValToNative(retval) as T;
}

/**
 * Check network connectivity and return basic diagnostics.
 */
export async function healthCheck(): Promise<{
  connected: boolean;
  latestLedger?: number;
  networkPassphrase?: string;
  error?: string;
}> {
  try {
    const ledger = await server.getLatestLedger();
    return {
      connected: true,
      latestLedger: ledger.sequence,
      networkPassphrase,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export { Address, xdr };
