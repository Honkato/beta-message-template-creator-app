// types/index.ts (Adicione ao final do arquivo)

export interface FotoMidia {
  id: string;
  uri: string;        // Caminho físico seguro no dispositivo
  ehPrimaria: boolean; // Indica se é a imagem de exibição principal
}

export interface ItemImagem {
  id: string;
  titulo: string;     // Título identificador (Ex: "Comprovante Pix")
  fotos: FotoMidia[]; // Lista de mídias associadas
  criadoEm: number;
}
