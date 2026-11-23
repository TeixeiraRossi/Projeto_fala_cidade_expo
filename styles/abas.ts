import { StyleSheet } from "react-native";
import { cores } from "@/styles";

export const estilosAbas = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.bgBrancoGelo, padding: 16 },
  titulo: { fontSize: 24, fontWeight: "700", color: cores.preto, marginBottom: 6 },
  secundario: { color: cores.cinzaEscuro, fontSize: 15 },
  lista: { paddingVertical: 16, gap: 8 },
  cartao: { padding: 16, borderRadius: 14, gap: 6, backgroundColor: cores.branco },
  linha: { flexDirection: "row", alignItems: "center", gap: 12 },
  nome: { flex: 1, fontSize: 16, fontWeight: "600", color: cores.preto },
  assunto: { fontSize: 16, fontWeight: "600", color: cores.preto },
  destaque: { color: cores.verdeEscuro, fontWeight: "700" },
  acao: { paddingVertical: 10, color: cores.verdeEscuro, fontWeight: "700" },
});
