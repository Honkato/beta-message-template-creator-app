import React, { useState, useMemo, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import Fuse from 'fuse.js';
import { ItemTexto } from '../services/storage/text/types';
import { textStorageService } from '../services/storage/text/service/textStorageService';

interface FuzzyMultiSelectProps {
  categoria: string;
  dados: ItemTexto[];
  itensSelecionados: ItemTexto[];
  onSelecionarItens: (itens: ItemTexto[]) => void;
  onItemAdicionado: () => void;
}

export default function FuzzyMultiSelect({ 
  categoria,
  dados, 
  itensSelecionados, 
  onSelecionarItens,
  onItemAdicionado
}: FuzzyMultiSelectProps) {
  const [busca, setBusca] = useState('');
  const [estaFocado, setEstaFocado] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // CONFIGURAÇÃO DO FUZZY SEARCH
  const buscadorFuse = useMemo(() => {
    return new Fuse(dados, {
      keys: ['conteudo'],
      threshold: 0.4,
    });
  }, [dados]);

  // FILTRAGEM DOS RESULTADOS
  const resultadosFiltrados = useMemo(() => {
    if (busca.trim() === '') {
      return dados.filter(item => !itensSelecionados.some(sel => sel.id === item.id));
    }
    const resultadosFuzzy = buscadorFuse.search(busca);
    return resultadosFuzzy
      .map(resultado => resultado.item)
      .filter(item => !itensSelecionados.some(sel => sel.id === item.id));
  }, [busca, dados, itensSelecionados, buscadorFuse]);

  // SELECIONAR ITEM EXISTENTE
  function adicionarItemExistente(item: ItemTexto) {
    onSelecionarItens([...itensSelecionados, item]);
    setBusca('');
  }

  // CRIAR E SALVAR UM NOVO ITEM DIRETO NO STORAGE
  async function criarENovoItem() {
    const textoParaSalvar = busca.trim();
    if (textoParaSalvar === '') return;

    // Evita duplicados idênticos na mesma categoria
    const jáExiste = dados.some(item => item.conteudo.toLowerCase() === textoParaSalvar.toLowerCase());
    if (jáExiste) {
      Alert.alert('Aviso', 'Este item já existe na sua lista de sugestões.');
      return;
    }

    try {
      const novoId = await textStorageService.adicionar(categoria, textoParaSalvar);
      
      const novoItem: ItemTexto = {
        id: novoId,
        conteudo: textoParaSalvar,
        criadoEm: Date.now()
      };

      onSelecionarItens([...itensSelecionados, novoItem]);
      setBusca('');
      onItemAdicionado(); 
      
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a nova mensagem.');
    }
  }

  function removerItem(id: string) {
    const novaLista = itensSelecionados.filter(item => item.id !== id);
    onSelecionarItens(novaLista);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Buscar e Selecionar Mensagens:</Text>

      <TouchableOpacity 
        activeOpacity={1} 
        style={[styles.caixaInput, estaFocado && styles.caixaInputFocada]}
        onPress={() => inputRef.current?.focus()}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.containerChips}
        >
          {itensSelecionados.map(item => (
            /* CORREÇÃO DO CHIP: Adicionado flexShrink e row para travar o alinhamento */
            <View key={item.id} style={styles.chip}>
              <Text numberOfLines={1} style={styles.textoChip}>
                {item.conteudo}
              </Text>
              <TouchableOpacity onPress={() => removerItem(item.id)} style={styles.botaoFecharChip}>
                <Text style={styles.textoFecharChip}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TextInput
            ref={inputRef}
            style={styles.inputReal}
            placeholder={itensSelecionados.length === 0 ? "Digite para pesquisar..." : ""}
            placeholderTextColor="#8E8E93"
            value={busca}
            onChangeText={setBusca}
            onFocus={() => setEstaFocado(true)}
            onBlur={() => setTimeout(() => setEstaFocado(false), 250)}
          />
        </ScrollView>
      </TouchableOpacity>

      {/* LISTA SUSPENSA DE SUGESTÕES + BOTÃO SEMPRE VISÍVEL */}
      {estaFocado && busca.trim().length > 0 && (
        <View style={styles.containerSugestoes}>
          
          {/* MELHORIA 2: Botão de criar fixo no topo da lista, sempre à mostra ao digitar */}
          <TouchableOpacity style={styles.botaoCriarNovo} onPress={criarENovoItem}>
            <Text style={styles.textoBotaoCriar} numberOfLines={1}>
              ➕ Criar novo: "{busca}"
            </Text>
          </TouchableOpacity>

          {resultadosFiltrados.length > 0 && (
            <FlatList
              data={resultadosFiltrados}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.listaScroll}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.itemSugestao} 
                  onPress={() => adicionarItemExistente(item)}
                >
                  <Text numberOfLines={2} style={styles.textoSugestao}>{item.conteudo}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    zIndex: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 6,
  },
  caixaInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  caixaInputFocada: {
    borderColor: '#007AFF',
  },
  containerChips: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#E5E5EA',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    marginRight: 6,
    maxWidth: 160, // Limita o tamanho máximo para caber na barra horizontal
  },
  textoChip: {
    fontSize: 14,
    color: '#1C1C1E',
    flexShrink: 1, // CORREÇÃO 1: Faz o texto encolher e colocar "..." se estourar o espaço
    marginRight: 4, // Dá um espaço fixo entre o final do texto e o botão X
  },
  botaoFecharChip: {
    backgroundColor: '#8E8E93',
    borderRadius: 10,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoFecharChip: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: -2,
  },
  inputReal: {
    flex: 1,
    minWidth: 140,
    fontSize: 15,
    color: '#1C1C1E',
    height: '100%',
  },
  containerSugestoes: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 230, // Aumentado um pouco para acomodar o botão e a lista juntos
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  listaScroll: {
    maxHeight: 160, // Limita apenas a parte das sugestões para rolar internamente
  },
  itemSugestao: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  textoSugestao: {
    fontSize: 15,
    color: '#3A3A3C',
  },
  botaoCriarNovo: {
    padding: 14,
    backgroundColor: '#EAF2FF', // Tom azulado suave para destacar a ação de criação
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#BCD5FF',
  },
  textoBotaoCriar: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
