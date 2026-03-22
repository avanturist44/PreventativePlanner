import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { supabase } from '../supabaseClient'

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<{ text: string; type: string }>({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

  const showMsg = (text: string, type: string) => setMessage({ text, type })

  async function handleLogin() {
    if (!email || !password) { showMsg('Please fill in all fields.', 'error'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) showMsg(error.message, 'error')
    // On success, useAuth in _layout.tsx detects the session and unmounts this page automatically
    setLoading(false)
  }

  async function handleRegister() {
    if (!email || !password) { showMsg('Please fill in all fields.', 'error'); return }
    if (password.length < 6) { showMsg('Password must be at least 6 characters.', 'error'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      showMsg(error.message, 'error')
    } else {
      showMsg('Check your email to confirm your account.', 'success')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'login' && styles.tabActive]}
            onPress={() => { setTab('login'); showMsg('', '') }}
          >
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'register' && styles.tabActive]}
            onPress={() => { setTab('register'); showMsg('', '') }}
          >
            <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Min. 6 characters"
          secureTextEntry
          placeholderTextColor="#999"
        />

        {/* Message */}
        {message.text ? (
          <Text style={message.type === 'error' ? styles.msgError : styles.msgSuccess}>
            {message.text}
          </Text>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={styles.btn}
          onPress={tab === 'login' ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{tab === 'login' ? 'Sign in' : 'Create account'}</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#f0f0f0',
  },
  tabText: {
    fontSize: 13,
    color: '#888',
  },
  tabTextActive: {
    color: '#111',
    fontWeight: '500',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 5,
    marginTop: 4,
  },
  input: {
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111',
    marginBottom: 14,
    backgroundColor: '#fafafa',
  },
  btn: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  msgError: {
    fontSize: 12,
    color: '#c0392b',
    backgroundColor: '#fdecea',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  msgSuccess: {
    fontSize: 12,
    color: '#1a7a4a',
    backgroundColor: '#e6f4ed',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
})