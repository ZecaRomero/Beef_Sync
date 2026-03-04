const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function sincronizarDados(arquivoJson) {
  console.log('🔄 SINCRONIZANDO DADOS DO LOCALSTORAGE COM POSTGRESQL\n');
  console.log('='.repeat(60));

  try {
    // 1. Ler arquivo JSON
    console.log('\n📂 1. Lendo arquivo JSON...');
    if (!fs.existsSync(arquivoJson)) {
      throw new Error(`Arquivo não encontrado: ${arquivoJson}`);
    }

    const dados = JSON.parse(fs.readFileSync(arquivoJson, 'utf8'));
    console.log(`✅ Arquivo lido: ${arquivoJson}`);
    console.log(`📅 Data do backup: ${dados.timestamp}`);

    const stats = {
      animais: { total: 0, novos: 0, atualizados: 0, erros: 0 },
      mortes: { total: 0, novos: 0, erros: 0 },
      dna: { total: 0, novos: 0, erros: 0 },
      nitrogenio: { total: 0, novos: 0, erros: 0 },
      exames: { total: 0, novos: 0, erros: 0 },
      custos: { total: 0, novos: 0, erros: 0 }
    };

    // 2. Sincronizar Animais
    if (dados.animals && dados.animals.length > 0) {
      console.log(`\n🐄 2. Sincronizando ${dados.animals.length} animais...`);
      stats.animais.total = dados.animals.length;

      for (const animal of dados.animals) {
        try {
          // Verificar se animal já existe
          const existe = await pool.query(
            'SELECT id FROM animais WHERE serie = $1 AND rg = $2',
            [animal.serie, animal.rg]
          );

          if (existe.rows.length > 0) {
            // Atualizar animal existente
            await pool.query(`
              UPDATE animais SET
                nome = $1, situacao = $2, peso = $3, meses = $4,
                pai = $5, mae = $6, avo_materno = $7, receptora = $8,
                observacoes = $9, updated_at = CURRENT_TIMESTAMP
              WHERE serie = $10 AND rg = $11
            `, [
              animal.nome, animal.situacao, animal.peso, animal.meses,
              animal.pai, animal.mae, animal.avoMaterno || animal.avo_materno,
              animal.receptora, animal.observacoes,
              animal.serie, animal.rg
            ]);
            stats.animais.atualizados++;
            console.log(`   ✅ Atualizado: ${animal.serie}-${animal.rg}`);
          } else {
            // Inserir novo animal
            await pool.query(`
              INSERT INTO animais (
                nome, serie, rg, sexo, raca, data_nascimento, peso, meses,
                situacao, pai, mae, avo_materno, receptora, observacoes,
                custo_total, valor_venda, is_fiv
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `, [
              animal.nome, animal.serie, animal.rg, animal.sexo, animal.raca,
              animal.dataNascimento || animal.data_nascimento, animal.peso, animal.meses,
              animal.situacao || 'Ativo', animal.pai, animal.mae,
              animal.avoMaterno || animal.avo_materno, animal.receptora,
              animal.observacoes, animal.custoTotal || 0,
              animal.valorVenda || null, animal.isFiv || false
            ]);
            stats.animais.novos++;
            console.log(`   ✅ Novo: ${animal.serie}-${animal.rg}`);
          }
        } catch (error) {
          stats.animais.erros++;
          console.error(`   ❌ Erro ao sincronizar ${animal.serie}-${animal.rg}:`, error.message);
        }
      }
    }

    // 3. Sincronizar Mortes
    if (dados.deaths && dados.deaths.length > 0) {
      console.log(`\n💀 3. Sincronizando ${dados.deaths.length} mortes...`);
      stats.mortes.total = dados.deaths.length;

      for (const morte of dados.deaths) {
        try {
          // Buscar ID do animal
          const animal = await pool.query(
            'SELECT id FROM animais WHERE serie = $1 AND rg = $2',
            [morte.serie, morte.rg]
          );

          if (animal.rows.length === 0) {
            console.warn(`   ⚠️ Animal não encontrado: ${morte.serie}-${morte.rg}`);
            stats.mortes.erros++;
            continue;
          }

          const animalId = animal.rows[0].id;

          // Verificar se morte já existe
          const morteExiste = await pool.query(
            'SELECT id FROM mortes WHERE animal_id = $1',
            [animalId]
          );

          if (morteExiste.rows.length === 0) {
            // Inserir morte
            await pool.query(`
              INSERT INTO mortes (
                animal_id, data_morte, causa_morte, observacoes, valor_perda
              ) VALUES ($1, $2, $3, $4, $5)
            `, [
              animalId,
              morte.dataMorte || morte.data_morte || new Date().toISOString().split('T')[0],
              morte.causa || morte.causa_morte || 'Não informado',
              morte.observacoes,
              morte.valorPerda || morte.valor_perda || 0
            ]);

            // Atualizar situação do animal
            await pool.query(
              'UPDATE animais SET situacao = $1 WHERE id = $2',
              ['Morto', animalId]
            );

            stats.mortes.novos++;
            console.log(`   ✅ Morte registrada: ${morte.serie}-${morte.rg}`);
          } else {
            console.log(`   ⚠️ Morte já existe: ${morte.serie}-${morte.rg}`);
          }
        } catch (error) {
          stats.mortes.erros++;
          console.error(`   ❌ Erro ao sincronizar morte:`, error.message);
        }
      }
    }

    // 4. Sincronizar DNA
    if (dados.dna && dados.dna.length > 0) {
      console.log(`\n🧬 4. Sincronizando ${dados.dna.length} registros de DNA...`);
      stats.dna.total = dados.dna.length;

      for (const dna of dados.dna) {
        try {
          // Verificar se já existe
          const existe = await pool.query(
            'SELECT id FROM dna_animais WHERE serie = $1 AND rg = $2',
            [dna.serie, dna.rg]
          );

          if (existe.rows.length === 0) {
            await pool.query(`
              INSERT INTO dna_animais (
                serie, rg, laboratorio, data_envio, custo, observacoes
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              dna.serie, dna.rg, dna.laboratorio,
              dna.dataEnvio || dna.data_envio,
              dna.custo, dna.observacoes
            ]);
            stats.dna.novos++;
            console.log(`   ✅ DNA registrado: ${dna.serie}-${dna.rg}`);
          }
        } catch (error) {
          stats.dna.erros++;
          console.error(`   ❌ Erro ao sincronizar DNA:`, error.message);
        }
      }
    }

    // 5. Sincronizar Nitrogênio
    if (dados.nitrogenio && dados.nitrogenio.length > 0) {
      console.log(`\n❄️ 5. Sincronizando ${dados.nitrogenio.length} registros de nitrogênio...`);
      stats.nitrogenio.total = dados.nitrogenio.length;

      for (const n of dados.nitrogenio) {
        try {
          await pool.query(`
            INSERT INTO abastecimento_nitrogenio (
              data, quantidade, fornecedor, valor, observacoes
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            n.data, n.quantidade, n.fornecedor, n.valor, n.observacoes
          ]);
          stats.nitrogenio.novos++;
          console.log(`   ✅ Nitrogênio registrado: ${n.data}`);
        } catch (error) {
          stats.nitrogenio.erros++;
          console.error(`   ❌ Erro ao sincronizar nitrogênio:`, error.message);
        }
      }
    }

    // 6. Sincronizar Exames
    if (dados.exames && dados.exames.length > 0) {
      console.log(`\n🔬 6. Sincronizando ${dados.exames.length} exames andrológicos...`);
      stats.exames.total = dados.exames.length;

      for (const exame of dados.exames) {
        try {
          await pool.query(`
            INSERT INTO exames_andrologicos (
              rg, touro, data_exame, veterinario, motilidade, vigor,
              concentracao, defeitos_maiores, defeitos_menores,
              resultado, observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            exame.rg, exame.touro, exame.dataExame || exame.data_exame,
            exame.veterinario, exame.motilidade, exame.vigor,
            exame.concentracao, exame.defeitosMaiores, exame.defeitosMenores,
            exame.resultado, exame.observacoes
          ]);
          stats.exames.novos++;
          console.log(`   ✅ Exame registrado: ${exame.touro}`);
        } catch (error) {
          stats.exames.erros++;
          console.error(`   ❌ Erro ao sincronizar exame:`, error.message);
        }
      }
    }

    // 7. Sincronizar Custos
    if (dados.custos && dados.custos.length > 0) {
      console.log(`\n💰 7. Sincronizando ${dados.custos.length} custos...`);
      stats.custos.total = dados.custos.length;

      for (const custo of dados.custos) {
        try {
          // Buscar ID do animal
          const animal = await pool.query(
            'SELECT id FROM animais WHERE serie = $1 AND rg = $2',
            [custo.serie, custo.rg]
          );

          if (animal.rows.length === 0) {
            console.warn(`   ⚠️ Animal não encontrado: ${custo.serie}-${custo.rg}`);
            stats.custos.erros++;
            continue;
          }

          await pool.query(`
            INSERT INTO custos (
              animal_id, tipo, subtipo, valor, data, observacoes, detalhes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            animal.rows[0].id, custo.tipo, custo.subtipo,
            custo.valor, custo.data, custo.observacoes,
            JSON.stringify(custo.detalhes || {})
          ]);
          stats.custos.novos++;
          console.log(`   ✅ Custo registrado: ${custo.tipo}`);
        } catch (error) {
          stats.custos.erros++;
          console.error(`   ❌ Erro ao sincronizar custo:`, error.message);
        }
      }
    }

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✅ SINCRONIZAÇÃO CONCLUÍDA!\n');
    console.log('📊 RESUMO:');
    console.log(`\n🐄 Animais:`);
    console.log(`   Total: ${stats.animais.total}`);
    console.log(`   Novos: ${stats.animais.novos}`);
    console.log(`   Atualizados: ${stats.animais.atualizados}`);
    console.log(`   Erros: ${stats.animais.erros}`);
    
    console.log(`\n💀 Mortes:`);
    console.log(`   Total: ${stats.mortes.total}`);
    console.log(`   Novos: ${stats.mortes.novos}`);
    console.log(`   Erros: ${stats.mortes.erros}`);
    
    console.log(`\n🧬 DNA:`);
    console.log(`   Total: ${stats.dna.total}`);
    console.log(`   Novos: ${stats.dna.novos}`);
    console.log(`   Erros: ${stats.dna.erros}`);
    
    console.log(`\n❄️ Nitrogênio:`);
    console.log(`   Total: ${stats.nitrogenio.total}`);
    console.log(`   Novos: ${stats.nitrogenio.novos}`);
    console.log(`   Erros: ${stats.nitrogenio.erros}`);
    
    console.log(`\n🔬 Exames:`);
    console.log(`   Total: ${stats.exames.total}`);
    console.log(`   Novos: ${stats.exames.novos}`);
    console.log(`   Erros: ${stats.exames.erros}`);
    
    console.log(`\n💰 Custos:`);
    console.log(`   Total: ${stats.custos.total}`);
    console.log(`   Novos: ${stats.custos.novos}`);
    console.log(`   Erros: ${stats.custos.erros}`);

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Erro durante sincronização:', error);
    console.error('Detalhes:', error.message);
  } finally {
    await pool.end();
  }
}

// Verificar argumentos
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('❌ Uso: node sincronizar-localStorage.js <arquivo.json>');
  console.log('\nExemplo:');
  console.log('  node sincronizar-localStorage.js localStorage-backup-2026-02-11.json');
  process.exit(1);
}

const arquivoJson = args[0];
sincronizarDados(arquivoJson);
