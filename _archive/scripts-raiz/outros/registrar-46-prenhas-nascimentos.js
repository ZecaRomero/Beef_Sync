// Script para registrar as 46 receptoras prenhas no menu de Nascimentos
const API_URL = 'http://localhost:3020';

async function registrarPrenhasNascimentos() {
  try {
    console.log('🤰 Registrando 46 receptoras prenhas em Nascimentos...\n');
    
    // 1. Buscar receptoras com DG positivo
    const responseAnimais = await fetch(`${API_URL}/api/animals`);
    const dataAnimais = await responseAnimais.json();
    const animais = dataAnimais.data || dataAnimais || [];
    
    const receptorasPrenhas = animais.filter(a => {
      const resultado = (a.resultado_dg || '').toLowerCase();
      return resultado.includes('pren') || resultado.includes('positiv');
    });
    
    console.log(`📊 Total de receptoras com DG positivo: ${receptorasPrenhas.length}\n`);
    
    if (receptorasPrenhas.length === 0) {
      console.log('⚠️ Nenhuma receptora com DG positivo encontrada!');
      return;
    }
    
    // 2. Buscar notas fiscais de receptoras para obter data_te
    const responseNFs = await fetch(`${API_URL}/api/notas-fiscais`);
    const dataNFs = await responseNFs.json();
    const nfs = dataNFs.data || dataNFs || [];
    const nfsReceptoras = nfs.filter(nf => nf.eh_receptoras);
    
    console.log(`📄 Total de NFs de receptoras: ${nfsReceptoras.length}\n`);
    
    // 3. Buscar transferências de embriões
    const responseTEs = await fetch(`${API_URL}/api/transferencias-embrioes`);
    const dataTEs = await responseTEs.json();
    const tes = dataTEs.data || dataTEs || [];
    
    console.log(`💉 Total de TEs registradas: ${tes.length}\n`);
    
    // 4. Para cada receptora prenha, registrar em nascimentos
    let sucessos = 0;
    let erros = 0;
    const detalhes = [];
    
    for (const receptora of receptorasPrenhas) {
      const letra = receptora.serie || '';
      const numero = receptora.rg || '';
      const rgCompleto = `${letra} ${numero}`.trim();
      
      try {
        // Buscar data_te pela NF
        let dataTE = null;
        let touro = '';
        let doadora = '';
        
        // Tentar pela NF
        const nfReceptora = nfsReceptoras.find(nf => 
          nf.receptora_letra === letra && nf.receptora_numero === numero
        );
        
        if (nfReceptora && nfReceptora.data_te) {
          dataTE = nfReceptora.data_te;
        } else {
          // Fallback: tentar pela tabela de TEs
          const nomeReceptora = rgCompleto;
          const te = tes.find(t => {
            const receptoraNome = (t.receptora_nome || '').replace(/\s+/g, '').toLowerCase();
            const nomeComparar = nomeReceptora.replace(/\s+/g, '').toLowerCase();
            return receptoraNome === nomeComparar;
          });
          
          if (te) {
            dataTE = te.data_te;
            touro = te.touro || '';
            doadora = te.doadora_nome || '';
          }
        }
        
        // Se não tem data_te, usar data_chegada como fallback
        if (!dataTE && receptora.data_chegada) {
          dataTE = receptora.data_chegada;
          console.log(`ℹ️ ${rgCompleto} - Usando data_chegada como fallback`);
        }
        
        if (!dataTE) {
          console.log(`⚠️ ${rgCompleto} - Sem data de TE ou data_chegada, pulando...`);
          erros++;
          detalhes.push({ rg: rgCompleto, erro: 'Sem data de TE ou data_chegada' });
          continue;
        }
        
        // Calcular data prevista de parto: TE + 9 meses
        const teDate = new Date(dataTE);
        const partoPrevisto = new Date(teDate);
        partoPrevisto.setMonth(partoPrevisto.getMonth() + 9);
        
        const formatBR = (d) => {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        };
        
        const prevPartoStr = formatBR(partoPrevisto);
        const dataDG = receptora.data_dg || new Date().toISOString().split('T')[0];
        
        // Registrar em nascimentos usando o schema correto
        const payload = {
          serie: letra,
          rg: numero,
          sexo: 'Fêmea', // Receptoras são sempre fêmeas
          data_nascimento: partoPrevisto.toISOString().split('T')[0], // Data prevista do parto
          observacoes: `DG positivo em ${formatBR(new Date(dataDG))}. Parto previsto 9 meses após a TE. Touro: ${touro || 'N/A'}. Doadora: ${doadora || 'N/A'}.`
        };
        
        const response = await fetch(`${API_URL}/api/nascimentos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          console.log(`✅ ${rgCompleto} - Registrada em Nascimentos (Parto previsto: ${prevPartoStr})`);
          sucessos++;
          detalhes.push({ rg: rgCompleto, sucesso: true, partoPrevisto: prevPartoStr });
        } else {
          const error = await response.text();
          console.log(`❌ ${rgCompleto} - Erro ao registrar: ${error}`);
          erros++;
          detalhes.push({ rg: rgCompleto, erro: error });
        }
        
      } catch (error) {
        console.log(`❌ ${rgCompleto} - Erro: ${error.message}`);
        erros++;
        detalhes.push({ rg: rgCompleto, erro: error.message });
      }
    }
    
    console.log(`\n📈 Resumo Final:`);
    console.log(`   ✅ Registradas com sucesso: ${sucessos}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`\n💡 Agora verifique o menu Reprodução > Nascimentos para ver as 46 receptoras prenhas!`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor está rodando em http://localhost:3020');
  }
}

registrarPrenhasNascimentos();
