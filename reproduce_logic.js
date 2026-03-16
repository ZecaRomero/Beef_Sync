
const animal = {
  id: 123, // dummy
  serie: 'CJCJ',
  rg: '13604',
  nome: 'Some Mother'
};

const topAnimal = {
  id: 873,
  serie: 'CJCJ',
  rg: '16974',
  nome: 'JALOUSIER SANT ANNA',
  mae: 'MOSCA SANT ANNA',
  serie_mae: 'CJCJ',
  rg_mae: '15959',
  abczg: '47.71'
};

const normSerie = (v) => String(v || '').trim().toUpperCase().replace(/\s+/g, '')
const normRg = (v) => (String(v || '').trim().replace(/^0+/, '') || '0')

const parseMaeTexto = (maeTexto) => {
  const txt = String(maeTexto || '').trim()
  if (!txt) return null
  const m = txt.match(/([A-Za-z]+)[^A-Za-z0-9]*([0-9]+)$/)
  if (!m) return null
  return { serie: normSerie(m[1]), rg: normRg(m[2]) }
}

const maePorTexto = parseMaeTexto(topAnimal?.mae)
console.log('maePorTexto:', maePorTexto);

const animalSerie = normSerie(animal?.serie)
const animalRg = normRg(animal?.rg)
console.log('animalSerie:', animalSerie);
console.log('animalRg:', animalRg);

const maeConferePorTexto = Boolean(maePorTexto) &&
  maePorTexto.serie === animalSerie &&
  maePorTexto.rg === animalRg
console.log('maeConferePorTexto:', maeConferePorTexto);

const maeConferePorCampos = !maePorTexto &&
  topAnimal?.serie_mae != null && topAnimal?.rg_mae != null &&
  normSerie(topAnimal.serie_mae) === animalSerie &&
  normRg(topAnimal.rg_mae) === animalRg
console.log('maeConferePorCampos:', maeConferePorCampos);

const maeConfere = maeConferePorTexto || maeConferePorCampos
console.log('maeConfere:', maeConfere);
