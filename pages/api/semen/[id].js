import databaseService from '../../../services/databaseService';
import { criarLoteManual } from '../../../utils/loteMiddleware';
import { asyncHandler } from '../../../utils/apiResponse';
import { logger } from '../../../utils/logger';

async function semenHandler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const semen = await databaseService.buscarSemenPorId(id);
      if (semen) {
        res.status(200).json(semen);
      } else {
        res.status(404).json({ message: 'SÃªmen nÃ£o encontrado' });
      }
    } catch (error) {
      console.error('Erro ao buscar sÃªmen:', error);
      res.status(500).json({ message: 'Erro ao buscar sÃªmen', error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const updatedSemen = await databaseService.atualizarSemen(id, req.body);
      if (updatedSemen) {
        res.status(200).json(updatedSemen);
      } else {
        res.status(404).json({ message: 'SÃªmen nÃ£o encontrado' });
      }
    } catch (error) {
      console.error('Erro ao atualizar sÃªmen:', error);
      res.status(500).json({ message: 'Erro ao atualizar sÃªmen', error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Buscar dados do sÃªmen antes de excluir para registrar no lote
      const semen = await databaseService.buscarSemenPorId(id);
      
      if (!semen) {
        return res.status(404).json({ message: 'SÃªmen nÃ£o encontrado' });
      }

      const deletedSemen = await databaseService.deletarSemen(id);
      
      if (deletedSemen) {
        // Registrar no sistema de lotes
        try {
          await criarLoteManual({
            tipo_operacao: 'REM_SEMEN',
            descricao: `REM Nocaute no estoque de semen - Touro: ${semen.nome_touro || 'N/A'}${semen.rg_touro ? ` (RG: ${semen.rg_touro})` : ''}${semen.raca ? ` - RaÃ§a: ${semen.raca}` : ''}`,
            detalhes: {
              semen_id: id,
              nome_touro: semen.nome_touro,
              rg_touro: semen.rg_touro,
              raca: semen.raca,
              quantidade_doses: semen.quantidade_doses,
              doses_disponiveis: semen.doses_disponiveis,
              fornecedor: semen.fornecedor,
              localizacao: semen.localizacao,
              timestamp: new Date().toISOString()
            },
            usuario: 'Sistema',
            quantidade_registros: 1,
            modulo: 'SEMEN',
            req
          });
          
          logger.info(`âÅ“â€¦ REM de sÃªmen registrado no sistema de lotes: ${semen.nome_touro || id}`);
        } catch (loteError) {
          // NÃ£o falhar a exclusÃ£o se o registro no lote falhar
          logger.error('Erro ao registrar REM no sistema de lotes:', loteError);
        }
        
        res.status(200).json({ message: 'SÃªmen excluÃ­do com sucesso' });
      } else {
        res.status(404).json({ message: 'SÃªmen nÃ£o encontrado' });
      }
    } catch (error) {
      console.error('Erro ao deletar sÃªmen:', error);
      res.status(500).json({ message: 'Erro ao deletar sÃªmen', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default asyncHandler(semenHandler)
