import { bancoDeDados } from "@/firebase-config";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export type Participante = { uid: string; nome: string; total: number; posicao: number };

export async function buscarRanking(): Promise<Participante[]> {
  // O contador no perfil depende de uma Cloud Function. Contar os reportes já
  // gravados inclui também os anteriores à criação desta tela.
  const reportes = await getDocs(collection(bancoDeDados, "ocorrencias"));
  const totais = new Map<string, number>();
  for (const reporte of reportes.docs) {
    const uid = reporte.get("idNotificante");
    if (typeof uid === "string" && uid) totais.set(uid, (totais.get(uid) ?? 0) + 1);
  }

  const primeiros = [...totais].sort(([a, totalA], [b, totalB]) =>
    totalB - totalA || a.localeCompare(b)
  ).slice(0, 10);
  let posicao = 0;
  return Promise.all(primeiros.map(([uid, total], indice) => {
    // Empates mantêm a posição; o UID só estabiliza a ordem de exibição.
    if (indice === 0 || primeiros[indice - 1][1] !== total) posicao = indice + 1;
    const lugar = posicao;
    return getDoc(doc(bancoDeDados, "usuarios", uid)).then((perfil) => {
      const nome = perfil.get("nomeExibicao");
      return { uid, total, posicao: lugar, nome: typeof nome === "string" && nome.trim() ? nome.trim() : "Participante" };
    });
  }));
}
