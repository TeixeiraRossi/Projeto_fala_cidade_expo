import { Coordenadas } from "@/context/cidade-context";
import { bancoDeDados, nomeDoBucket } from "@/firebase-config";
import { enviarFoto, FotoGravada } from "@/services/fotos";
import { garantirCadastroDoNotificante } from "@/services/usuarios";
import { Severidade, TipoOcorrencia } from "@/types/ocorrencia";
import { gerarGeohash } from "@/utils/geohash";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  DocumentReference,
  GeoPoint,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

/*
 * Grava um reporte no Firebase seguindo o modelo de dados do projeto
 * (claude/modelo-dados-firebase.md). Coleções, campos e valores gravados estão
 * todos em português, assim como o código.
 */

export type DadosDoReporte = {
  usuarioLogado: User;
  tipo: TipoOcorrencia;
  titulo: string;
  descricao: string;
  severidade: Severidade;
  coordenadas: Coordenadas;
  endereco: string | null;
  codigoIbge: string; // código IBGE da cidade, vira o `idCidade` da ocorrência
  fotosDoProblema: string[]; // fotos já comprimidas, até 5
  fotosDeReferencia: string[]; // fotos já comprimidas, até 2
};

export type ResultadoDoReporte = {
  idOcorrencia: string;
  armazenamentoAtivo: boolean; // false = bucket não configurado, fotos não enviadas
  quantidadeDeFotosEnviadas: number;
  quantidadeDeFotosComFalha: number;
  falhaAoAnexarFotos: boolean;
  pendencia?: EnvioDeFotosPendente;
};

type FotoPendente = { uri: string; gravada: FotoGravada | null };
export type EnvioDeFotosPendente = {
  idOcorrencia: string;
  usuarioLogado: User;
  problema: FotoPendente[];
  referencia: FotoPendente[];
};

/** Passo 1: cria o documento da ocorrência, com as listas de fotos ainda vazias. */
async function criarOcorrencia(dados: DadosDoReporte): Promise<DocumentReference> {
  const { latitude, longitude } = dados.coordenadas;

  return addDoc(collection(bancoDeDados, "ocorrencias"), {
    idNotificante: dados.usuarioLogado.uid,
    idCidade: dados.codigoIbge,
    idDepartamento: null,
    tipo: dados.tipo,
    titulo: dados.titulo.trim(),
    localizacao: new GeoPoint(latitude, longitude),
    latitude,
    longitude,
    geohash: gerarGeohash(latitude, longitude),
    endereco: dados.endereco,
    descricao: dados.descricao.trim() || null,
    severidade: dados.severidade,
    situacao: "aberta",
    status: "aberto",
    fotos: { problema: [], referencia: [], resolvida: [] },
    quantidadeApoios: 0,
    criadoEm: serverTimestamp(),
    reconhecidoEm: null,
    resolvidoEm: null,
    confirmadoEm: null,
    tempoResolucaoSegundos: null,
    quantidadeReaberturas: 0,
    atualizadoEm: serverTimestamp(),
  });
}

/**
 * Envia as fotos de uma pasta (ex.: problema/1.jpg, problema/2.jpg...).
 * Se uma foto falhar, as outras continuam sendo enviadas.
 */
async function enviarGrupoDeFotos(
  nomeDoBucketAtivo: string,
  usuarioLogado: User,
  fotos: FotoPendente[],
  pasta: string
): Promise<FotoPendente[]> {
  const resultado: FotoPendente[] = [];
  for (let posicao = 0; posicao < fotos.length; posicao++) {
    const fotoPendente = fotos[posicao];
    if (fotoPendente.gravada) {
      resultado.push(fotoPendente);
      continue;
    }
    const numeroDaFoto = posicao + 1; // os arquivos são numerados a partir de 1
    const caminho = `${pasta}/${numeroDaFoto}.jpg`;

    try {
      const foto = await enviarFoto(nomeDoBucketAtivo, usuarioLogado, fotoPendente.uri, caminho);
      resultado.push({ ...fotoPendente, gravada: foto });
    } catch (erro) {
      resultado.push(fotoPendente);
      console.warn(`Falha ao enviar a foto ${caminho}`, erro);
    }
  }

  return resultado;
}

