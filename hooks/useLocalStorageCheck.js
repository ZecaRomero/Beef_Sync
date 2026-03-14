import React, { useEffect, useState } from 'react'

;
import { useRouter } from 'next/router';

/**
 * Hook para verificar se há dados no localStorage que precisam ser migrados
 */
export default function useLocalStorageCheck(options = {}) {
  const {
    autoRedirect = false,
    showAlert = true,
    checkOnMount = true
  } = options;

  const router = useRouter();
  const [dadosLocalStorage, setDadosLocalStorage] = useState(null);
  const [temDados, setTemDados] = useState(false);
  const [verificando, setVerificando] = useState(true);

  const verificarLocalStorage = () => {
    try {
      const nfsReceptoras = localStorage.getItem('nfsReceptoras');
      const naturezasOperacao = localStorage.getItem('naturezasOperacao');
      const origensReceptoras = localStorage.getItem('origensReceptoras');

      const dados = {
        nfsReceptoras: nfsReceptoras ? JSON.parse(nfsReceptoras) : [],
        naturezasOperacao: naturezasOperacao ? JSON.parse(naturezasOperacao) : [],
        origensReceptoras: origensReceptoras ? JSON.parse(origensReceptoras) : []
      };

      const total = dados.nfsReceptoras.length + 
                    dados.naturezasOperacao.length + 
                    dados.origensReceptoras.length;

      setDadosLocalStorage({
        ...dados,
        total,
        temDados: total > 0
      });

      setTemDados(total > 0);

      // Mostrar alerta se houver dados
      if (total > 0 && showAlert) {
        // Verificar se já mostrou o alerta hoje
        const ultimoAlerta = localStorage.getItem('ultimoAlertaMigracao');
        const hoje = new Date().toDateString();

        if (ultimoAlerta !== hoje) {
          const migrar = window.confirm(
            `⚠️ ATENÇÃO: Dados Antigos Encontrados!\n\n` +
            `Foram encontrados ${total} item(ns) salvos no localStorage do navegador.\n\n` +
            `Para garantir a segurança dos seus dados, recomendamos migrar para o banco de dados PostgreSQL.\n\n` +
            `Deseja ir para a página de migração agora?`
          );

          if (migrar && autoRedirect) {
            router.push('/migrar-dados');
          }

          // Marcar que já mostrou o alerta hoje
          localStorage.setItem('ultimoAlertaMigracao', hoje);
        }
      }

      return { dados, total, temDados: total > 0 };
    } catch (error) {
      console.error('Erro ao verificar localStorage:', error);
      return { dados: null, total: 0, temDados: false };
    } finally {
      setVerificando(false);
    }
  };

  useEffect(() => {
    if (checkOnMount) {
      verificarLocalStorage();
    }
  }, [checkOnMount]);

  return {
    dadosLocalStorage,
    temDados,
    verificando,
    verificarNovamente: verificarLocalStorage
  };
}

/**
 * Hook simplificado - apenas verifica se tem dados
 */
export function useHasLocalStorageData() {
  const [temDados, setTemDados] = useState(false);

  useEffect(() => {
    const verificar = () => {
      const nfs = localStorage.getItem('nfsReceptoras');
      const naturezas = localStorage.getItem('naturezasOperacao');
      const origens = localStorage.getItem('origensReceptoras');

      const total = (nfs ? JSON.parse(nfs).length : 0) +
                    (naturezas ? JSON.parse(naturezas).length : 0) +
                    (origens ? JSON.parse(origens).length : 0);

      setTemDados(total > 0);
    };

    verificar();
  }, []);

  return temDados;
}

