import { db } from './src/lib/db.js';
import { initializeDatabase } from './src/lib/db.js';

async function audit() {
  await initializeDatabase();
  const subjects = await db.subjects.toArray();
  const topics = await db.topics.toArray();
  const cards = await db.cards.toArray();
  
  console.log('--- DB AUDIT ---');
  console.log(`Subjects: ${subjects.length}`);
  subjects.forEach(s => console.log(`- ${s.name} (ID: ${s.id})`));
  console.log(`Topics: ${topics.length}`);
  console.log(`Cards: ${cards.length}`);
  process.exit(0);
}

audit();
