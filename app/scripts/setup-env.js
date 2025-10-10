/**
 * EmpowerGRID Environment Setup Script
 * 
 * This script helps you create the .env file with proper configuration
 * Run: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🚀 EmpowerGRID Environment Setup\n');
  console.log('This script will help you create the .env file\n');

  // Generate JWT secret
  const jwtSecret = crypto.randomBytes(64).toString('base64');
  console.log('✅ Generated JWT secret');

  // Ask for database configuration
  console.log('\n📊 Database Configuration\n');
  
  const useDocker = await question('Are you using Docker for PostgreSQL? (y/n): ');
  
  let databaseUrl;
  
  if (useDocker.toLowerCase() === 'y') {
    databaseUrl = 'postgresql://postgres:empowergrid_dev_pass@localhost:5432/empowergrid?schema=public';
    console.log('✅ Using Docker database configuration');
  } else {
    const dbUser = await question('Database username (default: postgres): ') || 'postgres';
    const dbPassword = await question('Database password: ');
    const dbHost = await question('Database host (default: localhost): ') || 'localhost';
    const dbPort = await question('Database port (default: 5432): ') || '5432';
    const dbName = await question('Database name (default: empowergrid): ') || 'empowergrid';
    
    databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;
    console.log('✅ Database URL configured');
  }

  // Environment
  const nodeEnv = await question('\nEnvironment (development/production, default: development): ') || 'development';
  const appUrl = await question('Application URL (default: http://localhost:3000): ') || 'http://localhost:3000';
  const logLevel = await question('Log level (debug/info/warn/error, default: debug): ') || 'debug';

  // Create .env content
  const envContent = `# EmpowerGRID Environment Configuration
# Generated on ${new Date().toISOString()}

# ============================================================================
# DATABASE CONFIGURATION (REQUIRED)
# ============================================================================

DATABASE_URL="${databaseUrl}"

# ============================================================================
# JWT CONFIGURATION (REQUIRED)
# ============================================================================

# IMPORTANT: Keep this secret! Never commit to git!
JWT_SECRET="${jwtSecret}"

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================

NODE_ENV=${nodeEnv}
NEXT_PUBLIC_APP_URL=${appUrl}

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

LOG_LEVEL=${logLevel}

# ============================================================================
# OPTIONAL CONFIGURATIONS
# ============================================================================

# Uncomment and configure as needed:
# ALLOWED_ORIGINS=http://localhost:3000,https://empowergrid.io
# ENABLE_AUTO_TOKEN_REFRESH=true
# ENABLE_REFRESH_TOKEN_ROTATION=true
`;

  // Write .env file
  const envPath = path.join(__dirname, '..', '.env');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ .env file created successfully!');
  console.log(`📁 Location: ${envPath}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Review the .env file');
  console.log('   2. Run: npm run prisma:db:push');
  console.log('   3. Run: npm run dev');
  console.log('\n🎉 Setup complete!\n');

  rl.close();
}

setup().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});




