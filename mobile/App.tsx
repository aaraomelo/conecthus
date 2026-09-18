import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthProvider } from './src/auth/AuthContext'
import { useAuth } from './src/auth/auth-context'
import { LoginScreen } from './src/screens/LoginScreen'
import { RegisterScreen } from './src/screens/RegisterScreen'
import { TasksScreen } from './src/screens/TasksScreen'
import { TaskFormScreen } from './src/screens/TaskFormScreen'
import { TaskDetailScreen } from './src/screens/TaskDetailScreen'
import type { RootStackParamList } from './src/navigation/types'
import { colors } from './src/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

function RootNavigator() {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: 'Minhas tarefas' }} />
          <Stack.Screen
            name="TaskForm"
            component={TaskFormScreen}
            options={({ route }) => ({
              title: route.params?.taskId ? 'Editar tarefa' : 'Nova tarefa',
              presentation: 'modal',
            })}
          />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Detalhes' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar conta' }} />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
