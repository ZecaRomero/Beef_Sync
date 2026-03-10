# Custos Automáticos - Beef Sync

Este documento detalha todos os custos automáticos que podem ser aplicados aos animais através do botão "Aplicar Custos Automáticos" na página de Custos.

## Como Acessar

1. Acesse: `http://localhost:3020/custos`
2. Clique no botão azul "Aplicar Custos Automáticos" no topo da página
3. Confirme a aplicação dos custos

## Custos Aplicados Automaticamente

### 1. RGN (Registro Genealógico Nascimento) - R$ 36,90
- **Tipo:** ABCZ
- **Subtipo:** RGN
- **Regra:** Aplicado para animais cuja "Situação ABCZ" contém "POSSUI RGN" ou "POSSUEM RGN"
- **Condição:** Animal deve estar com situação "Ativo"
- **Aplicação:** Uma única vez por animal

### 2. RGD (Registro Genealógico Definitivo) - R$ 89,10
- **Tipo:** ABCZ
- **Subtipo:** RGD
- **Regra:** Aplicado para animais cuja "Situação ABCZ" contém "POSSUI RGD" ou "POSSUEM RGD"
- **Condição:** Animal deve estar com situação "Ativo"
- **Aplicação:** Uma única vez por animal

### 3. Vacina Brucelose - R$ 2,76
- **Tipo:** Veterinário
- **Subtipo:** Vacina Brucelose
- **Regra:** Aplicado para fêmeas com 8 meses ou mais
- **Condição:** 
  - Sexo: Fêmea
  - Idade: 8 meses ou mais
  - Situação: Ativo
- **Aplicação:** Uma única vez por animal

### 4. DNA VRGEN - R$ 50,00
- **Tipo:** DNA
- **Subtipo:** DNA VRGEN
- **Regra:** Aplicado para animais receptoras
- **Condição:** 
  - Raça contém "RECEPTORA" OU
  - Campo receptora preenchido OU
  - Nome contém "RECEPTORA"
  - Situação: Ativo
  - Não possui DNA VRGEN ou Virgem já aplicado
- **Aplicação:** Uma única vez por animal
- **Finalidade:** Confirmação de paternidade

### 5. DNA Genômica Receptora - R$ 80,00
- **Tipo:** DNA
- **Subtipo:** DNA Genômica Receptora
- **Regra:** Aplicado para receptoras que não possuem DNA Genômica
- **Condição:** 
  - Animal é receptora (mesmas condições do item 4)
  - Não possui DNA Genômica já aplicado
  - Situação: Ativo
- **Aplicação:** Uma única vez por animal
- **Finalidade:** Análise genética completa

### 6. Brinco Amarelo - R$ 2,70
- **Tipo:** Manejo
- **Subtipo:** Brinco Amarelo
- **Regra:** Aplicado para TODOS os animais ativos
- **Condição:** Situação: Ativo
- **Aplicação:** Uma única vez por animal
- **Finalidade:** Identificação visual

### 7. Botton Eletrônico - R$ 6,00
- **Tipo:** Manejo
- **Subtipo:** Botton Eletrônico
- **Regra:** Aplicado para TODOS os animais ativos
- **Condição:** Situação: Ativo
- **Aplicação:** Uma única vez por animal
- **Finalidade:** Identificação eletrônica

### 8. Ração/Suplementação - R$ 120,00/mês
- **Tipo:** Alimentação
- **Subtipo:** Ração/suplementação
- **Regra:** Aplicado para TODOS os animais ativos
- **Condição:** Situação: Ativo
- **Aplicação:** Uma vez por mês (verifica se já foi aplicado no mês atual)
- **Descrição:** Média mensal de pasto + silagem + suplemento (estimativa)
- **Observação:** Este custo é recorrente e deve ser aplicado mensalmente

### 9. Exame Andrológico + Exames - R$ 165,00
- **Tipo:** Exame
- **Subtipo:** Andrológico + Exames
- **Regra:** Aplicado para machos entre 15 e 32 meses de idade
- **Condição:** 
  - Sexo: Macho
  - Idade: Entre 15 e 32 meses
  - Situação: Ativo
- **Aplicação:** Uma única vez por animal
- **Finalidade:** Avaliação da capacidade reprodutiva

## Resumo de Valores

| Custo | Valor | Frequência |
|-------|-------|------------|
| RGN | R$ 36,90 | Única |
| RGD | R$ 89,10 | Única |
| Vacina Brucelose | R$ 2,76 | Única |
| DNA VRGEN | R$ 50,00 | Única |
| DNA Genômica Receptora | R$ 80,00 | Única |
| Brinco Amarelo | R$ 2,70 | Única |
| Botton Eletrônico | R$ 6,00 | Única |
| Ração/Suplementação | R$ 120,00 | Mensal |
| Exame Andrológico | R$ 165,00 | Única |

## Lógica de Aplicação

1. O sistema verifica se o animal já possui o custo registrado
2. Se já possui, o custo é pulado (não duplica)
3. Se não possui e atende às condições, o custo é aplicado
4. A data de aplicação é sempre a data atual
5. Cada custo tem uma observação explicativa

## Resultado da Aplicação

Após clicar em "Aplicar Custos Automáticos", você verá um alerta com:
- Total de custos aplicados por tipo
- Quantidade de RGN aplicados
- Quantidade de RGD aplicados
- Quantidade de Brucelose aplicados
- Quantidade de DNA VRGEN aplicados
- Quantidade de DNA Genômica Receptora aplicados
- Quantidade de Brinco Amarelo aplicados
- Quantidade de Botton aplicados
- Quantidade de Ração aplicados
- Quantidade de Andrológico aplicados

## Edição e Exclusão

Após a aplicação automática, você pode:
- Editar qualquer custo clicando no ícone de lápis
- Excluir qualquer custo clicando no ícone de lixeira
- As alterações são sincronizadas com o aplicativo móvel

## Observações Importantes

1. **Custos Únicos:** A maioria dos custos é aplicada apenas uma vez por animal
2. **Custo Mensal:** Apenas a Ração/Suplementação é aplicada mensalmente
3. **Verificação Inteligente:** O sistema não duplica custos já existentes
4. **Receptoras:** Recebem dois tipos de DNA (VRGEN e Genômica)
5. **Machos Jovens:** Apenas machos entre 15-32 meses recebem exame andrológico
6. **Fêmeas:** Apenas fêmeas com 8+ meses recebem vacina Brucelose

## Arquivo de Implementação

O código está localizado em: `pages/api/custos/aplicar-automaticos.js`
