import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import fetch from 'node-fetch';
import idl from '../../idl/empower_grid.json';

// Relay metrics from a HTTP endpoint to the EmpowerGrid program.  This script
// is a simple example; in production you would use Switchboard functions
// or another oracle network to automate this process.

async function main() {
  const rpcUrl = process.env.RPC_URL || 'https://api.devnet.solana.com';
  const programId = new PublicKey(process.env.PROGRAM_ID || 'YourProgramIdHereReplaceThisWithActualID');
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(process.env.RELAYER || '[0,0,0,0]')),
  );
  const projectPk = new PublicKey(process.env.PROJECT || '');
  const meterUrl = process.env.METER_URL || 'http://localhost:3000/api/meter/latest';
  const connection = new Connection(rpcUrl, 'confirmed');
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl as any, programId, provider);
  if (!projectPk) {
    throw new Error('PROJECT env var required');
  }
  // Fetch the latest reading from our meter simulator endpoint
  const resp = await fetch(meterUrl);
  const json = await resp.json();
  const kwhDelta = Math.round(json.raw_wh / 1000);
  const co2Delta = Math.round(json.co2 * 1000);
  console.log('Submitting kWh delta:', kwhDelta, 'CO2 delta:', co2Delta);
  await program.methods
    .submitMetrics(new anchor.BN(kwhDelta), new anchor.BN(co2Delta), null)
    .accounts({ project: projectPk, oracleAuthority: wallet.publicKey })
    .signers([payer])
    .rpc();
}
main().catch((err) => console.error(err));