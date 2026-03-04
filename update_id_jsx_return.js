const fs = require('fs');
const path = 'c:\\Users\\zeca8\\OneDrive\\Documentos\\Sistemas\\beef sync\\pages\\consulta-animal\\[id].jsx';

let content = fs.readFileSync(path, 'utf8');

const newReturn = `  return (
    <React.Fragment>
      <Head>
        <title>{nome} | Consulta Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <AnimalHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          animal={animal}
          resumoChips={resumoChips}
          setShowIABCZInfo={setShowIABCZInfo}
          rankings={{
            posicaoIABCZ: rankingPosicao,
            posicaoIQG: rankingPosicaoGenetica2,
            filhoTopIABCZ: filhoTopRanking,
            filhoTopIQG: filhoTopRankingIQG
          }}
        />

        <div className="max-w-lg mx-auto p-4 space-y-4">
          <AnimalMetricsCards animal={animal} metrics={metrics} rankings={{
            posicaoIABCZ: rankingPosicao,
            posicaoIQG: rankingPosicaoGenetica2,
            filhoTopIABCZ: filhoTopRanking,
            filhoTopIQG: filhoTopRankingIQG
          }} />

          <AnimalMainInfo
            animal={animal}
            rankings={{
              posicaoIABCZ: rankingPosicao,
              posicaoIQG: rankingPosicaoGenetica2,
              filhoTopIABCZ: filhoTopRanking,
              filhoTopIQG: filhoTopRankingIQG
            }}
            metrics={{...metrics, locAtual, ultimoCE, diasDesdeExame, isPrenha, diasGestacao, diasParaParto, previsaoPartoExibir, ultimaIA}}
            examesAndrologicos={examesAndrologicos}
            ultimaIA={ultimaIA}
            totalOocitos={totalOocitos}
            onCopyIdent={handleCopyIdent}
            onWhatsAppShare={handleWhatsAppShare}
            onEditGenetica={() => setIsEditGeneticaModalOpen(true)}
            maeLink={maeLink}
            locAtual={locAtual}
          />

          <AnimalPlanningCards animal={animal} metrics={metrics} />

          <AnimalAndrologicalExams examesAndrologicos={examesAndrologicos} />
          
          <AnimalGestations gestacoes={animal.gestacoes || []} />
          
          <AnimalInseminations inseminacoes={inseminacoesParaExibir} />

          <AnimalReproduction animal={animal} />
          
          <AnimalIVFCollections animal={animal} totalOocitos={totalOocitos} mediaOocitos={mediaOocitos} />
          
          <AnimalEmbryoTransfers transferencias={animal.transferencias || transferencias} />

          <AnimalTimeline animal={animal} />

          <AnimalLocation animal={animal} locAtual={locAtual} diasNaFazenda={diasNaFazenda} />

          <AnimalOffspring animal={animal} />

          <AnimalOccurrences animal={animal} ocorrencias={ocorrencias} />

          <AnimalHealthProtocols animal={animal} />

          <AnimalWeightHistory animal={animal} />

          <AnimalCosts animal={animal} />

          <AnimalGenetics animal={animal} />

          <AnimalNotes animal={animal} />

          <AnimalPhotos animal={animal} />

          <AnimalAdditionalInfo animal={animal} />
        </div>
      </div>

      <AnimalFixedActions onShare={handleShareSummary} isSharing={sharing} />

      {/* Modals */}
      {showIABCZInfo && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowIABCZInfo(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <TrophyIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">iABCZ e Ranking</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              O iABCZ indica avaliação genética. Quanto maior, melhor a classificação. O ranking mostra a posição deste animal entre os avaliados do rebanho.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIABCZInfo(false)}
                className="px-4 py-2 rounded-lg bg-amber-600 dark:bg-amber-500 text-white font-semibold hover:bg-amber-700 dark:hover:bg-amber-600"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditGeneticaModalOpen && (
        <EditGeneticaModal
          isOpen={isEditGeneticaModalOpen}
          onClose={() => setIsEditGeneticaModalOpen(false)}
          animal={animal}
          onSave={handleSaveGenetica}
        />
      )}
    </React.Fragment>
  `;

// Find the return statement
// We search for "return (" and match until the end of the file minus the last curly brace
// The file has a return block that starts with "return (" and ends with ");" followed by "}"
const returnStart = 'return (';
const startIndex = content.lastIndexOf(returnStart);

if (startIndex === -1) {
  console.error('Could not find return statement');
  process.exit(1);
}

// Find the end of the function. The file ends with "}"
// We can find the last ");"
const returnEnd = ');';
const endIndex = content.lastIndexOf(returnEnd);

if (endIndex === -1) {
    console.error('Could not find end of return statement');
    process.exit(1);
}

// Check what is after endIndex. It should be "}"
const suffix = content.substring(endIndex + returnEnd.length);

// Construct new content
const newContent = content.substring(0, startIndex) + newReturn + ');' + suffix;

fs.writeFileSync(path, newContent);
console.log('Successfully updated [id].jsx');
