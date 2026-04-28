require('dotenv/config');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    console.log('Đang xóa sách...');
    const result = await pool.query('DELETE FROM books;');
    console.log(`Đã xóa ${result.rowCount} cuốn sách.`);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
main();
