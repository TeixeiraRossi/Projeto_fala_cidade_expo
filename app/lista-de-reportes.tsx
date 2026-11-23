import { STATUS } from "@/constants/status";
import { useAuth } from "@/hooks/use-auth";
import { TIPOS } from "@/constants/tipos";
import { useOcorrencias } from "@/hooks/use-ocorrencias";
import { cores } from "@/styles";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ListaDeReportes() {
  const roteador = useRouter();
  const { user: usuario } = useAuth();

  // Busca as ocorrências reais do Firestore e recebe a função de recarregar
  const { ocorrencias, carregando, erro, recarregar } = useOcorrencias();

  // Melhoria extra: estado para alternar entre "Todos os reportes" e "Meus reportes"
  const [apenasMeus, setApenasMeus] = useState(false);

  // Filtra no próprio aplicativo para evitar erro de índice composto no Firestore
  const listaExibida = apenasMeus && usuario
    ? ocorrencias.filter((item) => item.idNotificante === usuario.uid)
    : ocorrencias;

  // Formata a data vinda do Firestore (.toDate()) para o padrão brasileiro
  function formatarData(data?: Date) {
    if (!data) return "Data indisponível";
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <SafeAreaView style={estilos.container}>
      {/* Cabeçalho com botão voltar e botão atualizar (útil no navegador do PC) */}
      <View style={estilos.cabecalho}>
        <TouchableOpacity onPress={() => roteador.back()}>
          <Text style={estilos.voltar}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={estilos.titulo}>Reportes</Text>
        <TouchableOpacity onPress={recarregar} disabled={carregando}>
          <Text style={estilos.atualizar}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      {/* Botões de filtro: Todos vs Meus reportes (item bônus do Desafio 2) */}
      <View style={estilos.filtros}>
        <TouchableOpacity
          style={[estilos.botaoFiltro, !apenasMeus && estilos.filtroAtivo]}
          onPress={() => setApenasMeus(false)}
        >
          <Text style={[estilos.textoFiltro, !apenasMeus && estilos.textoFiltroAtivo]}>
            Todos ({ocorrencias.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[estilos.botaoFiltro, apenasMeus && estilos.filtroAtivo]}
          disabled={!usuario}
          onPress={() => setApenasMeus(true)}
        >
          <Text style={[estilos.textoFiltro, apenasMeus && estilos.textoFiltroAtivo]}>
            Meus reportes
          </Text>
        </TouchableOpacity>
      </View>

      {carregando && listaExibida.length === 0 && (
        <ActivityIndicator color={cores.verde} style={{ marginTop: 20 }} />
      )}

      {erro && <Text style={estilos.vazio}>{erro}</Text>}

      {!erro && !carregando && listaExibida.length === 0 && (
        <Text style={estilos.vazio}>Nenhum reporte encontrado.</Text>
      )}

      {/* Lista com RefreshControl (puxar-para-atualizar) */}
      <FlatList
        data={listaExibida}
        keyExtractor={(ocorrencia) => ocorrencia.id}
        refreshControl={
          <RefreshControl
            refreshing={carregando}
            onRefresh={recarregar}
            colors={[cores.verde]}
          />
        }
        renderItem={({ item }) => {
          const categoria = item.tipo && (TIPOS[item.tipo]?.rotulo ?? item.tipo);

          return (
            <View style={estilos.cartao}>
              <View
                style={[
                  estilos.bolinha,
                  { backgroundColor: STATUS[item.status]?.cor || cores.verde },
                ]}
              />
              <View style={estilos.textos}>
                {categoria && (
                  <Text style={estilos.categoria}>{categoria}</Text>
                )}

                <Text style={estilos.tituloDoReporte}>{item.titulo}</Text>

                {item.descricao && (
                  <Text style={estilos.descricao}>{item.descricao}</Text>
                )}

                {item.endereco && (
                  <Text style={estilos.endereco}>📍 {item.endereco}</Text>
                )}

                <View style={estilos.rodapeCartao}>
                  <Text style={estilos.situacao}>
                    {STATUS[item.status]?.rotulo || item.status}
                  </Text>
                  <Text style={estilos.data}>{formatarData(item.criadoEm)}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: cores.bgBrancoGelo,
  },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  voltar: {
    color: cores.verde,
    fontSize: 16,
    fontWeight: "600",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: cores.preto,
  },
  atualizar: {
    color: cores.verde,
    fontSize: 15,
    fontWeight: "600",
  },
  filtros: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  botaoFiltro: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  filtroAtivo: {
    backgroundColor: cores.verde,
    borderColor: cores.verde,
  },
  textoFiltro: {
    color: cores.preto,
    fontWeight: "600",
    fontSize: 14,
  },
  textoFiltroAtivo: {
    color: cores.branco,
  },
  vazio: {
    textAlign: "center",
    color: cores.cinzaEscuro,
    marginTop: 24,
    fontSize: 15,
  },
  cartao: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  bolinha: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  textos: {
    flex: 1,
  },
  categoria: {
    fontSize: 12,
    fontWeight: "700",
    color: cores.verde,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  tituloDoReporte: {
    fontSize: 16,
    fontWeight: "700",
    color: cores.preto,
  },
  descricao: {
    fontSize: 14,
    color: cores.cinzaEscuro,
    marginTop: 4,
  },
  endereco: {
    fontSize: 13,
    color: cores.cinzaEscuro,
    marginTop: 6,
  },
  rodapeCartao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  situacao: {
    fontSize: 12,
    fontWeight: "600",
    color: cores.cinzaClaro,
  },
  data: {
    fontSize: 12,
    color: cores.cinzaClaro,
  },
});
