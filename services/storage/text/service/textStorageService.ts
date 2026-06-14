import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemTexto } from '../types';

// Interface que define a estrutura de cada item de texto dentro da lista


const PREFIXO_KEY = 'MTCAPP:texto';

/**
 * Retorna a chave final formatada para o AsyncStorage baseada na categoria escolhida.
 * Exemplo: se a categoria for "vendas", retorna "MTCAPP:texto/vendas"
 */
function obterChaveCategoria(categoria: string): string {
  // Converte para minúsculas e remove espaços para evitar erros de digitação de chaves
  const categoriaFormatada = categoria.trim().toLowerCase();
  return `${PREFIXO_KEY}/${categoriaFormatada}`;
}

export const textStorageService = {
  
  // 1. CREATE (Adicionar uma nova mensagem na lista daquela categoria)
  async adicionar(categoria: string, novoTexto: string): Promise<string> {
    const chave = obterChaveCategoria(categoria);
    const listaAtual = await this.listar(categoria);

    const novoItem: ItemTexto = {
      id: Date.now().toString(), // Gera um ID único baseado no tempo atual
      conteudo: novoTexto.trim(),
      criadoEm: Date.now()
    };

    listaAtual.push(novoItem);
    
    // Salva a lista inteira atualizada de volta no celular
    await AsyncStorage.setItem(chave, JSON.stringify(listaAtual));
    return novoItem.id;
  },

  // 2. READ (Listar todas as mensagens de uma categoria específica)
  async listar(categoria: string): Promise<Array<ItemTexto>> {
    const chave = obterChaveCategoria(categoria);
    const dadosBrutos = await AsyncStorage.getItem(chave);
    
    if (dadosBrutos === null) {
      return []; // Se nunca foi salvo nada nessa categoria, retorna uma lista vazia
    }
    
    return JSON.parse(dadosBrutos) as Array<ItemTexto>;
  },

  // 3. UPDATE (Editar o conteúdo de uma mensagem existente através do ID)
  async editar(categoria: string, id: string, novoConteudo: string): Promise<boolean> {
    const chave = obterChaveCategoria(categoria);
    const listaAtual = await this.listar(categoria);

    // Procura o item correspondente na lista
    const index = listaAtual.findIndex(item => item.id === id);

    if (index === -1) {
      return false; // Item não encontrado na lista
    }

    // Atualiza o texto mantendo o ID e a data de criação originais
    listaAtual[index].conteudo = novoConteudo.trim();

    await AsyncStorage.setItem(chave, JSON.stringify(listaAtual));
    return true;
  },

  // 4. DELETE (Remover uma mensagem da lista através do ID)
  async deletar(categoria: string, id: string): Promise<Array<ItemTexto>> {
    const chave = obterChaveCategoria(categoria);
    const listaAtual = await this.listar(categoria);

    // Filtra a lista mantendo apenas os itens que NÃO possuem o ID informado
    const listaFiltrada = listaAtual.filter(item => item.id !== id);

    await AsyncStorage.setItem(chave, JSON.stringify(listaFiltrada));
    return listaFiltrada; // Retorna a nova lista atualizada
  }
};
