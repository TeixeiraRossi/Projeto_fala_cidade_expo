import { MapaView } from "@/components/mapa-view";
import { TIPOS } from "@/constants/tipos";
import { useAuth } from "@/hooks/use-auth";
import { useCidade } from "@/hooks/use-cidade";
import { registrarOcorrencia } from "@/services/reportes";
import { cores } from "@/styles";
import { Severidade, TipoOcorrencia } from "@/types/ocorrencia";
import { buscarCodigoIbge } from "@/utils/municipios";
import { Feather } from "@react-native-vector-icons/feather";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertButton,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SEVERIDADES: { valor: Severidade; rotulo: string }[] = [
  { valor: "leve", rotulo: "Leve" },
  { valor: "moderado", rotulo: "Moderado" },
  { valor: "grave", rotulo: "Grave" },
];

const TOTAL_ETAPAS = 4;
const ETAPA_ATUAL = 2;

/** Barra de progresso: etapas concluídas (check), atual (verde) e futuras (cinza). */
function Etapas() {
  return (
    <View style={estilos.etapas}>
      {Array.from({ length: TOTAL_ETAPAS }, (_, i) => {
        const numero = i + 1;
        const concluida = numero < ETAPA_ATUAL;
        const atual = numero === ETAPA_ATUAL;
        return (
          <View key={numero} style={estilos.etapaItem}>
            {i > 0 && (
              <View
                style={[
                  estilos.etapaLinha,
                  numero <= ETAPA_ATUAL && { backgroundColor: cores.azul },
                ]}
              />
            )}
            <View
              style={[
                estilos.etapaBola,
                concluida && { backgroundColor: cores.azul },
                atual && { backgroundColor: cores.verde },
              ]}
            >
              {concluida ? (
                <Feather name="check" size={12} color={cores.branco} />
              ) : (
                <Text style={[estilos.etapaNumero, atual && { color: cores.branco }]}>
                  {numero}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const ENDERECO_BUSCANDO = "Buscando endereço...";
const ENDERECO_NAO_ENCONTRADO = "Endereço não encontrado";


function avisar(titulo: string, mensagem: string, botoes?: AlertButton[]) {
  if (Platform.OS !== "web") {
    Alert.alert(titulo, mensagem, botoes);
    return;
  }
  const texto = `${titulo}\n\n${mensagem}`;
  const cancelar = botoes?.find((botao) => botao.style === "cancel");
  const confirmar = botoes?.find((botao) => botao.style !== "cancel");
  if (cancelar && confirmar) {
    if (window.confirm(texto)) confirmar.onPress?.();
    else cancelar.onPress?.();
  } else {
    window.alert(texto);
    confirmar?.onPress?.();
  }
}

/** Texto do aviso exibido quando a gravação falhou. */
function montarMensagemDeErro(erro: unknown): string {
  const codigoDoErro = (erro as { code?: string }).code;

  if (codigoDoErro === "permission-denied") {
    return "Sem permissão para gravar. Confira se as regras de segurança do Firestore foram publicadas.";
  }
  return "Verifique sua conexão e tente novamente.";
}

export default function NovoReporte() {
  const router = useRouter();
  const { user: usuarioLogado } = useAuth();
  const { coordenadas, codigoIbge, atualizar } = useCidade();

  const [tipo, setTipo] = useState<TipoOcorrencia>("buraco");
  const [endereco, setEndereco] = useState(
    Platform.OS === "web" ? ENDERECO_NAO_ENCONTRADO : ENDERECO_BUSCANDO
  );
  const [severidade, setSeveridade] = useState<Severidade>("moderado");
  const [titulo, setTitulo] = useState("");
  const [cidadeManual, setCidadeManual] = useState("");
  const [ufManual, setUfManual] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const envioEmAndamento = useRef(false);

  // Converte as coordenadas do usuário em "Rua, número — Bairro".
  useEffect(() => {
    if (!coordenadas || Platform.OS === "web") return;
    let ativo = true;
    Location.reverseGeocodeAsync(coordenadas)
      .then(([lugar]) => {
        if (!ativo) return;
        const rua = [lugar?.street, lugar?.streetNumber].filter(Boolean).join(", ");
        const bairro = lugar?.district ?? lugar?.subregion;
        const texto = [rua, bairro].filter(Boolean).join(" — ");
        setEndereco(texto || ENDERECO_NAO_ENCONTRADO);
      })
      .catch(() => ativo && setEndereco(ENDERECO_NAO_ENCONTRADO));
    return () => {
      ativo = false;
    };
  }, [coordenadas]);

  async function enviar() {
    if (envioEmAndamento.current) return;
    // 1. Confere se o formulário e o usuário estão prontos para o envio.
    if (!titulo.trim()) {
      avisar("Título obrigatório", "Informe um título para o problema.");
      return;
    }
    if (!usuarioLogado) {
      avisar("Login necessário", "Entre com a sua conta para reportar um problema.");
      return;
    }
    if (!coordenadas) {
      avisar(
        "Localização indisponível",
        "Ative a localização para registrar onde está o problema."
      );
      return;
    }
    const codigoDaCidade = codigoIbge ?? (Platform.OS === "web"
      ? buscarCodigoIbge([cidadeManual.trim()], ufManual.trim().toUpperCase())
      : null);
    if (!codigoDaCidade) {
      if (Platform.OS === "web") {
        avisar("Cidade não identificada", "Informe uma cidade e uma UF válidas para continuar.");
        return;
      }
      avisar(
        "Cidade não identificada",
        "Não conseguimos identificar sua cidade. Confira se a localização está ativa e tente novamente.",
        [
          { text: "Tentar de novo", onPress: atualizar },
          { text: "Cancelar", style: "cancel" },
        ]
      );
      return;
    }

    // 2. Grava o reporte no Firebase.
    envioEmAndamento.current = true;
    setEnviando(true);
    try {
      // O endereço só é gravado se foi realmente encontrado (e não o texto de aviso).
      const enderecoFoiEncontrado =
        endereco !== ENDERECO_BUSCANDO && endereco !== ENDERECO_NAO_ENCONTRADO;

      const resultado = await registrarOcorrencia({
        usuarioLogado,
        tipo,
        titulo,
        descricao,
        severidade,
        coordenadas,
        endereco: enderecoFoiEncontrado ? endereco : null,
        codigoIbge: codigoDaCidade,
      });

      avisar("Reporte enviado", `Protocolo: ${resultado.id}`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (erro) {
      console.error("Falha ao gravar o reporte", erro);
      avisar("Não foi possível enviar", montarMensagemDeErro(erro));
    } finally {
      envioEmAndamento.current = false;
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.container} edges={["top", "bottom"]}>
      <View style={estilos.cabecalho}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={estilos.fechar}
          accessibilityLabel="Fechar"
        >
          <Feather name="x" size={22} color={cores.preto} />
        </Pressable>
        <Text style={estilos.titulo}>Novo reporte</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={estilos.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <Etapas />

          <Text style={estilos.rotulo}>1. Tipo de ocorrência *</Text>
          <View style={estilos.chips}>
            {(Object.keys(TIPOS) as TipoOcorrencia[]).map((valor) => {
              const ativo = tipo === valor;
              return (
                <Pressable
                  key={valor}
                  onPress={() => setTipo(valor)}
                  style={[estilos.chip, ativo && estilos.chipAtivo]}
                >
                  <Text style={[estilos.chipTexto, ativo && estilos.chipTextoAtivo]}>
                    {TIPOS[valor].rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={estilos.rotulo}>2. Título *</Text>
          <TextInput
            style={estilos.campoTitulo}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex.: Buraco na Rua das Palmeiras"
            placeholderTextColor={cores.cinzaEscuro}
            maxLength={150}
            accessibilityLabel="Título do reporte, obrigatório"
          />

          <Text style={estilos.rotulo}>3. Descrição (opcional)</Text>
          <TextInput
            style={estilos.descricao}
            value={descricao}
            onChangeText={setDescricao}
            maxLength={1000}
            placeholder={
              tipo === "outro"
                ? "Descreva o problema..."
                : "Conte mais detalhes sobre o problema..."
            }
            placeholderTextColor={cores.cinzaEscuro}
            multiline
            textAlignVertical="top"
          />

          <Text style={estilos.rotulo}>4. Localização</Text>
          <View style={estilos.mapa}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <MapaView coordenadas={coordenadas} style={StyleSheet.absoluteFill} />
            </View>
            <View style={estilos.pino} pointerEvents="none">
              <Feather name="map-pin" size={32} color="#dc2626" />
            </View>
          </View>
          <View style={estilos.endereco}>
            <Feather name="map-pin" size={18} color={cores.cinzaEscuro} />
            <Text style={estilos.enderecoTexto} numberOfLines={1}>
              {endereco}
            </Text>
          </View>

          {Platform.OS === "web" && !codigoIbge && (
            <>
              <Text style={estilos.rotulo}>Cidade e UF *</Text>
              <TextInput
                style={estilos.campoTitulo}
                value={cidadeManual}
                onChangeText={setCidadeManual}
                placeholder="Nome da cidade"
                placeholderTextColor={cores.cinzaEscuro}
                accessibilityLabel="Cidade"
              />
              <TextInput
                style={estilos.campoTitulo}
                value={ufManual}
                onChangeText={setUfManual}
                placeholder="UF, por exemplo MT"
                placeholderTextColor={cores.cinzaEscuro}
                autoCapitalize="characters"
                maxLength={2}
                accessibilityLabel="UF"
              />
            </>
          )}

          <Text style={estilos.rotulo}>Severidade</Text>
          <View style={estilos.chips}>
            {SEVERIDADES.map(({ valor, rotulo }) => {
              const ativa = severidade === valor;
              return (
                <Pressable
                  key={valor}
                  onPress={() => setSeveridade(valor)}
                  style={[estilos.chip, ativa && estilos.chipAtivo]}
                >
                  <Text style={[estilos.chipTexto, ativa && estilos.chipTextoAtivo]}>
                    {rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={enviar}
            disabled={enviando}
            style={({ pressed }) => [
              estilos.botao,
              (pressed || enviando) && { backgroundColor: cores.verdeEscuro },
            ]}
          >
            <Text style={estilos.botaoTexto}>
              {enviando ? "Enviando..." : "Enviar reporte"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BORDA = "#dfe4ea";

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bgBrancoGelo },
  cabecalho: {
    height: 56,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: cores.branco,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  fechar: { position: "absolute", left: 20 },
  titulo: { fontSize: 17, fontWeight: "700", color: cores.preto },
  conteudo: { padding: 16, paddingBottom: 32 },

  etapas: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  etapaItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  etapaLinha: { flex: 1, height: 2, backgroundColor: BORDA, marginHorizontal: 4 },
  etapaBola: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BORDA,
    alignItems: "center",
    justifyContent: "center",
  },
  etapaNumero: { fontSize: 10, fontWeight: "700", color: cores.cinzaEscuro },

  rotulo: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: cores.cinzaEscuro,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 8,
  },

  mapa: {
    height: 72,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#dfe8d8",
  },
  pino: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  endereco: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: cores.branco,
  },
  enderecoTexto: { flex: 1, fontSize: 14, color: cores.preto },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: cores.branco,
  },
  chipAtivo: { borderColor: cores.verde, backgroundColor: "#dcf3e5" },
  chipTexto: { fontSize: 12, fontWeight: "600", color: cores.cinzaEscuro },
  chipTextoAtivo: { color: cores.verde },

  campoTitulo: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: cores.branco,
    fontSize: 14,
    color: cores.preto,
  },
  descricao: {
    minHeight: 72,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: cores.branco,
    fontSize: 14,
    color: cores.preto,
  },

  botao: {
    marginTop: 20,
    height: 50,
    borderRadius: 16,
    backgroundColor: cores.verde,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: cores.verde,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  botaoTexto: { color: cores.branco, fontSize: 16, fontWeight: "700" },
});
