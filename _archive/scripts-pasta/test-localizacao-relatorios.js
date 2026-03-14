const { query } = require('../lib/database');

/**
 * Script para testar e verificar dados de localização nos relatórios
 */

async function verificarDados() {
  console.log('🔍 Verificando dados para teste de localização...\n');

  try {
    // 1. Verificar animais cadastrados
    console.log('1️⃣ Verificando animais cadastrados...');
    const animais = await query(`
      SELECT id, serie, rg, raca, situacao 
      FROM animais 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (animais.rows.length === 0) {
      console.log('❌ Nenhum animal cadastrado no sistema');
      console.log('   Cadastre alguns animais primeiro!\n');
      return;
    }
    
    console.log(`✅ ${animais.rows.length} animais encontrados (mostrando últimos 5):`);
    animais.rows.forEach(a => {
      console.log(`   - ${a.serie}-${a.rg} | ${a.raca} | ${a.situacao}`);
    });
    console.log('');

    // 2. Verificar localizações existentes
    console.log('2️⃣ Verificando localizações cadastradas...');
    const localizacoes = await query(`
      SELECT 
        l.*,
        a.serie,
        a.rg,
        a.raca
      FROM localizacoes_animais l
      JOIN animais a ON l.animal_id = a.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);
    
    if (localizacoes.rows.length === 0) {
      console.log('⚠️ Nenhuma localização cadastrada');
      console.log('   Vou criar algumas localizações de teste...\n');
      
      // Criar localizações de teste
      await criarLocalizacoesTest(animais.rows);
    } else {
      console.log(`✅ ${localizacoes.rows.length} localizações encontradas:`);
      localizacoes.rows.forEach(l => {
        const atual = l.data_saida ? '❌' : '✅';
        console.log(`   ${atual} ${l.serie}-${l.rg} | ${l.piquete} | Entrada: ${formatarData(l.data_entrada)}`);
      });
      console.log('');
    }

    // 3. Verificar lotes no sistema
    console.log('3️⃣ Verificando lotes com animais...');
    const lotes = await query(`
      SELECT 
        numero_lote,
        modulo,
        tipo_operacao,
        descricao,
        data_criacao
      FROM lotes_operacoes
      WHERE modulo = 'ANIMAIS'
      ORDER BY data_criacao DESC
      LIMIT 5
    `);
    
    if (lotes.rows.length === 0) {
      console.log('⚠️ Nenhum lote de animais encontrado');
      console.log('   Os lotes são criados automaticamente ao cadastrar/editar animais\n');
    } else {
      console.log(`✅ ${lotes.rows.length} lotes de animais encontrados:`);
      lotes.rows.forEach(l => {
        console.log(`   - ${l.numero_lote} | ${l.tipo_operacao} | ${formatarData(l.data_criacao)}`);
      });
      console.log('');
    }

    // 4. Instruções finais
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 COMO TESTAR NO APP:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1. Acesse: http://localhost:3000/relatorios-lotes');
    console.log('2. Procure por lotes do módulo "ANIMAIS"');
    console.log('3. Clique na seta (▼) para expandir os detalhes');
    console.log('4. Você verá a seção "📍 Localização Atual"');
    console.log('');
    console.log('💡 Dica: Use o filtro "Módulo" e selecione "ANIMAIS"');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  }
}

async function criarLocalizacoesTest(animais) {
  console.log('📍 Criando localizações de teste...\n');

  const piquetes = ['Piquete 1', 'Piquete 2', 'Piquete 3', 'Piquete Central', 'Piquete Norte'];
  const motivos = [
    'Rotação de pastagem',
    'Manejo sanitário',
    'Separação por categoria',
    'Observação veterinária',
    'Preparação para venda'
  ];

  try {
    for (let i = 0; i < Math.min(3, animais.length); i++) {
      const animal = animais[i];
      const piquete = piquetes[i % piquetes.length];
      const motivo = motivos[i % motivos.length];
      
      // Criar histórico de movimentações
      const dataAntiga = new Date();
      dataAntiga.setDate(dataAntiga.getDate() - 30);
      
      const dataMedia = new Date();
      dataMedia.setDate(dataMedia.getDate() - 15);
      
      const dataAtual = new Date();
      dataAtual.setDate(dataAtual.getDate() - 5);

      // Localização antiga (já saiu)
      await query(`
        INSERT INTO localizacoes_animais (
          animal_id, piquete, data_entrada, data_saida, 
          motivo_movimentacao, usuario_responsavel
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        animal.id,
        'Piquete Antigo',
        dataAntiga.toISOString().split('T')[0],
        dataMedia.toISOString().split('T')[0],
        'Teste - movimentação antiga',
        'Sistema Teste'
      ]);

      // Localização atual (ainda está)
      await query(`
        INSERT INTO localizacoes_animais (
          animal_id, piquete, data_entrada, 
          motivo_movimentacao, usuario_responsavel, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        animal.id,
        piquete,
        dataAtual.toISOString().split('T')[0],
        motivo,
        'Sistema Teste',
        `Animal ${animal.serie}-${animal.rg} em boas condições`
      ]);

      console.log(`✅ Localização criada: ${animal.serie}-${animal.rg} → ${piquete}`);
    }

    console.log('\n✅ Localizações de teste criadas com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro ao criar localizações:', error.message);
  }
}

function formatarData(data) {
  if (!data) return 'N/A';
  return new Date(data).toLocaleDateString('pt-BR');
}

// Executar verificação
verificarDados()
  .then(() => {
    console.log('✅ Verificação concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });

