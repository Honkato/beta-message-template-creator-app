import { useRouter } from 'expo-router';
import { Text, View, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
    const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        {/* Vai direto para app/(presets)/criar.tsx */}
        <Button title="Novo Preset" onPress={() => router.push('/criar')} />
        
        <View style={{ marginVertical: 10 }} />
        
        {/* Vai direto para app/(categorias)/lista.tsx */}
        <Button title="Ver Categorias" onPress={() => router.push('/lista')} />
      </View>
    </SafeAreaView>
  );
}