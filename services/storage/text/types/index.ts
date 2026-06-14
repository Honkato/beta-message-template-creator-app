export interface ItemTexto {
  id: string;        // Um identificador único gerado pelo timestamp
  conteudo: string;  // O texto da mensagem em si
  criadoEm: number;  // Data de criação em milissegundos
}