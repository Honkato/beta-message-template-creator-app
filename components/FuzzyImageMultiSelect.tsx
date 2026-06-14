import React, { useState, useMemo, useRef } from 'react';
import { 
  StyleSheet, Text, TextInput, View, FlatList, TouchableOpacity, ScrollView, Alert, Modal, Image 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Fuse from 'fuse.js';
import { FotoMidia, ItemImagem } from '../services/storage/image/types';
import { imageStorageService } from '../services/storage/image/service/imageStorageService';

interface FuzzyImageMultiSelectProps {
  categoria: string;
  dados: ItemImagem[];
  itensSelecionados: ItemImagem[];
  onSelecionarItens: (itens: ItemImagem[]) => void;
  onItemAdicionado: () => void;
}

export default function FuzzyImageMultiSelect({ 
  categoria, dados, itensSelecionados, onSelecionarItens, onItemAdicionado 
}: FuzzyImageMultiSelectProps) {
  const [busca, setBusca] = useState('');
  const [estaFocado, setEstaFocado] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Estados do fluxo de criação interna do Modal
  const [novoTitulo, setNovoTitulo] = useState('');
  const [fotosTemporarias, setFotosTemporarias] = useState<FotoMidia[]>([]);

  // 1. CONFIGURAÇÃO FUZZY SEARCH (POR TÍTULO)
  const buscadorFuse = useMemo(() => {
    return new Fuse(dados, { keys: ['titulo'], threshold: 0.4 });
  }, [dados]);

  const resultadosFiltrados = useMemo(() => {
    if (busca.trim() === '') {
      return dados.filter(item => !itensSelecionados.some(sel => sel.id === item.id));
    }
    return buscadorFuse.search(busca)
      .map(res => res.item)
      .filter(item => !itensSelecionados.some(sel => sel.id === item.id));
  }, [busca, dados, itensSelecionados, buscadorFuse]);

  // 2. FLUXO IMAGE PICKER (SELEÇÃO DE FOTOS)
  async function abrirGaleria() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true, // Permite selecionar várias de uma vez
      quality: 0.8,
    });

    if (!resultado.canceled && resultado.assets) {
      const novasFotos: FotoMidia[] = resultado.assets.map((asset, index) => ({
        id: Math.random().toString(),
        uri: asset.uri,
        // Regra pedida: Se a lista estiver vazia, a primeira selecionada vira primária automaticamente
        ehPrimaria: fotosTemporarias.length === 0 && index === 0, 
      }));

      setFotosTemporarias([...fotosTemporarias, ...novasFotos]);
    }
  }

  // Define manualmente qual imagem é a principal na pré-visualização
  function definirComoPrimaria(id: string) {
    const atualizadas = fotosTemporarias.map(foto => ({
      ...foto,
      ehPrimaria: foto.id === id
    }));
    setFotosTemporarias(atualizadas);
  }

  // Salva no Storage e limpa os estados do Modal
  async function confirmarSalvarMidia() {
    if (novoTitulo.trim() === '' || fotosTemporarias.length === 0) {
      Alert.alert('Aviso', 'Preencha o título e adicione pelo menos uma imagem.');
      return;
    }

    try {
      const novoId = await imageStorageService.adicionar(categoria, novoTitulo, fotosTemporarias);
      
      const itemCompleto: ItemImagem = {
        id: novoId,
        titulo: novoTitulo,
        fotos: fotosTemporarias, // Passa a referência para inclusão imediata no chip
        criadoEm: Date.now()
      };

      onSelecionarItens([...itensSelecionados, itemCompleto]);
      setModalAberto(false);
      setBusca('');
      setNovoTitulo('');
      setFotosTemporarias([]);
      onItemAdicionado();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o grupo de mídias.');
    }
  }

  function abrirFluxoCriacao() {
    setNovoTitulo(busca);
    setFotosTemporarias([]);
    setModalAberto(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Buscar e Selecionar Imagens:</Text>

      {/* CAIXA DE TEXTO COM OS CHIPS E A IMAGEM PRIMÁRIA DENTRO */}
      <TouchableOpacity 
        activeOpacity={1} 
        style={[styles.caixaInput, estaFocado && styles.caixaInputFocada]}
        onPress={() => inputRef.current?.focus()}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.containerChips}>
          {itensSelecionados.map(item => {
            // Regra: Encontra apenas a imagem marcada como primária para exibir no display do chip
            const fotoCapa = item.fotos.find(f => f.ehPrimaria) || item.fotos[0];
            return (
              <View key={item.id} style={styles.chip}>
                {fotoCapa && <Image source={{ uri: fotoCapa.uri }} style={styles.miniImagemCapa} />}
                <Text numberOfLines={1} style={styles.textoChip}>{item.titulo}</Text>
                <TouchableOpacity onPress={() => onSelecionarItens(itensSelecionados.filter(i => i.id !== item.id))} style={styles.botaoFecharChip}>
                  <Text style={styles.textoFecharChip}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <TextInput
            ref={inputRef}
            style={styles.inputReal}
            placeholder={itensSelecionados.length === 0 ? "Pesquise mídias por título..." : ""}
            placeholderTextColor="#8E8E93"
            value={busca}
            onChangeText={setBusca}
            onFocus={() => setEstaFocado(true)}
            onBlur={() => setTimeout(() => setEstaFocado(false), 250)}
          />
        </ScrollView>
      </TouchableOpacity>

      {/* DROPDOWN DE SUGESTÕES OU CRIAR */}
      {estaFocado && busca.trim().length > 0 && (
        <View style={styles.containerSugestoes}>
          <TouchableOpacity style={styles.botaoCriarNovo} onPress={abrirFluxoCriacao}>
            <Text style={styles.textoBotaoCriar}>➕ Criar Mídia: "{busca}"</Text>
          </TouchableOpacity>

          {resultadosFiltrados.length > 0 && (
            <FlatList
              data={resultadosFiltrados}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.itemSugestao} onPress={() => { onSelecionarItens([...itensSelecionados, item]); setBusca(''); }}>
                  <Text numberOfLines={1} style={styles.textoSugestao}>📁 {item.titulo}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* MODAL AVANÇADO DE CRIAÇÃO E CONFIGURAÇÃO DA IMAGEM PRINCIPAL */}
      <Modal visible={modalAberto} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitulo}>Configurar Novo Grupo de Imagens</Text>
          
          <TextInput 
            style={styles.modalInput} 
            placeholder="Título identificador da mídia"
            value={novoTitulo}
            onChangeText={setNovoTitulo}
          />

          <TouchableOpacity style={styles.botaoGaleria} onPress={abrirGaleria}>
            <Text style={styles.textoBotaoGaleria}>📸 Selecionar Fotos da Galeria</Text>
          </TouchableOpacity>

          <Text style={styles.modalSubtitulo}>Clique na foto para definí-la como Principal (Capa):</Text>
          
          <ScrollView contentContainerStyle={styles.gradeFotos}>
            {fotosTemporarias.map(foto => (
              <TouchableOpacity 
                key={foto.id} 
                style={[styles.wrapperFotoGrade, foto.ehPrimaria && styles.fotoGradePrimaria]}
                onPress={() => definirComoPrimaria(foto.id)}
              >
                <Image source={{ uri: foto.uri }} style={styles.fotoGrade} />
                {foto.ehPrimaria && <View style={styles.badgePrimaria}><Text style={styles.textoBadge}>PRINCIPAL</Text></View>}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.containerBotoesModal}>
            <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalAberto(false)}>
              <Text style={styles.txtBtn}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnConfirmar} onPress={confirmarSalvarMidia}>
              <Text style={styles.txtBtn}>Confirmar e Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10, zIndex: 90 },
  label: { fontSize: 14, fontWeight: '600', color: '#3A3A3C', marginBottom: 6 },
  caixaInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 10, minHeight: 55, justifyContent: 'center' },
  caixaInputFocada: { borderColor: '#007AFF' },
  containerChips: { alignItems: 'center', flexDirection: 'row' },
  chip: { backgroundColor: '#E5E5EA', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingLeft: 6, paddingRight: 8, paddingVertical: 6, marginRight: 6, maxWidth: 180 },
  miniImagemCapa: { width: 24, height: 24, borderRadius: 12, marginRight: 6, backgroundColor: '#CCC' },
  textoChip: { fontSize: 14, color: '#1C1C1E', flexShrink: 1, marginRight: 4 },
  botaoFecharChip: { backgroundColor: '#8E8E93', borderRadius: 10, width: 16, height: 16, alignItems: 'center', /*justifyWith: 'center',*/ justifyContent: 'center' },
  textoFecharChip: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginTop: -2 },
  inputReal: { flex: 1, minWidth: 140, fontSize: 15, color: '#1C1C1E', height: '100%' },
  containerSugestoes: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, marginTop: 4, maxHeight: 200, elevation: 3, overflow: 'hidden' },
  itemSugestao: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  textoSugestao: { fontSize: 15, color: '#3A3A3C' },
  botaoCriarNovo: { padding: 14, backgroundColor: '#EAF2FF', borderBottomWidth: 1, borderColor: '#BCD5FF' },textoBotaoCriar: { fontSize: 15, color: '#007AFF', fontWeight: 'bold' },
  // MODAL STYLES
  modalContainer: { flex: 1, padding: 24, backgroundColor: '#F5F7FA', paddingTop: 50 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1C1C1E', textAlign: 'center' },
   modalSubtitulo: { fontSize: 14, color: '#8E8E93', marginBottom: 12, marginTop: 15, fontWeight: '500' },
   modalInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 15 },
   botaoGaleria:{ backgroundColor: '#007AFF', padding: 14, borderRadius: 10, alignItems: 'center' },
   textoBotaoGaleria:{ color: '#FFF', fontWeight: 'bold', fontSize: 15 },
   gradeFotos:{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingVertical: 10 },
   wrapperFotoGrade:{ width: '30%', aspectRatio: 1, margin: '1.5%', borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', position: 'relative' },
   fotoGradePrimaria:{ borderColor: '#34C759' },
   fotoGrade:{ width: '100%', height: '100%' },
   badgePrimaria:{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#34C759', paddingVertical: 2, alignItems: 'center' },
   textoBadge:{ color: '#FFF', fontSize: 9, fontWeight: 'bold' },
   containerBotoesModal:{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingBottom: 20 },
   btnCancelar:{ backgroundColor: '#FF3B30', padding: 16, borderRadius: 10, width: '47%', alignItems: 'center' },
   btnConfirmar:{ backgroundColor: '#34C759', padding: 16, borderRadius: 10, width: '47%', alignItems: 'center' },
   txtBtn:{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }});