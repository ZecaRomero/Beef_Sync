/**
 * Card de boas-vindas para sistema limpo
 */
import React, { memo } from 'react'

;
import { PlusIcon, UserGroupIcon, ChartBarIcon } from './Icons';
import Button from './Button';
import { Card, CardHeader, CardBody } from './Card';

const WelcomeCard = memo(function WelcomeCard({ onStart }) {
  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Bem-vindo ao Beef Sync v3.0
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Comece cadastrando seu primeiro animal
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <p className="text-blue-800 dark:text-blue-200">
            Seu sistema está pronto para receber dados reais do seu rebanho. 
            Cadastre seus animais e acompanhe todos os custos e nascimentos.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white dark:bg-blue-900/20 rounded-lg">
              <PlusIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                1. Cadastrar Animais
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Registre cada animal do seu rebanho
              </p>
            </div>
            
            <div className="text-center p-4 bg-white dark:bg-blue-900/20 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                2. Controlar Custos
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Registre manejos, medicamentos, etc.
              </p>
            </div>
            
            <div className="text-center p-4 bg-white dark:bg-blue-900/20 rounded-lg">
              <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                3. Acompanhar Resultados
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Veja relatórios e análises em tempo real
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              variant="primary"
              leftIcon={<PlusIcon className="h-5 w-5" />}
              onClick={onStart}
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
});

export default WelcomeCard;
