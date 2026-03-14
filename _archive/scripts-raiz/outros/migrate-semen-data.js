const { query } = require('./lib/database');

async function migrateSemenData() {
    try {
        console.log('�Ÿ”„ Migrando dados de entradas_semen para estoque_semen...\n');

        // Buscar todos os dados da tabela entradas_semen
        const entradasResult = await query('SELECT * FROM entradas_semen ORDER BY id');

        console.log(`�Ÿ“Š Encontrados ${entradasResult.rows.length} registros em entradas_semen`);

        for (const entrada of entradasResult.rows) {
            console.log(`\n�Ÿ”„ Migrando: ${entrada.touro_nome}`);

            // Verificar se já existe na tabela estoque_semen
            const existsResult = await query(`
        SELECT id FROM estoque_semen 
        WHERE nome_touro = $1 AND raca = $2
      `, [entrada.touro_nome, entrada.raca]);

            if (existsResult.rows.length > 0) {
                console.log(`  �š�️  Já existe - pulando`);
                continue;
            }

            // Inserir na tabela estoque_semen
            const insertResult = await query(`
        INSERT INTO estoque_semen (
          nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca,
          tipo_operacao, fornecedor, valor_compra, data_compra,
          quantidade_doses, doses_disponiveis, doses_usadas, status, observacoes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, 'disponivel', $14
        ) RETURNING id
      `, [
                entrada.touro_nome,
                entrada.rg_touro,
                entrada.raca,
                `Rack: ${entrada.cod_rack}`, // localizacao
                entrada.cod_rack, // rack_touro
                entrada.botijao,
                entrada.caneca,
                'entrada', // tipo_operacao
                entrada.fornecedor,
                entrada.valor, // valor_compra
                entrada.data_entrada, // data_compra
                entrada.doses, // quantidade_doses
                entrada.doses, // doses_disponiveis (inicialmente igual à quantidade)
                entrada.observacoes
            ]);

            console.log(`  �œ… Migrado com ID: ${insertResult.rows[0].id}`);
        }

        console.log('\n�ŸŽ‰ Migração concluída!');

        // Verificar resultado
        const finalCount = await query('SELECT COUNT(*) as count FROM estoque_semen');
        console.log(`�Ÿ“Š Total de registros em estoque_semen: ${finalCount.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('�Œ Erro na migração:', error);
        process.exit(1);
    }
}

migrateSemenData();