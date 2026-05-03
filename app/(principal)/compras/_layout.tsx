import { Stack } from 'expo-router';

export default function ComprasLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="planejamentos"
        options={{
          headerShown: false,
          title: 'Compras',
        }}
      />
      <Stack.Screen
        name="planejamento"
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
        name="historico-precos"
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
