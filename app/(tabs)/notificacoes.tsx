import { bancoDeDados } from "@/firebase-config";
import { useAuth } from "@/hooks/use-auth";
import { cores } from "@/styles";
import { estilosAbas as estilos } from "@/styles/abas";
import { Link, useFocusEffect } from "expo-router";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Notificacao = { id: string; titulo: string; mensagem: string; lida: boolean; data: number };

export default function Notificacoes() {
  const { user, isReady } = useAuth();
  return (
    <SafeAreaView style={estilos.tela} edges={["top"]}>
      <Text style={estilos.titulo}>Notificações</Text>
      {!isReady ? <ActivityIndicator color={cores.verde} /> : user ? (
        <CaixaDeEntrada key={user.uid} uid={user.uid} />
      ) : <Link href="/" style={estilos.acao}>Entre para ver suas notificações</Link>}
    </SafeAreaView>
  );
}

function CaixaDeEntrada({ uid }: { uid: string }) {
  const [lista, setLista] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [falhaLeitura, setFalhaLeitura] = useState(false);
  const [falhaGravacao, setFalhaGravacao] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useFocusEffect(useCallback(() => {
    setCarregando(true);
    setFalhaLeitura(false);
    // Cada usuário tem uma subcoleção privada. Ao sair da aba, o retorno
    // de onSnapshot encerra a escuta para evitar leituras em segundo plano.
    return onSnapshot(collection(bancoDeDados, "usuarios", uid, "notificacoes"), snapshot => {
      const avisos = snapshot.docs.map(registro => {
        const dados = registro.data();
        return {
          id: registro.id, titulo: String(dados.titulo || "Atualização do reporte"),
          mensagem: String(dados.mensagem || dados.corpo || ""),
          lida: dados.lida === true, data: Number(dados.criadoEm?.toMillis?.() ?? 0),
        };
      });
      setLista(avisos.sort((a, b) => b.data - a.data || a.id.localeCompare(b.id)));
      setCarregando(false);
    }, () => { setFalhaLeitura(true); setCarregando(false); });
  }, [uid, tentativa]));

  async function marcarComoLida(id: string) {
    setFalhaGravacao(false);
    try {
      // As regras permitem que o destinatário altere apenas o campo lida.
      await updateDoc(doc(bancoDeDados, "usuarios", uid, "notificacoes", id), { lida: true });
    } catch {
      setFalhaGravacao(true);
    }
  }

  return (
    <>
      {falhaLeitura && <Pressable onPress={() => setTentativa(n => n + 1)}>
        <Text style={estilos.acao}>Falha ao carregar. Tentar novamente</Text>
      </Pressable>}
      {falhaGravacao && <Text style={estilos.secundario}>Falha ao marcar como lida. Tente novamente.</Text>}
      <FlatList data={lista} keyExtractor={item => item.id} contentContainerStyle={estilos.lista}
        ListEmptyComponent={carregando ? <ActivityIndicator color={cores.verde} /> :
          falhaLeitura ? null : <Text style={estilos.secundario}>Você ainda não recebeu notificações.</Text>}
        renderItem={({ item }) => (
          <View style={estilos.cartao}>
            <Text style={estilos.destaque}>{item.lida ? "Lida" : "Não lida"}</Text>
            <Text style={estilos.assunto}>{item.titulo}</Text>
            {item.mensagem ? <Text style={estilos.secundario}>{item.mensagem}</Text> : null}
            {item.data > 0 && <Text style={estilos.secundario}>{new Date(item.data).toLocaleString("pt-BR")}</Text>}
            {!item.lida && <Pressable onPress={() => marcarComoLida(item.id)}>
              <Text style={estilos.acao}>Marcar como lida</Text>
            </Pressable>}
          </View>
        )}
      />
    </>
  );
}
