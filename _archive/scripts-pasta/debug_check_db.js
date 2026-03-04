
const databaseService = require('../services/databaseService');

async function test() {
  console.log('Checking database connection and animal table...');
  try {
    const dbService = new databaseService.default(); // Adjust if default export
    // Or if it's a class instance exported:
    // const dbService = databaseService;
    
    // Check first animal to see ID format
    const result = await dbService.query('SELECT id, serie, rg, nome FROM animais LIMIT 5');
    console.log('First 5 animals:', result.rows);
    
    // Check if animal with RG 16207 exists
    const searchRg = await dbService.query("SELECT * FROM animais WHERE rg LIKE '%16207%'");
    console.log('Search for 16207 in RG:', searchRg.rows);
    
    // Check if animal with ID 16207 exists (if ID is integer)
    try {
        const searchId = await dbService.query("SELECT * FROM animais WHERE id = '16207'");
        console.log('Search for 16207 in ID:', searchId.rows);
    } catch (e) {
        console.log('Search by ID 16207 failed (likely type mismatch):', e.message);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

test();
