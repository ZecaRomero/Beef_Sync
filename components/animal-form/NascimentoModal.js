import React, { useState, useEffect } from 'react';
import animalDataManager from '../../services/animalDataManager';

// Modal especÃ­fico para dados de nascimento CJCJ
export default function NascimentoModal({ isOpen, onClose, onSave }) {
  const [dados, setDados] = useState({
    dataEntrada: "",
    pai: "",
    paiSerie: "",
    paiRg: "",
    mae: "",
    maeSerie: "",
    maeRg: "",
    avoMaterno: "",
    receptora: "",
    receptoraSerie: "",
    receptoraRg: "",
    receptoraCota: "",
    isFiv: false,
    pesoNascimento: "",
    observacoes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Preparar dados completos incluindo informaÃ§Ãµes dos pais
    const dadosCompletos = {
      ...dados,
      // Garantir que as informaÃ§Ãµes dos pais sejam salvas
      paiCompleto: dados.pai ? `${dados.paiSerie} ${dados.paiRg} ${dados.pai}`.trim() : '',
      maeCompleta: dados.mae ? `${dados.maeSerie} ${dados.maeRg} ${dados.mae}`.trim() : '',
      receptoraCompleta: dados.receptora ? `${dados.receptoraSerie} ${dados.receptoraRg} ${dados.receptoraCota} ${dados.receptora}`.trim() : '',
      // Campos separados para o banco de dados
      paiSerie: dados.paiSerie,
      paiRg: dados.paiRg,
      maeSerie: dados.maeSerie,
      maeRg: dados.maeRg,
      receptoraSerie: dados.receptoraSerie,
      receptoraRg: dados.receptoraRg,
      receptoraCota: dados.receptoraCota
    };

    onSave(dadosCompletos);
  };

  // FunÃ§Ã£o para buscar e preencher automaticamente o nome do pai
  const buscarNomePai = async (serie, rg) => {
    if (!serie || !rg) return;

    try {
      const animais = await animalDataManager.getAllAnimals();

      // Buscar animal que tem a sÃ©rie e RG informados
      const paiEncontrado = animais.find(animal =>
        animal.serie === serie && animal.rg === rg
      );

      if (paiEncontrado) {
        // Se encontrou o animal, usar o campo 'pai' que contÃ©m o nome completo
        let nomePai = paiEncontrado.pai;

        // Se o campo pai estiver vazio, construir o nome com sÃ©rie e RG
        if (!nomePai || nomePai.trim() === '') {
          nomePai = `${serie} ${rg}`;
        }

        // SÃ³ preenche automaticamente se o campo atual estiver vazio
        setDados(prev => {
          if (!prev.pai || prev.pai.trim() === '') {
            console.log('âÅ“â€¦ Nome do pai preenchido automaticamente:', nomePai);
            return {
              ...prev,
              pai: nomePai.trim()
            };
          } else {
            console.log('ââ€ž¹ï¸� Campo nome do pai jÃ¡ preenchido, mantendo valor atual');
            return prev;
          }
        });
      } else {
        console.log('ââ€ž¹ï¸� Pai nÃ£o encontrado para sÃ©rie:', serie, 'RG:', rg, '- Continuando sem erro');
        // NÃ£o mostrar erro, apenas continuar
      }
    } catch (error) {
      console.error('Erro ao buscar pai:', error);
      // NÃ£o bloquear o salvamento por erro de busca
    }
  };

  // FunÃ§Ã£o para buscar e preencher automaticamente o nome da mÃ£e
  const buscarNomeMae = async (serie, rg) => {
    if (!serie || !rg) return;

    try {
      const animais = await animalDataManager.getAllAnimals();

      // Buscar animal que tem a sÃ©rie e RG informados
      const maeEncontrada = animais.find(animal =>
        animal.serie === serie && animal.rg === rg
      );

      if (maeEncontrada) {
        // Se encontrou o animal, usar o campo 'mae' que contÃ©m o nome completo
        let nomeMae = maeEncontrada.mae;

        // Se o campo mae estiver vazio, construir o nome com sÃ©rie e RG
        if (!nomeMae || nomeMae.trim() === '') {
          nomeMae = `${serie} ${rg}`;
        }

        // SÃ³ preenche automaticamente se o campo atual estiver vazio
        setDados(prev => {
          if (!prev.mae || prev.mae.trim() === '') {
            console.log('âÅ“â€¦ Nome da mÃ£e preenchido automaticamente:', nomeMae);
            return {
              ...prev,
              mae: nomeMae.trim()
            };
          } else {
            console.log('ââ€ž¹ï¸� Campo nome da mÃ£e jÃ¡ preenchido, mantendo valor atual');
            return prev;
          }
        });
      } else {
        console.log('ââ€ž¹ï¸� MÃ£e nÃ£o encontrada para sÃ©rie:', serie, 'RG:', rg, '- Continuando sem erro');
        // NÃ£o mostrar erro, apenas continuar
      }
    } catch (error) {
      console.error('Erro ao buscar mÃ£e:', error);
      // NÃ£o bloquear o salvamento por erro de busca
    }
  };

  // Efeito para autopreenchimento quando sÃ©rie e RG do pai mudarem
  useEffect(() => {
    if (dados.paiSerie && dados.paiRg) {
      buscarNomePai(dados.paiSerie, dados.paiRg);
    }
  }, [dados.paiSerie, dados.paiRg]);

  // Efeito para autopreenchimento quando sÃ©rie e RG da mÃ£e mudarem
  useEffect(() => {
    if (dados.maeSerie && dados.maeRg) {
      buscarNomeMae(dados.maeSerie, dados.maeRg);
    }
  }, [dados.maeSerie, dados.maeRg]);

  // FunÃ§Ã£o para buscar e preencher automaticamente o nome da receptora
  const buscarNomeReceptora = async (serie, rg) => {
    if (!serie || !rg) return;

    try {
      const animais = await animalDataManager.getAllAnimals();

      // Buscar animal que tem a sÃ©rie e RG informados
      const receptoraEncontrada = animais.find(animal =>
        animal.serie === serie && animal.rg === rg
      );

      if (receptoraEncontrada) {
        // Se encontrou o animal, usar o campo 'receptora' que contÃ©m o nome completo
        let nomeReceptora = receptoraEncontrada.receptora;

        // Se o campo receptora estiver vazio, construir o nome com sÃ©rie e RG
        if (!nomeReceptora || nomeReceptora.trim() === '') {
          nomeReceptora = `${serie} ${rg}`;
        }

        // SÃ³ preenche automaticamente se o campo atual estiver vazio
        setDados(prev => {
          if (!prev.receptora || prev.receptora.trim() === '') {
            console.log('âÅ“â€¦ Nome da receptora preenchido automaticamente:', nomeReceptora);
            return {
              ...prev,
              receptora: nomeReceptora.trim()
            };
          } else {
            console.log('ââ€ž¹ï¸� Campo nome da receptora jÃ¡ preenchido, mantendo valor atual');
            return prev;
          }
        });
      } else {
        console.log('â�Å’ Receptora nÃ£o encontrada para sÃ©rie:', serie, 'RG:', rg);
      }
    } catch (error) {
      console.error('Erro ao buscar receptora:', error);
    }
  };

  // Efeito para autopreenchimento quando sÃ©rie e RG da receptora mudarem
  useEffect(() => {
    if (dados.receptoraSerie && dados.receptoraRg) {
      buscarNomeReceptora(dados.receptoraSerie, dados.receptoraRg);
    }
  }, [dados.receptoraSerie, dados.receptoraRg]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[800px] max-w-full m-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          âÅ“¨ Dados de Nascimento (CJCJ)
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={dados.dataEntrada}
                onChange={(e) => setDados({...dados, dataEntrada: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Peso ao Nascer (kg)
              </label>
              <input
                type="number"
                value={dados.pesoNascimento}
                onChange={(e) => setDados({...dados, pesoNascimento: e.target.value})}
                className="input-field"
                placeholder="Ex: 35.5"
                step="0.1"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Genealogia</h4>
            
            {/* Pai */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">SÃ©rie Pai</label>
                <input
                  type="text"
                  value={dados.paiSerie}
                  onChange={(e) => setDados({...dados, paiSerie: e.target.value.toUpperCase()})}
                  className="input-field"
                  placeholder="Ex: BENT"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">RG Pai</label>
                <input
                  type="text"
                  value={dados.paiRg}
                  onChange={(e) => setDados({...dados, paiRg: e.target.value})}
                  className="input-field"
                  placeholder="Ex: 123456"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome Pai</label>
                <input
                  type="text"
                  value={dados.pai}
                  onChange={(e) => setDados({...dados, pai: e.target.value})}
                  className="input-field"
                  placeholder="Nome do pai"
                />
              </div>
            </div>

            {/* MÃ£e */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">SÃ©rie MÃ£e</label>
                <input
                  type="text"
                  value={dados.maeSerie}
                  onChange={(e) => setDados({...dados, maeSerie: e.target.value.toUpperCase()})}
                  className="input-field"
                  placeholder="Ex: CJCG"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">RG MÃ£e</label>
                <input
                  type="text"
                  value={dados.maeRg}
                  onChange={(e) => setDados({...dados, maeRg: e.target.value})}
                  className="input-field"
                  placeholder="Ex: 654321"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome MÃ£e</label>
                <input
                  type="text"
                  value={dados.mae}
                  onChange={(e) => setDados({...dados, mae: e.target.value})}
                  className="input-field"
                  placeholder="Nome da mÃ£e"
                />
              </div>
            </div>

            {/* AvÃ´ Materno */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">AvÃ´ Materno</label>
              <input
                type="text"
                value={dados.avoMaterno}
                onChange={(e) => setDados({...dados, avoMaterno: e.target.value})}
                className="input-field"
                placeholder="Nome do avÃ´ materno"
              />
            </div>
          </div>

          {/* FIV e Receptora */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={dados.isFiv}
                onChange={(e) => setDados({...dados, isFiv: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Animal Ã© de FIV?</span>
            </div>

            {dados.isFiv && (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Dados da Receptora</h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">SÃ©rie</label>
                    <input
                      type="text"
                      value={dados.receptoraSerie}
                      onChange={(e) => setDados({...dados, receptoraSerie: e.target.value.toUpperCase()})}
                      className="input-field"
                      placeholder="Ex: RPT"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">RG</label>
                    <input
                      type="text"
                      value={dados.receptoraRg}
                      onChange={(e) => setDados({...dados, receptoraRg: e.target.value})}
                      className="input-field"
                      placeholder="Ex: 998877"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cota</label>
                    <input
                      type="text"
                      value={dados.receptoraCota}
                      onChange={(e) => setDados({...dados, receptoraCota: e.target.value})}
                      className="input-field"
                      placeholder="Ex: 100"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nome/IdentificaÃ§Ã£o</label>
                    <input
                      type="text"
                      value={dados.receptora}
                      onChange={(e) => setDados({...dados, receptora: e.target.value})}
                      className="input-field"
                      placeholder="Nome da receptora"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ObservaÃ§Ãµes
            </label>
            <textarea
              value={dados.observacoes}
              onChange={(e) => setDados({...dados, observacoes: e.target.value})}
              className="input-field"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Confirmar Nascimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
