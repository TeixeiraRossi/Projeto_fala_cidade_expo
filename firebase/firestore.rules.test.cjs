const { readFileSync } = require('node:fs');
const { test, before, after, beforeEach } = require('node:test');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, GeoPoint, serverTimestamp } = require('firebase/firestore');

let ambiente;
const projeto = 'demo-falaa-cidade';
const uid = 'cidadao-teste';
const referencia = (db) => doc(db, 'ocorrencias', 'teste');
const dados = () => ({
  idNotificante: uid, idCidade: '5107909', idDepartamento: null,
  tipo: 'buraco', titulo: 'Buraco na rua', descricao: null, severidade: 'moderado',
  localizacao: new GeoPoint(-11.86, -55.5), latitude: -11.86, longitude: -55.5,
  situacao: 'aberta', status: 'aberto', fotos: { problema: [], referencia: [], resolvida: [] },
  quantidadeApoios: 0, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(),
  tempoResolucaoSegundos: null, confirmadoEm: null, quantidadeReaberturas: 0,
});

before(async () => {
  ambiente = await initializeTestEnvironment({
    projectId: projeto,
    firestore: { rules: readFileSync('firebase/firestore.rules', 'utf8') },
  });
});
beforeEach(async () => ambiente.clearFirestore());
after(async () => ambiente && ambiente.cleanup());

test('permite criar uma ocorrência válida', async () => {
  await assertSucceeds(setDoc(referencia(ambiente.authenticatedContext(uid).firestore()), dados()));
});
test('nega criação sem autenticação', async () => {
  await assertFails(setDoc(referencia(ambiente.unauthenticatedContext().firestore()), dados()));
});
test('nega criação em nome de outro usuário', async () => {
  await assertFails(setDoc(referencia(ambiente.authenticatedContext('outro').firestore()), dados()));
});
for (const [nome, alteracoes] of [
  ['título vazio', { titulo: '' }],
  ['título com espaços', { titulo: '   ' }],
  ['status inválido', { status: 'resolvido' }],
  ['latitude divergente', { latitude: -12 }],
  ['longitude divergente', { longitude: -56 }],
]) {
  test(`nega ${nome}`, async () => {
    await assertFails(setDoc(referencia(ambiente.authenticatedContext(uid).firestore()), { ...dados(), ...alteracoes }));
  });
}
test('permite ao autor anexar fotos sem alterar status', async () => {
  const ref = referencia(ambiente.authenticatedContext(uid).firestore());
  await assertSucceeds(setDoc(ref, dados()));
  await assertSucceeds(updateDoc(ref, { 'fotos.problema': [{ url: 'teste' }], atualizadoEm: serverTimestamp() }));
});
test('exige status coerente na transição da prefeitura', async () => {
  const refAutor = referencia(ambiente.authenticatedContext(uid).firestore());
  await assertSucceeds(setDoc(refAutor, dados()));
  const prefeitura = ambiente.authenticatedContext('prefeitura', {
    papel: 'prefeitura', idCidade: '5107909', idDepartamento: 'obras',
  }).firestore();
  const ref = referencia(prefeitura);
  await assertFails(updateDoc(ref, { situacao: 'reconhecida', status: 'resolvido', idDepartamento: 'obras' }));
  await assertSucceeds(updateDoc(ref, { situacao: 'reconhecida', status: 'aberto', idDepartamento: 'obras' }));
  await assertFails(updateDoc(ref, { situacao: 'em_execucao', status: 'aberto' }));
  await assertSucceeds(updateDoc(ref, { situacao: 'em_execucao', status: 'em_execucao' }));
  await assertSucceeds(updateDoc(ref, { situacao: 'resolvida', status: 'resolvido' }));
});
