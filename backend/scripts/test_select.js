const subjectService = require('../services/subjectService');
const prisma = require('../config/db');

async function testConcurrent() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found in DB');
      return;
    }
    console.log(`Testing CONCURRENT subject selection for user ${user.id}...`);

    // Fire 10 parallel concurrent selectSubject calls for the same subject simultaneously!
    const promises = Array.from({ length: 10 }).map(() =>
      subjectService.selectSubject(user.id, 'sch_physics_10')
    );

    const results = await Promise.all(promises);
    console.log(`✅ All 10 concurrent requests resolved successfully! Progress IDs:`, results.map(r => r.id));
  } catch (err) {
    console.error('❌ Concurrent test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testConcurrent();
