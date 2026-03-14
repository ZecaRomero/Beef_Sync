/**
 * UtilitÃ¡rio para migrar dados do localStorage para PostgreSQL
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

    // Verificar se hÃ¡ dados para migrar
    const totalItens = 
      dadosParaMigrar.nfsReceptoras.length +
      dadosParaMigrar.naturezasOperacao.length +
      dadosParaMigrar.origensReceptoras.length;

    if (totalItens === 0) {
      console.log('âÅ“â€¦ Nenhum dado para migrar');
      return {
        success: true,
        message: 'Nenhum dado encontrado no localStorage',
        migrated: 0
      };
    }

    console.log(`ðÅ¸â€œ¦ Encontrados ${totalItens} itens para migrar:`);
    console.log(`   - Notas Fiscais: ${dadosParaMigrar.nfsReceptoras.length}`);
    console.log(`   - Naturezas de OperaÃ§Ã£o: ${dadosParaMigrar.naturezasOperacao.length}`);
    console.log(`   - Origens de Receptoras: ${dadosParaMigrar.origensReceptoras.length}`);

    // Enviar para API de migraÃ§Ã£o
    const response = await fetch('/api/migrate-localstorage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosParaMigrar)
    });

    if (!response.ok) {
      throw new Error(`Erro na migraÃ§Ã£o: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('\nâÅ“â€¦ MigraÃ§Ã£o concluÃ­da com sucesso!');
    console.log(`   - NFs migradas: ${result.results.nfsMigradas}`);
    console.log(`   - Naturezas migradas: ${result.results.naturezasMigradas}`);
    console.log(`   - Origens migradas: ${result.results.origensMigradas}`);

    if (result.results.erros.length > 0) {
      console.warn(`\nâÅ¡ ï¸� ${result.results.erros.length} erros durante a migraÃ§Ã£o:`);
      result.results.erros.forEach(erro => {
        console.warn(`   - ${erro.tipo}: ${erro.nome || erro.nf} - ${erro.erro}`);
      });
    }

    // Perguntar se deseja limpar localStorage
    const limpar = window.confirm(
      `MigraÃ§Ã£o concluÃ­da!\n\n` +
      `âÅ“â€¦ ${result.results.nfsMigradas} notas fiscais\n` +
      `âÅ“â€¦ ${result.results.naturezasMigradas} naturezas de operaÃ§Ã£o\n` +
      `âÅ“â€¦ ${result.results.origensMigradas} origens de receptoras\n\n` +
      `Deseja limpar os dados do localStorage?`
    );

    if (limpar) {
      localStorage.removeItem('nfsReceptoras');
      localStorage.removeItem('naturezasOperacao');
      localStorage.removeItem('origensReceptoras');
      console.log('ðÅ¸§¹ localStorage limpo com sucesso!');
    }

    return {
      success: true,
      message: 'MigraÃ§Ã£o concluÃ­da com sucesso',
      results: result.results
    };

  } catch (error) {
    console.error('â�Å’ Erro durante a migraÃ§Ã£o:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
}

// FunÃ§Ã£o para verificar se hÃ¡ dados no localStorage
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
  console.log('ðÅ¸â€™¡ FunÃ§Ãµes disponÃ­veis:');
  console.log('   - migrateLocalStorageToDatabase() - Migrar dados para PostgreSQL');
  console.log('   - checkLocalStorageData() - Verificar dados no localStorage');
}

