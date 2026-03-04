const databaseService = require('./services/databaseService');

async function checkAnimalData() {
  try {
    // 1. Find the animal by RG '15986'
    // Since we don't have a direct method for searching by RG in the service easily exposed for this script without knowing the ID,
    // let's try to list animals or assume we can search.
    // Actually, databaseService has `buscarAnimalPorId`. 
    // We can query the database directly if we could, but we are using the service.
    // Let's assume we can query via SQL if needed, or iterate.
    // But `buscarHistoricoAnimal` takes an ID.
    
    // Let's try to find the ID first. We can use `db.query` if we import the pool, 
    // but `databaseService` is a singleton wrapping it.
    // Let's peek at `services/databaseService.js` to see if there's a search method.
    // If not, I'll use a raw query if I can import the db connection.
    
    const db = require('./lib/database'); // Correct path
    
    console.log('Searching for animal with RG 15986...');
    // db.query returns { rows: ... } usually
    const res = await db.query("SELECT * FROM animais WHERE rg = '15986'");
    
    if (res.rows.length === 0) {
      console.log('Animal not found.');
      return;
    }
    
    const animal = res.rows[0];
    console.log('Found animal:', animal.id, animal.serie, animal.rg);
    
    // 2. Fetch history
    console.log('Fetching history for animal ID:', animal.id);
    const history = await databaseService.buscarHistoricoAnimal(animal.id);
    
    // 3. Inspect custos
    console.log('Custos found:', JSON.stringify(history.custos, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAnimalData();
