import { useAuth } from "@/hooks/use-auth";
import { buscarRanking, type Participante } from "@/services/ranking";
import { cores } from "@/styles";
import { estilosAbas as estilos } from "@/styles/abas";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Ranking() {
  const { user, isReady } = useAuth();
  return (
    <SafeAreaView style={estilos.tela} edges={["top"]}>
      <Text style={estilos.titulo}>Ranking</Text>
      {!isReady ? <ActivityIndicator color={cores.verde} /> : user ? (
        <Classificacao key={user.uid} uid={user.uid} />
      ) : <Link href="/" style={estilos.acao}>Entre para ver o ranking</Link>}
    </SafeAreaView>
  );
}

function Classificacao({ uid }: { uid: string }) {
  const [lista, setLista] = useState<Participante[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useFocusEffect(useCallback(() => {
    let ativo = true;
    setCarregando(true);
    setErro(false);
    buscarRanking()
      .then((dados) => { if (ativo) setLista(dados); })
      .catch(() => { if (ativo) setErro(true); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [tentativa]));

  return (
    <>
      <Text style={estilos.secundario}>Os 10 participantes com mais reportes registrados.</Text>
      {erro && <Pressable onPress={() => setTentativa(n => n + 1)}>
        <Text style={estilos.acao}>Falha ao carregar. Tentar novamente</Text>
      </Pressable>}
      <FlatList data={lista} keyExtractor={item => item.uid} contentContainerStyle={estilos.lista}
        refreshing={carregando} onRefresh={() => setTentativa(n => n + 1)}
        ListEmptyComponent={carregando ? <ActivityIndicator color={cores.verde} /> :
          erro ? undefined : <Text style={estilos.secundario}>Ainda não há reportes registrados.</Text>}
        renderItem={({ item }) => (
          <View style={[estilos.cartao, estilos.linha]}>
            <Text style={estilos.destaque}>{item.posicao}º</Text>
            <Text style={estilos.nome}>{item.nome}{item.uid === uid ? " (você)" : ""}</Text>
            <Text style={estilos.secundario}>{item.total} {item.total === 1 ? "reporte" : "reportes"}</Text>
          </View>
        )}
      />
    </>
  );
}
