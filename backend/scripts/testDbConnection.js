// backend/scripts/testDbConnection.js
import prisma from '../src/config/database.js';

async function testConnection() {
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log(`✅ Users table exists. Current user count: ${userCount}`);
    
    // Test write operation
    const testUser = await prisma.user.findFirst();
    console.log(`✅ Read operation successful`);
    
    await prisma.$disconnect();
    console.log('✅ All tests passed');
  } catch (error) {
    console.error('❌ Database error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    process.exit(1);
  }
}

testConnection();
