/**
 * Utilitário para migrar dados do localStorage para PostgreSQL
 * Use este script no navegador ou em um componente React
 */

export async function migrateLocalStorageToDatabase() {
  try {
    // Buscar dados do localStorage
    const nfsReceptoras = localStorage.getItem('nfsReceptoras');
    const naturezasOperacao = localStorage.getItem('naturezasOperacao');
    const origensReceptoras = localStorage.getItem('origensReceptoras');

    const dadosParaMigrar = {
      nfsReceptoras: nfsReceptoras ? JSON.parse(nfsReceptoras) : [],
      naturezasOperacao: naturezasOperacao ? JSON.parse(naturezasOperacao) : [],
      origensReceptoras: origensReceptoras ? JSON.parse(origensReceptoras) : []
    };

    // Verificar se há dados para migrar
    const totalItens = 
      dadosParaMigrar.nfsReceptoras.length +
      dadosParaMigrar.naturezasOperacao.length +
      dadosParaMigrar.origensReceptoras.length;

    if (totalItens === 0) {
      console.log('✅ Nenhum dado para migrar');
      return {
        success: true,
        message: 'Nenhum dado encontrado no localStorage',
        migrated: 0
      };
    }

    console.log(`📦 Encontrados ${totalItens} itens para migrar:`);
    console.log(`   - Notas Fiscais: ${dadosParaMigrar.nfsReceptoras.length}`);
    console.log(`   - Naturezas de Operação: ${dadosParaMigrar.naturezasOperacao.length}`);
    console.log(`   - Origens de Receptoras: ${dadosParaMigrar.origensReceptoras.length}`);

    // Enviar para API de migração
    const response = await fetch('/api/migrate-localstorage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosParaMigrar)
    });

    if (!response.ok) {
      throw new Error(`Erro na migração: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('\n✅ Migração concluída com sucesso!');
    console.log(`   - NFs migradas: ${result.results.nfsMigradas}`);
    console.log(`   - Naturezas migradas: ${result.results.naturezasMigradas}`);
    console.log(`   - Origens migradas: ${result.results.origensMigradas}`);

    if (result.results.erros.length > 0) {
      console.warn(`\n⚠️ ${result.results.erros.length} erros durante a migração:`);
      result.results.erros.forEach(erro => {
        console.warn(`   - ${erro.tipo}: ${erro.nome || erro.nf} - ${erro.erro}`);
      });
    }

    // Perguntar se deseja limpar localStorage
    const limpar = window.confirm(
      `Migração concluída!\n\n` +
      `✅ ${result.results.nfsMigradas} notas fiscais\n` +
      `✅ ${result.results.naturezasMigradas} naturezas de operação\n` +
      `✅ ${result.results.origensMigradas} origens de receptoras\n\n` +
      `Deseja limpar os dados do localStorage?`
    );

    if (limpar) {
      localStorage.removeItem('nfsReceptoras');
      localStorage.removeItem('naturezasOperacao');
      localStorage.removeItem('origensReceptoras');
      console.log('🧹 localStorage limpo com sucesso!');
    }

    return {
      success: true,
      message: 'Migração concluída com sucesso',
      results: result.results
    };

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
}

// Função para verificar se há dados no localStorage
export function checkLocalStorageData() {
  const nfsReceptoras = localStorage.getItem('nfsReceptoras');
  const naturezasOperacao = localStorage.getItem('naturezasOperacao');
  const origensReceptoras = localStorage.getItem('origensReceptoras');

  const counts = {
    nfsReceptoras: nfsReceptoras ? JSON.parse(nfsReceptoras).length : 0,
    naturezasOperacao: naturezasOperacao ? JSON.parse(naturezasOperacao).length : 0,
    origensReceptoras: origensReceptoras ? JSON.parse(origensReceptoras).length : 0
  };

  const total = counts.nfsReceptoras + counts.naturezasOperacao + counts.origensReceptoras;

  return {
    hasData: total > 0,
    counts,
    total
  };
}

// Para usar no console do navegador:
if (typeof window !== 'undefined') {
  window.migrateLocalStorageToDatabase = migrateLocalStorageToDatabase;
  window.checkLocalStorageData = checkLocalStorageData;
  console.log('💡 Funções disponíveis:');
  console.log('   - migrateLocalStorageToDatabase() - Migrar dados para PostgreSQL');
  console.log('   - checkLocalStorageData() - Verificar dados no localStorage');
}

