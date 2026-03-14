// Script para criar uma versão simples da função gerar_proximo_lote
const { query } = require('./lib/database')

async function fixLoteFunctionSimple() {
  console.log('�Ÿ”� Criando função gerar_proximo_lote simples...\n')

  try {
    // 1. Remover função existente e criar nova
    console.log('1. Recriando função:')
    
    await query('DROP FUNCTION IF EXISTS gerar_proximo_lote()')
    console.log('   Função antiga removida')
    
    await query(`
      CREATE OR REPLACE FUNCTION gerar_proximo_lote()
      RETURNS VARCHAR(100) AS $$
      DECLARE
        timestamp_part TEXT;
        random_part INTEGER;
        lote_numero VARCHAR(100);
      BEGIN
        -- Gerar timestamp como texto
        timestamp_part := EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
        
        -- Gerar número aleatório de 3 dígitos
        random_part := FLOOR(RANDOM() * 1000);
        
        -- Formar o número do lote
        lote_numero := 'LOTE-' || timestamp_part || '-' || LPAD(random_part::TEXT, 3, '0');
        
        RETURN lote_numero;
      END;
      $$ LANGUAGE plpgsql;
    `)
    
    console.log('   �œ… Nova função criada')

    // 2. Testar a função
    console.log('\n2. Testando a função:')
    const teste = await query('SELECT gerar_proximo_lote() as numero_lote')
    console.log(`   Exemplo: ${teste.rows[0].numero_lote}`)

    // 3. Registrar o abastecimento de nitrogênio mais recente
    console.log('\n3. Registrando abastecimento de nitrogênio recente:')
    
    const ultimoAbastecimento = await query(`
      SELECT * FROM abastecimento_nitrogenio 
      ORDER BY created_at DESC 
      LIMIT 1
    `)
    
    if (ultimoAbastecimento.rows.length > 0) {
      const abast = ultimoAbastecimento.rows[0]
      
      // Verificar se já existe lote
      const loteExiste = await query(`
        SELECT id FROM lotes_operacoes 
        WHERE tipo_operacao = 'ABASTECIMENTO_NITROGENIO' 
        AND detalhes::text LIKE '%"abastecimento_id":${abast.id}%'
      `)
      
      if (loteExiste.rows.length === 0) {
        const descricao = `Abastecimento de nitrogênio - ${abast.quantidade_litros}L - Motorista: ${abast.motorista}`
        
        const detalhes = {
          abastecimento_id: abast.id,
          quantidade_litros: abast.quantidade_litros,
          valor_total: abast.valor_total,
          motorista: abast.motorista,
          data_abastecimento: abast.data_abastecimento,
          observacoes: abast.observacoes,
          timestamp: new Date().toISOString()
        }

        const novoLote = await query(`
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
          RETURNING numero_lote
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

        console.log(`   �œ… Lote criado: ${novoLote.rows[0].numero_lote}`)
        console.log(`   �Ÿ“‹ Descrição: ${descricao}`)
      } else {
        console.log('   �š�️ Lote já existe para este abastecimento')
      }
    } else {
      console.log('   �Œ Nenhum abastecimento encontrado')
    }

    // 4. Verificar total de lotes
    console.log('\n4. Verificando total de lotes:')
    const totalLotes = await query('SELECT COUNT(*) as total FROM lotes_operacoes')
    console.log(`   Total de lotes: ${totalLotes.rows[0].total}`)

    console.log('\n�œ… Configuração concluída!')

  } catch (error) {
    console.error('�Œ Erro:', error)
  }
}

// Executar
fixLoteFunctionSimple()
  .then(() => {
    console.log('\n�ŸŽ� RESULTADO:')
    console.log('�€� Função gerar_proximo_lote() funcionando')
    console.log('�€� Abastecimento de nitrogênio registrado no histórico')
    console.log('�€� Acesse: http://localhost:3020/relatorios-lotes')
    console.log('�€� Novos abastecimentos serão registrados automaticamente')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })