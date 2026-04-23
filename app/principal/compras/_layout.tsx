import { Stack } from 'expo-router';

export default function ComprasLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Compras',
        }}
      />
      <Stack.Screen
        name="lista"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="desejos"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="historico-itens"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="documentacao"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
