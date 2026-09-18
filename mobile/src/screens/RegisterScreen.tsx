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

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha todos os campos.')
      return
    }
    setLoading(true)
    try {
      await register(name.trim(), email.trim(), password)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Comece a organizar suas tarefas</Text>
      </View>

      {error ? (
        <View testID="register-error" style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TextField label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" testID="register-name" />
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        testID="register-email"
      />
      <TextField
        label="Senha"
        value={password}
        onChangeText={setPassword}
        placeholder="Mínimo 6 caracteres"
        secure
        hint="Mínimo 6 caracteres"
        testID="register-password"
      />

      <Button
        label={loading ? 'Criando…' : 'Criar conta'}
        onPress={handleSubmit}
        loading={loading}
        block
        testID="register-submit"
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Já tem conta? </Text>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Entrar</Text>
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
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
