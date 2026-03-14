import { generateExcelReport } from './utils/reportGenerator.js'
import fs from 'fs'

async function testExcelGeneration() {
  console.log('🧪 Testando geração de Excel corrigida...')
  
  try {
    // Dados de teste
    const reportData = {
      success: true,
      data: {
        data: {
          monthly_summary: {
            nascimentos: {
              total: 15,
              machos: 8,
              femeas: 7,
              peso_medio: 32.5
            },
            vendas: {
              total: 5,
              valor_total: 25000,
              valor_medio: 5000
            },
            mortes: {
              total: 2,
              machos: 1,
              femeas: 1
            },
            estatisticas_gerais: {
              total_rebanho: 150,
              total_machos: 75,
              total_femeas: 75,
              ativos: 148
            }
          },
          location_report: {
            estatisticas: {
              total_animais: 150,
              animais_localizados: 145,
              animais_sem_localizacao: 5,
              total_piquetes: 8
            },
            localizacao_atual: [
              {
                serie: 'BS',
                rg: '001',
                raca: 'Nelore',
                sexo: 'M',
                piquete: 'Piquete 1',
                data_entrada: '2024-01-15',
                usuario_responsavel: 'João Silva'
              },
              {
                serie: 'BS',
                rg: '002',
                raca: 'Angus',
                sexo: 'F',
                piquete: 'Piquete 2',
                data_entrada: '2024-01-20',
                usuario_responsavel: 'Maria Santos'
              }
            ],
            animais_por_piquete: [
              {
                piquete: 'Piquete 1',
                total_animais: 25,
                machos: 12,
                femeas: 13,
                racas: 'Nelore, Angus'
              },
              {
                piquete: 'Piquete 2',
                total_animais: 30,
                machos: 15,
                femeas: 15,
                racas: 'Brahman, Nelore'
              }
            ],
            animais_sem_localizacao: [
              {
                serie: 'BS',
                rg: '150',
                raca: 'Nelore',
                sexo: 'M'
              }
            ]
          }
        }
      },
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      generatedAt: new Date().toISOString()
    }

    const period = {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    }

    console.log('📊 Gerando relatório Excel...')
    const buffer = await generateExcelReport(reportData, period)
    
    console.log(`✅ Excel gerado com sucesso! Tamanho: ${buffer.length} bytes`)
    
    // Salvar arquivo para teste
    fs.writeFileSync('teste-excel-corrigido.xlsx', buffer)
    console.log('💾 Arquivo salvo como: teste-excel-corrigido.xlsx')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro ao gerar Excel:', error.message)
    console.error('Stack:', error.stack)
    return false
  }
}

// Executar teste
testExcelGeneration().then(success => {
  if (success) {
    console.log('\n🎉 Teste concluído com sucesso!')
  } else {
    console.log('\n💥 Teste falhou!')
  }
  process.exit(success ? 0 : 1)
})