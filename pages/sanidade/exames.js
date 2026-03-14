import { useState, useEffect } from 'react';
import { 
  DocumentMagnifyingGlassIcon, 
  PlusIcon, 
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ExamesLaboratoriais() {
  const [exames, setExames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar exames da API ou localStorage
    const loadExames = async () => {
      try {
        // Tentar carregar da API primeiro
        try {
          const response = await fetch('/api/sanidade/exames');
          if (response.ok) {
            const data = await response.json();
            const examesArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
            setExames(examesArray);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('API não disponível, usando localStorage:', apiError);
        }

        // Fallback para localStorage
        const existingExames = localStorage.getItem('examesLaboratoriais');
        if (existingExames) {
          try {
            const parsed = JSON.parse(existingExames);
            const examesArray = Array.isArray(parsed) ? parsed : [];
            setExames(examesArray);
          } catch (parseError) {
            console.error('Erro ao fazer parse do localStorage:', parseError);
            setExames([]);
            localStorage.removeItem('examesLaboratoriais');
          }
        } else {
          setExames([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar exames:', error);
        setExames([]);
        setLoading(false);
      }
    };

    loadExames();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-100 text-green-800';
      case 'Em Análise':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pendente':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultadoColor = (resultado) => {
    switch (resultado) {
      case 'Negativo':
        return 'text-green-600';
      case 'Positivo':
        return 'text-red-600';
      case 'Pendente':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando exames laboratoriais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <DocumentMagnifyingGlassIcon className="h-8 w-8 text-emerald-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Exames Laboratoriais</h1>
                <p className="text-sm text-gray-600">Resultados e controle de exames</p>
              </div>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Solicitar Exame
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {exames.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="text-center py-12">
              <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum exame encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">Comece solicitando um novo exame laboratorial.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {exames.map((exame) => (
                <li key={exame.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {exame.status === 'Concluído' && (
                            <CheckCircleIcon className="h-6 w-6 text-green-500" />
                          )}
                          {exame.status === 'Em Análise' && (
                            <ClockIcon className="h-6 w-6 text-yellow-500" />
                          )}
                          {exame.status === 'Pendente' && (
                            <DocumentMagnifyingGlassIcon className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{exame.animal}</p>
                            <span className="ml-2 text-sm text-gray-500">- {exame.tipoExame}</span>
                          </div>
                          <p className="text-sm text-gray-500">{exame.laboratorio}</p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            Coleta: {new Date(exame.dataColeta).toLocaleDateString('pt-BR')}
                            {exame.dataResultado && (
                              <>
                                <span className="mx-2">•</span>
                                Resultado: {new Date(exame.dataResultado).toLocaleDateString('pt-BR')}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exame.status)}`}>
                          {exame.status}
                        </span>
                        <p className={`text-sm font-medium mt-1 ${getResultadoColor(exame.resultado)}`}>
                          {exame.resultado}
                        </p>
                        <p className="text-sm text-gray-500">{exame.veterinario}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}