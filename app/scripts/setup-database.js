#!/usr/bin/env node

/**
 * Database setup script for EmpowerGRID
 * This script initializes the database and runs migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up EmpowerGRID database...\n');

  try {
    // Check if .env.local exists
    const envPath = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) {
      console.log(
        '❌ .env.local file not found. Please create it with your database URL.'
      );
      console.log(
        'Example: DATABASE_URL="postgresql://username:password@localhost:5432/empowergrid?schema=public"'
      );
      process.exit(1);
    }

    console.log('📋 Checking environment variables...');
    require('dotenv').config({ path: envPath });

    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL not found in .env.local');
      process.exit(1);
    }

    console.log('✅ Environment variables loaded');

    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Run database migration
    console.log('🗃️ Running database migration...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    // Optional: Seed the database with initial data
    console.log('🌱 Seeding database with initial data...');
    await seedDatabase();

    console.log('✅ Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env.local with the correct DATABASE_URL');
    console.log('2. Run "npm run dev" to start the development server');
    console.log('3. The database is now ready for use!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

async function seedDatabase() {
  // Import the database service
  const { databaseService } = require('../lib/services/databaseService');

  try {
    // Create some sample users for testing
    console.log('Creating sample users...');

    const sampleUsers = [
      {
        walletAddress: '11111111111111111111111111111112',
        username: 'alice_creator',
        role: 'CREATOR',
      },
      {
        walletAddress: '22222222222222222222222222222222',
        username: 'bob_funder',
        role: 'FUNDER',
      },
      {
        walletAddress: '33333333333333333333333333333333',
        username: 'charlie_admin',
        role: 'ADMIN',
      },
    ];

    for (const userData of sampleUsers) {
      try {
        await databaseService.createUser(
          userData.walletAddress,
          userData.username,
          userData.role
        );
        console.log(`✅ Created user: ${userData.username}`);
      } catch (error) {
        // User might already exist, skip
        console.log(`ℹ️ User ${userData.username} already exists`);
      }
    }

    console.log('✅ Database seeding completed');
  } catch (error) {
    console.log(
      '⚠️ Database seeding failed, but setup continues:',
      error.message
    );
  }
}

// Run the setup
setupDatabase();
