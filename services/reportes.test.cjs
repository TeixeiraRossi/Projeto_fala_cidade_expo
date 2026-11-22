const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function prepararCenario() {
  let criacoes = 0;
  let anexos = 0;
  let falharFoto = true;
  let falharAnexo = false;
  const envios = [];
  const dependencias = {
    '@/firebase-config': { bancoDeDados: {}, nomeDoBucket: 'teste' },
    '@/services/usuarios': { garantirCadastroDoNotificante: async () => {} },
    '@/services/fotos': { enviarFoto: async (_bucket, _usuario, _uri, caminho) => {
      envios.push(caminho);
      if (falharFoto && caminho.endsWith('problema/2.jpg')) throw new Error('rede');
      return { caminhoNoArmazenamento: caminho };
    } },
    '@/utils/geohash': { gerarGeohash: () => 'teste' },
    'firebase/firestore': {
      addDoc: async () => { criacoes++; return { id: 'protocolo-1' }; },
      collection: () => ({}), doc: (_db, _colecao, id) => ({ id }),
      GeoPoint: class GeoPoint {}, serverTimestamp: () => 'agora',
      updateDoc: async () => { anexos++; if (falharAnexo) throw new Error('rede'); },
    },
  };
  const codigo = ts.transpileModule(readFileSync('services/reportes.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(codigo, { exports, require: (nome) => {
    if (!(nome in dependencias)) throw new Error(`Dependência inesperada: ${nome}`);
    return dependencias[nome];
  }, console: { warn() {}, error() {} } });
  const dados = {
    usuarioLogado: { uid: 'usuario' }, tipo: 'buraco', titulo: 'Teste', descricao: '',
    severidade: 'leve', coordenadas: { latitude: -11, longitude: -55 },
    endereco: null, codigoIbge: '5107909', fotosDoProblema: ['foto1', 'foto2'], fotosDeReferencia: [],
  };
  return { api: exports, dados, envios, get criacoes() { return criacoes; },
    get anexos() { return anexos; }, permitirFotos() { falharFoto = false; },
    definirFalhaAnexo(valor) { falharAnexo = valor; } };
}

test('retoma somente fotos que falharam sem recriar a ocorrência', async () => {
  const c = prepararCenario();
  const primeira = await c.api.enviarReporte(c.dados);
  assert.equal(primeira.quantidadeDeFotosComFalha, 1);
  assert.equal(c.anexos, 0);
  c.permitirFotos();
  const segunda = await c.api.reenviarFotos(primeira.pendencia);
  assert.equal(segunda.pendencia, undefined);
  assert.equal(c.criacoes, 1);
  assert.equal(c.anexos, 1);
  assert.equal(c.envios.filter((caminho) => caminho.endsWith('problema/1.jpg')).length, 1);
  assert.equal(c.envios.filter((caminho) => caminho.endsWith('problema/2.jpg')).length, 2);
});

test('retenta o vínculo sem enviar de novo fotos já armazenadas', async () => {
  const c = prepararCenario();
  c.permitirFotos();
  c.definirFalhaAnexo(true);
  const primeira = await c.api.enviarReporte(c.dados);
  assert.equal(primeira.falhaAoAnexarFotos, true);
  c.definirFalhaAnexo(false);
  const segunda = await c.api.reenviarFotos(primeira.pendencia);
  assert.equal(segunda.pendencia, undefined);
  assert.equal(c.criacoes, 1);
  assert.equal(c.anexos, 2);
  assert.equal(c.envios.length, 2);
});
