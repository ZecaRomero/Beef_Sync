import React, { useState, useEffect } from 'react';
import costManager from '../../services/costManager';
import { CurrencyDollarIcon } from '../ui/Icons';

// Componente para preview dos custos
export default function CostPreview({ animal, aplicarProtocolo, aplicarDNA }) {
  const [custos, setCustos] = useState({ protocolo: null, dna: [], total: 0 });

  useEffect(() => {
    const animalFormatado = {
      ...animal,
      sexo: animal.sexo === 'Macho' ? 'M' : 'F'
    };

    let custosCalculados = { protocolo: null, dna: [], total: 0 };

    if (aplicarProtocolo) {
      const resultadoProtocolo = costManager.calcularCustosProtocolo(animalFormatado);
      if (resultadoProtocolo.total > 0) {
        custosCalculados.protocolo = resultadoProtocolo;
        custosCalculados.total += resultadoProtocolo.total;
      }
    }

    if (aplicarDNA) {
      const custosDNA = [];

      // DNA Virgem para FIV ou quando hÃ¡ receptora
      if (animal.isFiv || animal.receptoraRg) {
        custosDNA.push({
          nome: 'DNA Virgem (Paternidade)',
          valor: costManager.medicamentos['DNA VIRGEM'].porAnimal,
          descricao: animal.receptoraRg ? 'ObrigatÃ³rio quando hÃ¡ receptora' : 'ObrigatÃ³rio para animais FIV'
        });
      }

      // DNA GenÃ´mica para 0-7 meses
      if (animal.meses <= 7) {
        custosDNA.push({
          nome: 'DNA GenÃ´mica',
          valor: costManager.medicamentos['DNA GENOMICA'].porAnimal,
          descricao: 'Para bezerros de 0 a 7 meses'
        });
      }

      custosCalculados.dna = custosDNA;
      custosCalculados.total += custosDNA.reduce((sum, dna) => sum + dna.valor, 0);
    }

    setCustos(custosCalculados);
  }, [animal, aplicarProtocolo, aplicarDNA]);

  if (custos.total === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          âÅ¡ ï¸� Nenhum protocolo ou DNA serÃ¡ aplicado com as configuraÃ§Ãµes atuais
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
        Preview dos Custos AutomÃ¡ticos
      </h4>

      <div className="space-y-3">
        {/* Protocolo */}
        {custos.protocolo && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <h5 className="font-medium text-blue-800 dark:text-blue-200 text-sm mb-2">
              ðÅ¸§ª {custos.protocolo.protocolo}
            </h5>
            <div className="space-y-1">
              {custos.protocolo.custos.map((custo, idx) => (
                <div key={idx} className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                  <span>{custo.medicamento} ({custo.quantidade} {custo.unidade})</span>
                  <span>R$ {custo.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-blue-200 dark:border-blue-700 mt-2 pt-2">
              <div className="flex justify-between font-medium text-blue-800 dark:text-blue-200 text-sm">
                <span>Subtotal Protocolo:</span>
                <span>R$ {custos.protocolo.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* DNA */}
        {custos.dna.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <h5 className="font-medium text-purple-800 dark:text-purple-200 text-sm mb-2">
              ðÅ¸§¬ Exames de DNA
            </h5>
            <div className="space-y-1">
              {custos.dna.map((dna, idx) => (
                <div key={idx} className="flex justify-between text-xs text-purple-700 dark:text-purple-300">
                  <span>{dna.nome}</span>
                  <span>R$ {dna.valor.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-purple-200 dark:border-purple-700 mt-2 pt-2">
              <div className="flex justify-between font-medium text-purple-800 dark:text-purple-200 text-sm">
                <span>Subtotal DNA:</span>
                <span>R$ {custos.dna.reduce((sum, dna) => sum + dna.valor, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
          <div className="flex justify-between font-bold text-green-800 dark:text-green-200">
            <span>ðÅ¸â€™° Custo Total Inicial:</span>
            <span>R$ {custos.total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Custos serÃ£o aplicados automaticamente apÃ³s salvar o animal
          </p>
        </div>
      </div>
    </div>
  );
}
