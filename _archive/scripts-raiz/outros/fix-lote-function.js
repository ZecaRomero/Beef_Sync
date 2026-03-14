// Script para criar a função gerar_proximo_lote no banco
const { query } = require('./lib/database')

async function fixLoteFunction() {
  console.log('�Ÿ”� Criando função gerar_proximo_lote...\n')

  try {
    // 1. Verificar se a função já existe
    console.log('1. Verificando se a função existe:')
    const functionExists = await query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'gerar_proximo_lote'
      );
    `)
    
    if (functionExists.rows[0].exists) {
      console.log('   �œ… Função já existe')
    } else {
      console.log('   �Œ Função não existe, criando...')
      
      // 2. Criar a função
      await query(`
        CREATE OR REPLACE FUNCTION gerar_proximo_lote()
        RETURNS VARCHAR(100) AS $$
        DECLARE
          timestamp_part BIGINT;
          random_part INTEGER;
          lote_numero VARCHAR(100);
        BEGIN
          -- Gerar timestamp em milissegundos
          timestamp_part := EXTRACT(EPOCH FROM NOW()) * 1000;
          
          -- Gerar número aleatório de 3 dígitos
          random_part := FLOOR(RANDOM() * 1000);
          
          -- Formar o número do lote
          lote_numero := 'LOTE-' || timestamp_part || '-' || LPAD(random_part::TEXT, 3, '0');
          
          RETURN lote_numero;
        END;
        $$ LANGUAGE plpgsql;
      `)
      
      console.log('   �œ… Função criada com sucesso')
    }

    // 3. Testar a função
    console.log('\n2. Testando a função:')
    const teste = await query('SELECT gerar_proximo_lote() as numero_lote')
    console.log(`   Exemplo de lote gerado: ${teste.rows[0].numero_lote}`)

    // 4. Verificar se há registros pendentes de nitrogênio para registrar
    console.log('\n3. Verificando registros de nitrogênio recentes:')
    const nitrogenioRecente = await query(`
      SELECT * FROM abastecimento_nitrogenio 
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
      ORDER BY created_at DESC
      LIMIT 5
    `)
    
    if (nitrogenioRecente.rows.length > 0) {
      console.log(`   Encontrados ${nitrogenioRecente.rows.length} abastecimentos recentes:`)
      
      for (const abast of nitrogenioRecente.rows) {
        // Verificar se já existe lote para este abastecimento
        const loteExiste = await query(`
          SELECT id FROM lotes_operacoes 
          WHERE tipo_operacao = 'ABASTECIMENTO_NITROGENIO' 
          AND detalhes::jsonb @> $1::jsonb
        `, [JSON.stringify({ abastecimento_id: abast.id })])
        
        if (loteExiste.rows.length === 0) {
          // Criar lote para este abastecimento
          const descricao = `Abastecimento de nitrogênio - ${abast.quantidade_litros}L - Motorista: ${abast.motorista}`
          
          const detalhes = {
            abastecimento_id: abast.id,
            quantidade_litros: abast.quantidade_litros,
            valor_total: abast.valor_total,
            motorista: abast.motorista,
            data_abastecimento: abast.data_abastecimento,
            timestamp: new Date().toISOString()
          }

          await query(`
            INSERT INTO lotes_operacoes (
              numero_lote,
              tipo_operacao,
              descricao,
              detalhes,
              usuario,
              data_criacao,
              quantidade_registros,
              status,
              modulo
            ) VALUES (gerar_proximo_lote(), $1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            'ABASTECIMENTO_NITROGENIO',
            descricao,
            JSON.stringify(detalhes),
            'Sistema',
            abast.created_at || new Date(),
            1,
            'concluido',
            'ESTOQUE'
          ])

          console.log(`   �œ… Lote criado para abastecimento: ${abast.quantidade_litros}L`)
        } else {
          console.log(`   �š�️ Lote já existe para abastecimento: ${abast.quantidade_litros}L`)
        }
      }
    } else {
      console.log('   �Œ Nenhum abastecimento recente encontrado')
    }

    console.log('\n�œ… Função configurada com sucesso!')

  } catch (error) {
    console.error('�Œ Erro ao configurar função:', error)
  }
}

// Executar
fixLoteFunction()
  .then(() => {
    console.log('\n�ŸŽ� PR�“XIMOS PASSOS:')
    console.log('1. A função gerar_proximo_lote() foi criada')
    console.log('2. Novos abastecimentos de nitrogênio serão registrados automaticamente')
    console.log('3. Acesse http://localhost:3020/relatorios-lotes para ver o histórico')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })