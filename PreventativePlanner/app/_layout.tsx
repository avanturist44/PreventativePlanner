import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Linking from 'expo-linking'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/use-color-scheme'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabaseClient'
import AuthPage from './AuthPage'

export const unstable_settings = {
  anchor: '(tabs)',
}

async function handleDeepLink(url: string) {
  const { queryParams } = Linking.parse(url)
  const token_hash = queryParams?.token_hash as string | undefined
  const type = queryParams?.type as string | undefined
  if (token_hash && type) {
    await supabase.auth.verifyOtp({ token_hash, type: type as any })
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const { user, loading } = useAuth()

  useEffect(() => {
    // App opened from a cold start via deep link
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url) })
    // App already open when link is clicked
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url))
    return () => sub.remove()
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!user) return <AuthPage />

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}