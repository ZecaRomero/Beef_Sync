// Script para debugar o modal de observações
// Execute este script no console do navegador na página do nitrogênio

console.log('🔍 Iniciando debug do modal de observações...');

// Função para verificar o estado dos modais
function debugModalState() {
  console.log('\n📊 Estado atual dos modais:');
  
  // Verificar se os elementos existem
  const modals = document.querySelectorAll('[class*="modal"], [class*="Modal"]');
  console.log(`   Modais encontrados: ${modals.length}`);
  
  modals.forEach((modal, index) => {
    console.log(`   Modal ${index + 1}:`, {
      className: modal.className,
      style: modal.style.cssText,
      visible: modal.style.display !== 'none' && !modal.hidden,
      innerHTML: modal.innerHTML.substring(0, 100) + '...'
    });
  });
  
  // Verificar backdrop
  const backdrops = document.querySelectorAll('[class*="backdrop"], [class*="overlay"]');
  console.log(`   Backdrops encontrados: ${backdrops.length}`);
  
  // Verificar z-index
  const highZElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    return zIndex && parseInt(zIndex) > 40;
  });
  
  console.log(`   Elementos com z-index alto: ${highZElements.length}`);
  highZElements.forEach(el => {
    console.log(`     ${el.tagName}.${el.className} - z-index: ${window.getComputedStyle(el).zIndex}`);
  });
}

// Função para simular clique no badge de observação
function simulateObservationClick() {
  console.log('\n🖱️ Simulando clique no badge de observação...');
  
  const badges = document.querySelectorAll('[class*="badge"], [class*="Badge"]');
  console.log(`   Badges encontrados: ${badges.length}`);
  
  const observationBadges = Array.from(badges).filter(badge => 
    badge.textContent.toLowerCase().includes('observação') ||
    badge.textContent.toLowerCase().includes('observacao')
  );
  
  console.log(`   Badges de observação: ${observationBadges.length}`);
  
  if (observationBadges.length > 0) {
    const badge = observationBadges[0];
    console.log('   Clicando no primeiro badge de observação...');
    badge.click();
    
    // Aguardar um pouco e verificar se o modal abriu
    setTimeout(() => {
      debugModalState();
    }, 500);
  } else {
    console.log('   ❌ Nenhum badge de observação encontrado');
  }
}

// Função para verificar dados de observação
function checkObservationData() {
  console.log('\n📝 Verificando dados de observação...');
  
  // Verificar se há dados no React state (se possível)
  const reactElements = document.querySelectorAll('[data-reactroot], [id="__next"]');
  if (reactElements.length > 0) {
    console.log('   Aplicação React detectada');
    
    // Tentar encontrar elementos com observações
    const observationElements = document.querySelectorAll('*');
    const elementsWithObservation = Array.from(observationElements).filter(el => 
      el.textContent && (
        el.textContent.includes('Abasteceu todos os 10 botijões') ||
        el.textContent.includes('O grande SM 43 nao encheu tudo')
      )
    );
    
    console.log(`   Elementos com texto de observação: ${elementsWithObservation.length}`);
    elementsWithObservation.forEach((el, index) => {
      console.log(`     ${index + 1}. ${el.tagName}.${el.className}: "${el.textContent.substring(0, 50)}..."`);
    });
  }
}

// Função para verificar CSS
function checkCSS() {
  console.log('\n🎨 Verificando CSS...');
  
  // Verificar se Tailwind está carregado
  const testElement = document.createElement('div');
  testElement.className = 'fixed inset-0 bg-black bg-opacity-50 z-50';
  document.body.appendChild(testElement);
  
  const styles = window.getComputedStyle(testElement);
  const hasTailwind = styles.position === 'fixed' && styles.zIndex === '50';
  
  console.log(`   Tailwind CSS funcionando: ${hasTailwind ? '✅' : '❌'}`);
  
  document.body.removeChild(testElement);
  
  // Verificar se há conflitos de CSS
  const stylesheets = Array.from(document.styleSheets);
  console.log(`   Stylesheets carregadas: ${stylesheets.length}`);
}

// Função para verificar JavaScript
function checkJavaScript() {
  console.log('\n⚙️ Verificando JavaScript...');
  
  // Verificar se React está carregado
  console.log(`   React carregado: ${typeof React !== 'undefined' ? '✅' : '❌'}`);
  
  // Verificar se há erros no console
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args);
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalError;
    console.log(`   Erros JavaScript detectados: ${errors.length}`);
    if (errors.length > 0) {
      console.log('   Últimos erros:', errors.slice(-3));
    }
  }, 1000);
}

// Função principal de debug
function runFullDebug() {
  console.log('🚀 Executando debug completo...');
  
  debugModalState();
  checkObservationData();
  checkCSS();
  checkJavaScript();
  
  console.log('\n🎯 Para testar manualmente:');
  console.log('   1. Execute: simulateObservationClick()');
  console.log('   2. Execute: debugModalState()');
  console.log('   3. Verifique se o modal apareceu');
}

// Exportar funções para uso no console
window.debugNitrogenioModal = {
  runFullDebug,
  debugModalState,
  simulateObservationClick,
  checkObservationData,
  checkCSS,
  checkJavaScript
};

console.log('✅ Debug carregado! Execute: debugNitrogenioModal.runFullDebug()');

// Executar debug inicial
runFullDebug();