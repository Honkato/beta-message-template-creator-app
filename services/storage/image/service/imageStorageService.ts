import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
// import { Paths, FileCreateOptions } from 'expo-file-system'
import { ItemImagem, FotoMidia } from '../types';

const PREFIXO_KEY = 'MTCAPP:imagem';

function obterChaveCategoria(categoria: string): string {
  return `${PREFIXO_KEY}/${categoria.trim().toLowerCase()}`;
}

export const imageStorageService = {
  
  // 1. READ: Listar itens de imagem da categoria
  async listar(categoria: string): Promise<ItemImagem[]> {
    const chave = obterChaveCategoria(categoria);
    const dadosBrutos = await AsyncStorage.getItem(chave);
    return dadosBrutos ? (JSON.parse(dadosBrutos) as ItemImagem[]) : [];
  },

  // 2. CREATE: Salva o título e move todas as fotos para o armazenamento seguro do app
  async adicionar(categoria: string, titulo: string, fotosTemporarias: FotoMidia[]): Promise<string> {
    const chave = obterChaveCategoria(categoria);
    const listaAtual = await this.listar(categoria);
    const idItem = Date.now().toString();

    const fotosPermanentes: FotoMidia[] = [];

    // Move fisicamente cada foto do cache para a pasta permanente do App
    for (const foto of fotosTemporarias) {
      const extensao = foto.uri.split('.').pop() || 'jpg';
      const name = foto.uri.split("\\").findLast.toString()
      const exte = foto.uri.split('.').findLast.toString()
      
      const novoNomeArquivo = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${extensao}`;
    console.log("=====");
      console.log(foto.uri);
      console.log(name);
      console.log(exte);
      console.log(novoNomeArquivo);
      console.log("=====");

      
      // 🛠️ CORREÇÃO: Usando a constante direta importada no topo

    //   const caminhoPermanente = `${FileSystem.Paths.document.uri}/${novoNomeArquivo}`;
      const imagesDir = new FileSystem.Directory(FileSystem.Paths.document, 'images');

    if (!imagesDir.exists){
        imagesDir.create();
    }
    const sourceFile = new FileSystem.File(foto.uri)

    const destinationFile = new FileSystem.File(imagesDir, novoNomeArquivo)

    sourceFile.copy(destinationFile)

    console.log(destinationFile.uri)
      
    //   await FileSystem.copyAsync({
    //     from: foto.uri,
    //     to: caminhoPermanente
    //   });
        //   const a = await FileSystem.Directory.pickDirectoryAsync(foto.uri)
        // // 2. Copie diretamente a partir da URI da foto antiga
        // await arquivoDestino.copySync(a);

        // // 3. Se precisar da URI final para salvar no banco de dados (ex: FotosPermanentes)
        // const caminhoPermanente = arquivoDestino.uri;



      fotosPermanentes.push({
        id: foto.id,
        uri: destinationFile.uri,
        ehPrimaria: foto.ehPrimaria
      });
    }

    const novoItem: ItemImagem = {
      id: idItem,
      titulo: titulo.trim(),
      fotos: fotosPermanentes,
      criadoEm: Date.now()
    };

    listaAtual.push(novoItem);
    await AsyncStorage.setItem(chave, JSON.stringify(listaAtual));
    return idItem;
  },

  // 3. DELETE: Remove do banco e apaga os arquivos físicos do celular para liberar espaço
  async deletar(categoria: string, id: string): Promise<ItemImagem[]> {
    const chave = obterChaveCategoria(categoria);
    const listaAtual = await this.listar(categoria);
    
    const itemParaRemover = listaAtual.find(item => item.id === id);
    
    if (itemParaRemover) {
      // Deleta os arquivos físicos de imagem do aparelho
      for (const foto of itemParaRemover.fotos) {
        try {
            new FileSystem.File(foto.uri).delete
        } catch (e) {
          console.log("Erro ao apagar arquivo físico");
        }
      }
    }

    const listaFiltrada = listaAtual.filter(item => item.id !== id);
    await AsyncStorage.setItem(chave, JSON.stringify(listaFiltrada));
    return listaFiltrada;
  },
async deletarFoto(
  categoria: string,
  id: string,
  uri: string
): Promise<ItemImagem[]> {

  const chave = obterChaveCategoria(categoria);
  const listaAtual = await this.listar(categoria);

  const listaAtualizada = listaAtual.map(item => {

    if (item.id !== id) return item;

    // Se só tem 1 foto → remove o item inteiro
    if (item.fotos.length === 1) {
        this.deletar(categoria, id)
      return null;
    }

    const fotosRestantes = item.fotos.filter(foto => foto.uri !== uri);

    // Se a removida era principal → define nova principal
    const eraPrimaria = item.fotos.find(f => f.uri === uri)?.ehPrimaria;

    let fotosAtualizadas = fotosRestantes;

    if (eraPrimaria && fotosRestantes.length > 0) {
      fotosAtualizadas = fotosRestantes.map((foto, index) => ({
        ...foto,
        ehPrimaria: index === 0,
      }));
    }

    return {
      ...item,
      fotos: fotosAtualizadas,
    };
  }).filter(Boolean) as ItemImagem[];

  // deletar arquivo físico
  const fotoParaRemover = listaAtual
    .flatMap(i => i.fotos)
    .find(f => f.uri === uri);

  if (fotoParaRemover) {
    await new FileSystem.File(fotoParaRemover.uri).delete();
  }

  await AsyncStorage.setItem(chave, JSON.stringify(listaAtualizada));

  return listaAtualizada;
}
    // async deletarFoto(categoria: string, id: string, uri: string): Promise<ItemImagem[]> {
    //     const chave = obterChaveCategoria(categoria);
    //     const listaAtual = await this.listar(categoria);
        
    //     const itemParaRemover = listaAtual.find(item => item.id === id);

    //     if (itemParaRemover?.fotos.length == 1){
    //         await this.deletar(categoria, id)
    //         const listaFiltrada = listaAtual.filter(item => item.id !== id);
    //         await AsyncStorage.setItem(chave, JSON.stringify(listaFiltrada));
    //         return listaFiltrada;
    //     }

    //     if (itemParaRemover) {
    //         // Deleta os arquivos físicos de imagem do aparelho
    //         const fotoParaRemover = itemParaRemover.fotos.find(item => (item.id === id))
    //         if (fotoParaRemover){
    //             if (fotoParaRemover.ehPrimaria){
    //                 const novaPrincipal = itemParaRemover.fotos.find(item => !(item.id === id))
    //                 itemParaRemover.fotos = itemParaRemover.fotos.map(foto =>({
    //                     ...foto,
    //                     ehPrimaria: foto.id === novaPrincipal?.id
    //                 }))
    //             }
    //             new FileSystem.File(fotoParaRemover.uri).delete
                
    //         }
    //     }

    //     const listaFiltrada = listaAtual.filter(item => item.id !== id);
    //     await AsyncStorage.setItem(chave, JSON.stringify(listaFiltrada));
    //     return listaFiltrada;
    // }

};