/** Passo 3: anexa ao documento da ocorrência as URLs das fotos que foram enviadas. */
async function anexarFotosNaOcorrencia(
  ocorrencia: DocumentReference,
  fotosDoProblema: FotoGravada[],
  fotosDeReferencia: FotoGravada[]
): Promise<void> {
  await updateDoc(ocorrencia, {
    "fotos.problema": fotosDoProblema,
    "fotos.referencia": fotosDeReferencia,
    atualizadoEm: serverTimestamp(),
  });
}

/**
 * Grava o reporte completo. O fluxo tem 3 passos porque a regra do Storage
 * precisa que o documento da ocorrência já exista antes de aceitar a foto:
 *   1. cria a ocorrência no Firestore (com as listas de fotos vazias);
 *   2. envia as fotos para o Storage;
 *   3. anexa as URLs das fotos na ocorrência.
 */
export async function enviarReporte(dados: DadosDoReporte): Promise<ResultadoDoReporte> {
  await garantirCadastroDoNotificante(dados.usuarioLogado);

  const ocorrencia = await criarOcorrencia(dados);
  return reenviarFotos({
    idOcorrencia: ocorrencia.id,
    usuarioLogado: dados.usuarioLogado,
    problema: dados.fotosDoProblema.map((uri) => ({ uri, gravada: null })),
    referencia: dados.fotosDeReferencia.map((uri) => ({ uri, gravada: null })),
  });
}

/** Retoma as fotos do mesmo reporte enquanto a tela estiver aberta. */
export async function reenviarFotos(pendente: EnvioDeFotosPendente): Promise<ResultadoDoReporte> {
  // Sem bucket configurado: a ocorrência já foi gravada, só não há fotos.
  if (!nomeDoBucket) {
    return {
      idOcorrencia: pendente.idOcorrencia,
      armazenamentoAtivo: false,
      quantidadeDeFotosEnviadas: 0,
      quantidadeDeFotosComFalha: 0,
      falhaAoAnexarFotos: false,
      pendencia: pendente,
    };
  }

  const pastaDaOcorrencia = `ocorrencias/${pendente.idOcorrencia}`;
  const fotosDoProblema = await enviarGrupoDeFotos(
    nomeDoBucket,
    pendente.usuarioLogado,
    pendente.problema,
    `${pastaDaOcorrencia}/problema`
  );
  const fotosDeReferencia = await enviarGrupoDeFotos(
    nomeDoBucket,
    pendente.usuarioLogado,
    pendente.referencia,
    `${pastaDaOcorrencia}/referencia`
  );

  const fotos = [...fotosDoProblema, ...fotosDeReferencia];
  const quantidadeDeFotosEnviadas = fotos.filter((foto) => foto.gravada !== null).length;
  const quantidadeDeFotosComFalha = fotos.length - quantidadeDeFotosEnviadas;
  const novaPendencia = { ...pendente, problema: fotosDoProblema, referencia: fotosDeReferencia };

  let falhaAoAnexarFotos = false;
  // A regra permite preencher cada lista apenas uma vez. Só anexamos depois
  // de todas as fotos chegarem ao Storage, para permitir novas tentativas.
  if (quantidadeDeFotosComFalha === 0 && quantidadeDeFotosEnviadas > 0) {
    try {
      await anexarFotosNaOcorrencia(
        doc(bancoDeDados, "ocorrencias", pendente.idOcorrencia),
        fotosDoProblema.map((foto) => foto.gravada as FotoGravada),
        fotosDeReferencia.map((foto) => foto.gravada as FotoGravada)
      );
    } catch (erro) {
      // A ocorrência já existe: informar a falha sem sugerir recriá-la.
      falhaAoAnexarFotos = true;
      console.error("Falha ao vincular fotos à ocorrência", pendente.idOcorrencia, erro);
    }
  }

  return {
    idOcorrencia: pendente.idOcorrencia,
    armazenamentoAtivo: true,
    quantidadeDeFotosEnviadas,
    falhaAoAnexarFotos,
    quantidadeDeFotosComFalha,
    pendencia: quantidadeDeFotosComFalha > 0 || falhaAoAnexarFotos ? novaPendencia : undefined,
  };
}
