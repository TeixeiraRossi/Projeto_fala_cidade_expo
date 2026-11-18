import { bancoDeDados } from "@/firebase-config";
import { TipoOcorrencia } from "@/types/ocorrencia";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export type DadosDoReporte = {
  idNotificante: string;
  titulo: string;
  descricao: string;
  tipo: TipoOcorrencia;
  severidade: "leve" | "moderado" | "grave";
  endereco: string | null;
  latitude: number;
  longitude: number;
};

export async function criarReporte(dados: DadosDoReporte): Promise<string> {
  // addDoc cria um documento com identificador automático na coleção ocorrencias.
  const documento = await addDoc(collection(bancoDeDados, "ocorrencias"), {
    ...dados,
    titulo: dados.titulo.trim(),
    descricao: dados.descricao.trim() || null,
    status: "aberto",
    // O servidor registra a data para não depender do relógio do aparelho.
    criadoEm: serverTimestamp(),
  });
  return documento.id;
}
