import { View, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: insets.bottom + 20,
      }}
    >
      <View style={{ flex: 1 }} />
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
        <TextInput
        placeholder="Input no final"
        style={{
          borderWidth: 1,
          padding: 12,
          margin: 16,
        }}
      />
      </View>
    </KeyboardAvoidingView>

      
    </View>
  );
}