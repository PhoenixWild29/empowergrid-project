const fs = require('fs');
const qrcode = require('qrcode');

/**
 * Generate a Blink QR code for funding an EmpowerGRID project.  Provide
 * the project PDA as the first command-line argument.  Requires that
 * your `actions.json` is set up to proxy /fund/* to /api/actions/fund/*.
 *
 * Usage: node scripts/gen-blink-qrs.js <PROJECT_PDA>
 */
async function main() {
  const project = process.argv[2];
  if (!project) {
    console.error('Usage: node gen-blink-qrs.js <PROJECT_PDA>');
    process.exit(1);
  }
  const actionUrl = `https://your.site/api/actions/fund/${project}`;
  const blinkUrl = `https://your.site/?action=${encodeURIComponent(`solana-action:${actionUrl}`)}`;
  const outName = `blink_fund_${project}.png`;
  await qrcode.toFile(outName, blinkUrl, { width: 600 });
  console.log('Blink QR saved:', outName);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});