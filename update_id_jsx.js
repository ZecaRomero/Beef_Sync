const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'pages', 'consulta-animal', '[id].jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
const importsToAdd = `
import AnimalHealthProtocols from '../../components/animals/AnimalHealthProtocols'
import AnimalWeightHistory from '../../components/animals/AnimalWeightHistory'
import AnimalCosts from '../../components/animals/AnimalCosts'
import AnimalGenetics from '../../components/animals/AnimalGenetics'
import AnimalAdditionalInfo from '../../components/animals/AnimalAdditionalInfo'
import { formatDate, formatCurrency, localizacaoValidaParaExibir, calcularMesesIdade } from '../../utils/formatters'
`;

// Insert after the last component import
const lastImport = "import AnimalGestations from '../../components/animals/AnimalGestations'";
if (content.includes(lastImport)) {
  content = content.replace(lastImport, lastImport + importsToAdd);
} else {
  console.log("Could not find last import anchor");
}

// 2. Remove local helper functions
const helpersToRemove = [
  /function formatDate\(d\) \{[\s\S]*?\}/,
  /function calcularMesesIdade\(dataNascimento, mesesCampo\) \{[\s\S]*?\}/,
  /function formatCurrency\(v\) \{[\s\S]*?\}/,
  /function localizacaoValidaParaExibir\(loc\) \{[\s\S]*?return null \/\/ Nome de touro ou inválido\s*\}/
];

helpersToRemove.forEach(regex => {
  content = content.replace(regex, '');
});

// 3. Replace Protocolos Sanitários
const protocolosSectionRegex = /\{\/\* Protocolos Sanitários \*\/\}[\s\S]*?\{\/\* Pesagens recentes \*\/\}/;
const protocolosComponent = `
          <AnimalHealthProtocols animal={animal} />

          {/* Pesagens recentes */}`;
content = content.replace(protocolosSectionRegex, protocolosComponent);

// 4. Replace Pesagens
const pesagensSectionRegex = /\{\/\* Pesagens recentes \*\/\}[\s\S]*?\{\/\* Custos \*\/\}/;
const pesagensComponent = `
          <AnimalWeightHistory animal={animal} />

          {/* Custos */}`;
content = content.replace(pesagensSectionRegex, pesagensComponent);

// 5. Replace Custos
const custosSectionRegex = /\{\/\* Custos \*\/\}[\s\S]*?\{\/\* DNA \*\/\}/;
const custosComponent = `
          <AnimalCosts animal={animal} />

          {/* DNA */}`;
content = content.replace(custosSectionRegex, custosComponent);

// 6. Replace DNA
const dnaSectionRegex = /\{\/\* DNA \*\/\}[\s\S]*?\{\/\* Informações Adicionais \*\/\}/;
const dnaComponent = `
          <AnimalGenetics animal={animal} />

          {/* Informações Adicionais */}`;
content = content.replace(dnaSectionRegex, dnaComponent);

// 7. Replace Informações Adicionais
const infoSectionRegex = /\{\/\* Informações Adicionais \*\/\}[\s\S]*?<\/div>\s*<div className="fixed bottom-0/;
const infoComponent = `
          <AnimalAdditionalInfo animal={animal} />
        </div>
        
        <div className="fixed bottom-0`;
// Note: The regex needs to be careful not to match too much.
// The original code ends the main container div just before the fixed bottom button.
// The info section is inside a check `{(animal.origem ... ) && ( ... )}`
// Let's target the start of "Informações Adicionais" comment and the closing brace of that block,
// followed by the closing div of the main container.

// Let's refine the regex for Info Adicional.
// It starts with `{/* Informações Adicionais */}`
// It ends before `{/* Botão fixo inferior */}` or the `</div>` that closes the main container.
// Looking at the file content:
// 1609: {/* Informações Adicionais */}
// ...
// 1679:   )}
// 1680: </div>
// 1681:
// 1682: {/* Botão fixo inferior */}

const infoSectionRefinedRegex = /\{\/\* Informações Adicionais \*\/\}[\s\S]*?\{\/\* Botão fixo inferior \*\/\}/;
const infoComponentRefined = `
          <AnimalAdditionalInfo animal={animal} />
        </div>

        {/* Botão fixo inferior */}`;

// We need to be careful about the closing </div> of the container (line 1680 in original).
// The `AnimalAdditionalInfo` replaces the conditional block.
// The `</div>` at line 1680 closes the `div` at line ... wait.
// Let's look at line 136 in original file... or rather the structure.
// The main container seems to be `div className="pb-32 space-y-6"`.
// So the `</div>` at 1680 closes that.
// My regex `infoSectionRefinedRegex` matches from `/* Informações Adicionais */` to `/* Botão fixo inferior */`.
// This includes the `</div>` at 1680?
// No, `[\s\S]*?` is non-greedy.
// The content between `Informações Adicionais` and `Botão fixo inferior` is:
// The conditional block `{(animal.origem ... )}` ending at 1679 `)}`
// And the `</div>` at 1680.
// So I should include the `</div>` in the replacement or keep it.
// If I use `infoComponentRefined`, I am putting `</div>` inside `infoComponentRefined`?
// No, `infoComponentRefined` has `</div>`.
// Let's check `infoSectionRefinedRegex` again.
// It matches everything from `/* Informações Adicionais */` up to `/* Botão fixo inferior */`.
// This includes the `</div>` before `/* Botão fixo inferior */`.
// So my replacement `infoComponentRefined` MUST include that `</div>`.
// Yes, `infoComponentRefined` has `</div>` before `{/* Botão fixo inferior */}`.

content = content.replace(infoSectionRefinedRegex, infoComponentRefined);

// 8. Remove `InfoRow` function at the end of the file
const infoRowRegex = /function InfoRow\(\{ label, value, action \}\) \{[\s\S]*?\}\s*$/;
content = content.replace(infoRowRegex, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated pages/consulta-animal/[id].jsx');
