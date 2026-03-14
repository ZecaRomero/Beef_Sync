import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  PlusIcon, 
  CalendarIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

export default function Vacinacao() {
  const [vacinas, setVacinas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar vacinas da API ou localStorage
    const loadVacinas = async () => {
      try {
        // Tentar carregar da API primeiro
        try {
          const response = await fetch('/api/sanidade/vacinacao');
          if (response.ok) {
            const data = await response.json();
            const vacinasArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
            setVacinas(vacinasArray);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('API não disponível, usando localStorage:', apiError);
        }

        // Fallback para localStorage
        const existingVacinas = localStorage.getItem('vacinas');
        if (existingVacinas) {
          try {
            const parsed = JSON.parse(existingVacinas);
            const vacinasArray = Array.isArray(parsed) ? parsed : [];
            setVacinas(vacinasArray);
          } catch (parseError) {
            console.error('Erro ao fazer parse do localStorage:', parseError);
            setVacinas([]);
            localStorage.removeItem('vacinas');
          }
        } else {
          setVacinas([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar vacinas:', error);
        setVacinas([]);
        setLoading(false);
      }
    };

    loadVacinas();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados de vacinação...</p>
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
              <BeakerIcon className="h-8 w-8 text-emerald-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Controle de Vacinação</h1>
                <p className="text-sm text-gray-600">Gerencie as vacinas do rebanho</p>
              </div>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Vacinação
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {vacinas.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="text-center py-12">
              <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma vacinação encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">Comece registrando uma nova vacinação.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {vacinas.map((vacina) => (
                <li key={vacina.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{vacina.nome}</p>
                        <p className="text-sm text-gray-500">Lote: {vacina.lote}</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          Aplicada em: {new Date(vacina.dataAplicacao).toLocaleDateString('pt-BR')}
                          <span className="mx-2">•</span>
                          Próxima dose: {new Date(vacina.proximaDose).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{vacina.animaisVacinados} animais</p>
                        <p className="text-sm text-gray-500">{vacina.responsavel}</p>
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