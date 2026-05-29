require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://root:secretpassword@localhost:5433/bookstore_db' });

async function main() {
  const tables = ['users', 'orders', 'order_items', 'reviews', 'user_behavior_events', 'books', 'categories'];
  for (const t of tables) {
    try {
      const r = await p.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
      console.log(`${t}: ${r.rows[0].cnt}`);
    } catch (e) {
      console.log(`${t}: ERROR - ${e.message}`);
    }
  }
  await p.end();
}
main();
