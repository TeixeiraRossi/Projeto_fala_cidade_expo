import { buscarOcorrencias } from "@/service/ocorrencias";
import { Ocorrencia } from "@/types/ocorrencia";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export function useOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useFocusEffect(useCallback(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    buscarOcorrencias()
      .then((lista) => { if (ativo) setOcorrencias(lista); })
      .catch((causa) => {
        if (ativo) {
          console.warn("Falha ao consultar ocorrências", causa);
          setErro("Não foi possível carregar os reportes.");
        }
      })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [tentativa]));

  return { ocorrencias, carregando, erro, recarregar: () => setTentativa((valor) => valor + 1) };
}
