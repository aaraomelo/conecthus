import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../auth/auth-context'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import type { RootStackParamList } from '../navigation/types'
import { colors, spacing } from '../theme'

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Conecthus</Text>
        <Text style={styles.subtitle}>Entre para gerenciar suas tarefas</Text>
      </View>

      {error ? (
        <View testID="login-error" style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        testID="login-email"
      />
      <TextField
        label="Senha"
        value={password}
        onChangeText={setPassword}
        placeholder="Sua senha"
        secure
        testID="login-password"
      />

      <Button
        label={loading ? 'Entrando…' : 'Entrar'}
        onPress={handleSubmit}
        loading={loading}
        block
        testID="login-submit"
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Não tem conta? </Text>
        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Criar conta</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    backgroundColor: colors.bg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textMuted,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  footer: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  link: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
})
