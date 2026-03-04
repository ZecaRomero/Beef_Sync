const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'pages', 'consulta-animal', '[id].jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix leftover fragment from formatCurrency deletion
content = content.replace(/\)\.format\(parseFloat\(v\)\)\s*\}/g, '');
content = content.replace(/\)\.format\(parseFloat\(v\)\)/g, ''); // Just in case

// 2. Remove unused state variables and effects
const statesToRemove = [
  /const \[ocorrencias, setOcorrencias\] = useState\(\[\]\)/,
  /const \[transferencias, setTransferencias\] = useState\(\[\]\)/,
  /const \[ultimoCE, setUltimoCE\] = useState\(null\)/,
  /const \[ultimaIA, setUltimaIA\] = useState\(null\)/,
  /const \[inseminacoesFetch, setInseminacoesFetch\] = useState\(null\)/,
  /const \[previsaoPartoIA, setPrevisaoPartoIA\] = useState\(null\)/,
  /const \[secoesExpandidas, setSecoesExpandidas\] = useState\(\{[\s\S]*?\}\)/,
  /const toggleSecao = useCallback\(\(key\) => \{[\s\S]*?\}, \[\]\)/
];

statesToRemove.forEach(regex => {
  content = content.replace(regex, '');
});

// 3. Clean up imports
// We'll replace the Heroicons import with a clean list of USED icons
const heroiconsImportRegex = /import \{[\s\S]*?\} from '@heroicons\/react\/24\/outline'/;

// Icons used in the file (based on analysis):
// ArrowLeftIcon (Nova Consulta)
// ChartBarIcon (Relatórios)
// DocumentTextIcon (Compartilhar)
// TrophyIcon (iABCZ modal) - Need to make sure this is in the list!
// PencilIcon (Maybe used? I'll keep it if I'm not sure, but better to check usage)
// Let's check usage of PencilIcon
const isPencilUsed = content.includes('<PencilIcon') || content.includes('PencilIcon,');
const isTrophyUsed = content.includes('<TrophyIcon') || content.includes('TrophyIcon,');

const usedIcons = [
  'ArrowLeftIcon',
  'ChartBarIcon',
  'DocumentTextIcon',
  isTrophyUsed ? 'TrophyIcon' : null,
  isPencilUsed ? 'PencilIcon' : null
].filter(Boolean);

const newHeroiconsImport = `import {\n  ${usedIcons.join(',\n  ')}\n} from '@heroicons/react/24/outline'`;

content = content.replace(heroiconsImportRegex, newHeroiconsImport);

// 4. Remove empty lines created by deletions (simple approach)
content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully cleaned up pages/consulta-animal/[id].jsx');
