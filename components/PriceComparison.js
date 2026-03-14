import React, { useEffect, useState } from 'react'

;
import { MarketAPI } from "../services/marketAPI";

export default function PriceComparison() {
  const [marketPrices, setMarketPrices] = useState(null);
  const [regionalPrices, setRegionalPrices] = useState(null);
  const [selectedState, setSelectedState] = useState("SP");
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  const states = [
    { code: "SP", name: "SÃ£o Paulo" },
    { code: "MG", name: "Minas Gerais" },
    { code: "GO", name: "GoiÃ¡s" },
    { code: "MT", name: "Mato Grosso" },
    { code: "MS", name: "Mato Grosso do Sul" },
    { code: "PR", name: "ParanÃ¡" },
    { code: "RS", name: "Rio Grande do Sul" },
    { code: "BA", name: "Bahia" },
  ];

  useEffect(() => {
    loadPriceData();
  }, [selectedState]);

  const loadPriceData = async () => {
    try {
      setLoading(true);
      const [market, regional] = await Promise.all([
        MarketAPI.getCattlePrices(),
        MarketAPI.getRegionalPrices(selectedState),
      ]);

      setMarketPrices(market);
      setRegionalPrices(regional);
      calculateComparison(market, regional);
    } catch (error) {
      console.error("Erro ao carregar preÃ§os:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateComparison = (market, regional) => {
    // Analisar animais do rebanho
    const activeAnimals = [];
    const soldAnimals = [];

    // Estimar peso mÃ©dio por idade (simulado)
    const estimateWeight = (months, sex) => {
      const baseWeight = sex === "Macho" ? 15 : 12; // kg por mÃªs
      return Math.min(months * baseWeight, sex === "Macho" ? 550 : 450);
    };

    // Calcular valor de mercado estimado
    const animalComparisons = activeAnimals.map((animal) => {
      const weight = estimateWeight(animal.meses, animal.sexo);
      const arrobas = weight / 15; // 1 arroba = 15kg

      let marketPrice = 0;
      if (animal.meses >= 30) {
        // Boi/Vaca gordo
        marketPrice =
          animal.sexo === "Macho"
            ? regional.prices.boi_gordo * arrobas
            : regional.prices.vaca_gorda * arrobas;
      } else if (animal.meses <= 12) {
        // Bezerro
        marketPrice =
          animal.sexo === "Macho"
            ? regional.prices.bezerro_macho
            : regional.prices.bezerro_femea;
      } else {
        // Garrote/Novilha (preÃ§o intermediÃ¡rio)
        const adultPrice =
          animal.sexo === "Macho"
            ? regional.prices.boi_gordo * arrobas
            : regional.prices.vaca_gorda * arrobas;
        const calfPrice =
          animal.sexo === "Macho"
            ? regional.prices.bezerro_macho
            : regional.prices.bezerro_femea;

        // InterpolaÃ§Ã£o linear baseada na idade
        const ageRatio = (animal.meses - 12) / (30 - 12);
        marketPrice = calfPrice + (adultPrice - calfPrice) * ageRatio;
      }

      const potentialProfit = marketPrice - animal.custoTotal;
      const potentialROI =
        animal.custoTotal > 0 ? (potentialProfit / animal.custoTotal) * 100 : 0;

      return {
        ...animal,
        estimatedWeight: weight,
        estimatedArrobas: arrobas,
        marketValue: marketPrice,
        potentialProfit,
        potentialROI,
        recommendation:
          potentialROI > 20 ? "sell" : potentialROI > 10 ? "hold" : "improve",
      };
    });

    setComparison({
      activeAnimals: animalComparisons,
      summary: {
        totalMarketValue: animalComparisons.reduce(
          (acc, a) => acc + a.marketValue,
          0
        ),
        totalInvested: animalComparisons.reduce(
          (acc, a) => acc + a.custoTotal,
          0
        ),
        potentialProfit: animalComparisons.reduce(
          (acc, a) => acc + a.potentialProfit,
          0
        ),
        averageROI:
          animalComparisons.length > 0
            ? animalComparisons.reduce((acc, a) => acc + a.potentialROI, 0) /
              animalComparisons.length
            : 0,
        recommendSell: animalComparisons.filter(
          (a) => a.recommendation === "sell"
        ).length,
        recommendHold: animalComparisons.filter(
          (a) => a.recommendation === "hold"
        ).length,
        recommendImprove: animalComparisons.filter(
          (a) => a.recommendation === "improve"
        ).length,
      },
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case "sell":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "improve":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getRecommendationText = (rec) => {
    switch (rec) {
      case "sell":
        return "ðÅ¸Å¸¢ Vender";
      case "hold":
        return "ðÅ¸Å¸¡ Manter";
      case "improve":
        return "ðÅ¸â€�´ Melhorar";
      default:
        return "âÅ¡ª Analisar";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">ðÅ¸â€™°</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Analisando preÃ§os de mercado...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Seletor de Estado */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              ðÅ¸â€™° ComparaÃ§Ã£o de PreÃ§os
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Compare seus animais com os preÃ§os atuais do mercado
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado/RegiÃ£o
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resumo Geral */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(comparison.summary.totalMarketValue)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Valor de Mercado Total
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Estimativa baseada em peso e idade
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  comparison.summary.potentialProfit >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(comparison.summary.potentialProfit)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Lucro Potencial
              </div>
              <div className="text-xs text-gray-500 mt-2">Se vendidos hoje</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  comparison.summary.averageROI >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {comparison.summary.averageROI.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ROI MÃ©dio Potencial
              </div>
              <div className="text-xs text-gray-500 mt-2">Retorno estimado</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {comparison.summary.recommendSell}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Recomendados p/ Venda
              </div>
              <div className="text-xs text-gray-500 mt-2">ROI &gt; 20%</div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Animais Ativos */}
      {comparison && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            ðÅ¸�â€ž AnÃ¡lise Individual - Animais Ativos
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">
                    Animal
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                    Idade
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                    Peso Est.
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                    Investido
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                    Valor Mercado
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                    Lucro Pot.
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                    ROI Pot.
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                    RecomendaÃ§Ã£o
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.activeAnimals.map((animal) => (
                  <tr
                    key={animal.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="p-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {animal.serie} {animal.rg}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {animal.raca} ââ‚¬¢ {animal.sexo}
                      </div>
                    </td>
                    <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                      {animal.meses}m
                    </td>
                    <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                      {animal.estimatedWeight.toFixed(0)}kg
                      <div className="text-xs text-gray-500">
                        ({animal.estimatedArrobas.toFixed(1)}@)
                      </div>
                    </td>
                    <td className="p-3 text-center text-red-600 dark:text-red-400 font-medium">
                      {formatCurrency(animal.custoTotal)}
                    </td>
                    <td className="p-3 text-center text-blue-600 dark:text-blue-400 font-medium">
                      {formatCurrency(animal.marketValue)}
                    </td>
                    <td
                      className={`p-3 text-center font-medium ${
                        animal.potentialProfit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(animal.potentialProfit)}
                    </td>
                    <td
                      className={`p-3 text-center font-medium ${
                        animal.potentialROI >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {animal.potentialROI.toFixed(1)}%
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${getRecommendationColor(
                          animal.recommendation
                        )}`}
                      >
                        {getRecommendationText(animal.recommendation)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AnÃ¡lise de Vendas Passadas */}
      {comparison && comparison.salesAnalysis.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            ðÅ¸â€œÅ  Performance vs Mercado - Vendas Realizadas
          </h3>

          <div className="space-y-4">
            {comparison.salesAnalysis.map((animal) => (
              <div
                key={animal.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {animal.serie} {animal.rg}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {animal.raca} ââ‚¬¢ {animal.sexo} ââ‚¬¢ {animal.meses} meses
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(animal.valorVenda)}
                    </div>
                    <div className="text-xs text-gray-500">Vendido por</div>
                  </div>

                  <div className="text-center">
                    <div className="font-medium text-gray-600 dark:text-gray-400">
                      {formatCurrency(animal.estimatedMarketPrice)}
                    </div>
                    <div className="text-xs text-gray-500">PreÃ§o mercado</div>
                  </div>

                  <div className="text-center">
                    <div
                      className={`font-medium ${
                        animal.marketDifference >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(animal.marketDifference)}
                    </div>
                    <div className="text-xs text-gray-500">DiferenÃ§a</div>
                  </div>

                  <div className="text-center">
                    <div
                      className={`font-bold ${
                        animal.performanceVsMarket >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {animal.performanceVsMarket >= 0 ? "+" : ""}
                      {animal.performanceVsMarket.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">vs Mercado</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
