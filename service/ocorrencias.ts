import { bancoDeDados } from "@/firebase-config";
import { Ocorrencia } from "@/types/ocorrencia";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";

export async function buscarOcorrencias(uid?: string): Promise<Ocorrencia[]> {
  const colecao = collection(bancoDeDados, "ocorrencias");
  // A consulta pessoal parte de todos os reportes do autor. Ordenar depois
  // evita exigir um índice composto e inclui reportes fora dos 50 gerais.
  const consulta = uid
    ? query(colecao, where("idNotificante", "==", uid))
    : query(colecao, orderBy("criadoEm", "desc"), limit(50));
  const snapshot = await getDocs(consulta);
  const lista: Ocorrencia[] = snapshot.docs.map((documento) => {
    const dados = documento.data();
    const status = dados.status === "em_execucao" || dados.status === "resolvido"
      ? dados.status : "aberto";
    return {
      id: documento.id,
      titulo: dados.titulo,
      tipo: dados.tipo,
      descricao: dados.descricao,
      status,
      latitude: dados.latitude ?? dados.localizacao?.latitude,
      longitude: dados.longitude ?? dados.localizacao?.longitude,
      endereco: dados.endereco,
      idNotificante: dados.idNotificante,
      criadoEm: dados.criadoEm?.toDate?.(),
    };
  });
  if (uid) lista.sort((a, b) => (b.criadoEm?.getTime() ?? 0) - (a.criadoEm?.getTime() ?? 0));
  return lista;
}
