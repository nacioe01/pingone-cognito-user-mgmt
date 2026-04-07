import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { exchangeCodeForTokens, getLogoutUrl } from '@/lib/auth'
import { CheckCircle2, XCircle, Loader2, LogOut, ArrowLeft, User } from 'lucide-react'

type AuthStatus = 'loading' | 'success' | 'error'

interface AuthResult {
  status: AuthStatus
  user?: {
    email?: string
    name?: string
    sub?: string
  }
  error?: string
}

export function CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [result, setResult] = useState<AuthResult>({ status: 'loading' })

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      setResult({
        status: 'error',
        error: errorDescription || error || 'Authentication failed',
      })
      return
    }

    if (!code) {
      setResult({
        status: 'error',
        error: 'No authorization code received',
      })
      return
    }

    // Exchange code for tokens
    exchangeCodeForTokens(code).then((response) => {
      if (response.success) {
        setResult({
          status: 'success',
          user: response.user,
        })
      } else {
        setResult({
          status: 'error',
          error: response.error || 'Failed to authenticate',
        })
      }
    })
  }, [searchParams])

  const handleLogout = () => {
    window.location.href = getLogoutUrl()
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          {result.status === 'loading' && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                </div>
                <CardTitle className="text-xl text-white">Authenticating...</CardTitle>
                <CardDescription className="text-slate-400">
                  Please wait while we verify your credentials
                </CardDescription>
              </CardHeader>
            </>
          )}

          {result.status === 'success' && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white">Authentication Successful!</CardTitle>
                <CardDescription className="text-slate-400">
                  You have been successfully authenticated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Info */}
                {result.user && (
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {result.user.name || result.user.email || 'User'}
                        </p>
                        {result.user.email && (
                          <p className="text-xs text-slate-400">{result.user.email}</p>
                        )}
                      </div>
                    </div>
                    {result.user.sub && (
                      <div className="text-xs text-slate-500 font-mono truncate">
                        ID: {result.user.sub}
                      </div>
                    )}
                  </div>
                )}

                {/* Success Badge */}
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    SSO Login Verified
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="flex-1"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {result.status === 'error' && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
                <CardTitle className="text-xl text-white">Authentication Failed</CardTitle>
                <CardDescription className="text-slate-400">
                  We couldn't verify your credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error Details */}
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300">{result.error}</p>
                </div>

                {/* Failure Badge */}
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    <XCircle className="w-4 h-4 mr-2" />
                    SSO Login Failed
                  </span>
                </div>

                {/* Actions */}
                <Button
                  onClick={handleBack}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
