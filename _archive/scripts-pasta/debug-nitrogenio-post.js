const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3020'; // Adjust port if needed

async function testPost() {
  console.log('Testing POST /api/nitrogenio with clean data...');
  try {
    // Test case 1: Clean data (should succeed)
    const response1 = await fetch(`${BASE_URL}/api/nitrogenio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data_abastecimento: '2025-12-19',
        quantidade_litros: '50',
        valor_unitario: '10.50', // Standard format
        valor_total: '525.00',   // Standard format
        motorista: 'Test Driver Clean',
        observacoes: 'Test observation clean'
      })
    });
    console.log('Response 1 Status:', response1.status);
    const data1 = await response1.json();
    console.log('Response 1 Data:', data1);

    // Test case 2: Bad data (should fail with 500 and DB error)
    console.log('\nTesting POST /api/nitrogenio with bad data (1.125.00)...');
    const response2 = await fetch(`${BASE_URL}/api/nitrogenio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data_abastecimento: '2025-12-19',
        quantidade_litros: '50',
        valor_unitario: '1.125.00', // Bad format
        valor_total: '56250.00',
        motorista: 'Test Driver Bad',
        observacoes: 'Test observation bad'
      })
    });
    console.log('Response 2 Status:', response2.status);
    const data2 = await response2.json();
    console.log('Response 2 Data:', data2);

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testPost();
