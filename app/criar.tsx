import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { textStorageService } from '../services/storage/text/service/textStorageService';
import { ItemTexto } from '../services/storage/text/types';
import FuzzyMultiSelect from '../components/FuzzyMultiSelect';
import FuzzyImageMultiSelect from '../components/FuzzyImageMultiSelect';
import { ItemImagem } from '../services/storage/image/types';
import { imageStorageService } from '../services/storage/image/service/imageStorageService';

export default function Home() {
const router = useRouter();
  
  // Estados para controlar o input e o texto que foi salvo
  const [categoryInput, setCategoryInput] = useState('');
  const [categorySaved, setCategorySaved] = useState<ItemTexto[]>([]);


  const [image, setImage] = useState<ItemImagem[]>([]);
  const [imageSalvo, setImageSalvo] = useState<ItemImagem[]>([]);

  const [categorySelected, setCategorySelected] = useState<ItemTexto[]>([]);

  // CHAVE ÚNICA: Usada para identificar nosso dado no armazenamento do celular
  const CHAVE_STORAGE = '@meu_app_mensagem_texto';

  const CATEGORY = 'category'
  const CHAVE_IMAGE = 'teste'

  // 1. CARREGAR O TEXTO (Roda automaticamente assim que a página abre)
      async function carregarTextoDoCelular() {
      try {
        const dadoBruto = await textStorageService.listar(CATEGORY);
        if (dadoBruto !== null) {
          setCategorySaved(dadoBruto);
        }
      } catch (erro) {
        Alert.alert('Erro', 'Não foi possível carregar o texto salvo.');
      }
    }

          async function carregarImageDoCelular() {
      try {
        const dadoBruto = await imageStorageService.listar(CHAVE_IMAGE);
        if (dadoBruto !== null) {
          setImageSalvo(dadoBruto);
        }
      } catch (erro) {
        Alert.alert('Erro', 'Não foi possível carregar o texto salvo.');
      }
    }

  useEffect(() => {

    carregarTextoDoCelular();
    carregarImageDoCelular()
  }, []);

  // 2. SALVAR O TEXTO
  async function lidarComSalvar() {
    if (categoryInput.trim() === '') {
      Alert.alert('Aviso', 'Por favor, digite algum texto antes de salvar.');
      return;
    }

    try {
      await textStorageService.adicionar(CATEGORY, categoryInput)
      // Salva o texto bruto diretamente no armazenamento local
      
      // Atualiza o estado da tela para mostrar o novo texto imediatamente
      setCategorySaved(await textStorageService.listar(CATEGORY));
      setCategoryInput(''); // Limpa o campo de digitação
      Keyboard.dismiss(); // Fecha o teclado do celular
      
      Alert.alert('Sucesso!', 'Seu modelo de texto foi guardado localmente.');
    } catch (erro) {
      Alert.alert('Erro', 'Houve uma falha ao salvar o texto.');
    }
  }
  return (
     <SafeAreaView style={styles.container}>
      {/* Cabeçalho simples com botão de voltar */}
        <FuzzyMultiSelect categoria={CATEGORY} dados={categorySaved} itensSelecionados={categorySelected} onSelecionarItens={setCategorySelected} onItemAdicionado={carregarTextoDoCelular}></FuzzyMultiSelect>
        <FuzzyImageMultiSelect categoria={CHAVE_IMAGE} dados={imageSalvo} itensSelecionados={image} onSelecionarItens={setImage} onItemAdicionado={carregarImageDoCelular}></FuzzyImageMultiSelect>
      <View style={styles.header}>      

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.botaoVoltar}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.tituloTela}>Criar Texto</Text>
      </View>

      {/* Bloco que exibe o que está guardado atualmente no celular */}
      <View style={styles.cardVisualizacao}>
        <Text style={styles.label}>Texto salvo atualmente:</Text>
        <Text style={styles.textoExibido}>{categorySaved.map(a=>a.conteudo).toString()}</Text>
      </View>

      {/* Campo de entrada para digitar o novo preset */}
      <TextInput
        style={styles.input}
        placeholder="Digite ou cole o seu modelo de mensagem aqui..."
        placeholderTextColor="#888"
        multiline={true} // Permite quebra de linhas (parágrafos)
        numberOfLines={4}
        value={categoryInput}
        onChangeText={setCategoryInput}
      />

      {/* Botão estilizado para disparar a função de salvar */}
      <TouchableOpacity style={styles.botaoSalvar} onPress={lidarComSalvar}>
        <Text style={styles.textoBotaoSalvar}>Salvar Mensagem</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  botaoVoltar: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 15,
  },
  tituloTela: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  cardVisualizacao: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  textoExibido: {
    fontSize: 16,
    color: '#3A3A3C',
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#3A3A3C',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    textAlignVertical: 'top', // Garante que no Android o texto comece no topo do input
    minHeight: 120,
    marginBottom: 20,
  },
  botaoSalvar: {
    backgroundColor: '#34C759', // Verde iOS padrão para sucesso/salvamento
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoSalvar: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
