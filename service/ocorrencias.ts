import { bancoDeDados } from "@/firebase-config";
import { Ocorrencia } from "@/types/ocorrencia";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

export async function buscarOcorrencias(): Promise<Ocorrencia[]> {
  const consulta = query(collection(bancoDeDados, "ocorrencias"), orderBy("criadoEm", "desc"), limit(50));
  const snapshot = await getDocs(consulta);
  return snapshot.docs.map((documento) => {
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
}
