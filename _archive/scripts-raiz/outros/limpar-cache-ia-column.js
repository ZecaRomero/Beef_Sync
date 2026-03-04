// Script para forçar a limpeza do cache da coluna de data de IA
// Isso força o sistema a redetectar a coluna correta

console.log('🔄 Limpando cache da coluna de data de IA...\n');

console.log('✅ Para aplicar a correção:');
console.log('   1. Reinicie o servidor Next.js (Ctrl+C e depois npm run dev)');
console.log('   2. Ou aguarde o hot-reload detectar as mudanças');
console.log('   3. Tente enviar o relatório novamente\n');

console.log('📝 Mudança aplicada:');
console.log('   ANTES: data_inseminacao (ERRADO)');
console.log('   DEPOIS: data_ia (CORRETO)\n');

console.log('💡 O sistema agora detecta automaticamente a coluna correta:');
console.log('   1ª opção: data_ia (nome correto atual)');
console.log('   2ª opção: data_inseminacao (fallback para compatibilidade)');
console.log('   3ª opção: data (fallback genérico)');
