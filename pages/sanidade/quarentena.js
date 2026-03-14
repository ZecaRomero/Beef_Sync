import { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  PlusIcon, 
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export default function Quarentena() {
  const [animaisQuarentena, setAnimaisQuarentena] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar animais em quarentena da API ou localStorage
    const loadAnimaisQuarentena = async () => {
      try {
        // Tentar carregar da API primeiro
        try {
          const response = await fetch('/api/sanidade/quarentena');
          if (response.ok) {
            const data = await response.json();
            const animaisArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
            setAnimaisQuarentena(animaisArray);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('API não disponível, usando localStorage:', apiError);
        }

        // Fallback para localStorage
        const existingAnimais = localStorage.getItem('animaisQuarentena');
        if (existingAnimais) {
          try {
            const parsed = JSON.parse(existingAnimais);
            const animaisArray = Array.isArray(parsed) ? parsed : [];
            setAnimaisQuarentena(animaisArray);
          } catch (parseError) {
            console.error('Erro ao fazer parse do localStorage:', parseError);
            setAnimaisQuarentena([]);
            localStorage.removeItem('animaisQuarentena');
          }
        } else {
          setAnimaisQuarentena([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar animais em quarentena:', error);
        setAnimaisQuarentena([]);
        setLoading(false);
      }
    };

    loadAnimaisQuarentena();
  }, []);

  const calcularDiasQuarentena = (dataEntrada) => {
    const hoje = new Date();
    const entrada = new Date(dataEntrada);
    const diffTime = Math.abs(hoje - entrada);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando animais em quarentena...</p>
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
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quarentena</h1>
                <p className="text-sm text-gray-600">Animais em isolamento sanitário</p>
              </div>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar à Quarentena
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Animais em Quarentena
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {animaisQuarentena.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tempo Médio
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {animaisQuarentena.length > 0 
                        ? Math.round(animaisQuarentena.reduce((acc, animal) => 
                            acc + calcularDiasQuarentena(animal.dataEntrada), 0) / animaisQuarentena.length)
                        : 0} dias
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapPinIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Locais Utilizados
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {new Set(animaisQuarentena.map(a => a.localizacao)).size}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Animais */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Animais em Quarentena
            </h3>
          </div>
          {animaisQuarentena.length === 0 ? (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum animal em quarentena</h3>
              <p className="mt-1 text-sm text-gray-500">Nenhum animal está atualmente em quarentena.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {animaisQuarentena.map((animal) => (
                <li key={animal.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{animal.animal}</p>
                          <p className="text-sm text-gray-500">{animal.motivo}</p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            Entrada: {new Date(animal.dataEntrada).toLocaleDateString('pt-BR')}
                            <span className="mx-2">•</span>
                            Previsão saída: {new Date(animal.previsaoSaida).toLocaleDateString('pt-BR')}
                            <span className="mx-2">•</span>
                            <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            {animal.localizacao}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{animal.observacoes}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {calcularDiasQuarentena(animal.dataEntrada)} dias
                        </p>
                        <p className="text-sm text-gray-500">{animal.veterinario}</p>
                        <button className="mt-2 text-yellow-600 hover:text-yellow-900 text-sm font-medium">
                          Liberar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}