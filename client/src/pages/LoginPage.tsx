import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getLoginUrl } from '@/lib/auth'
import { LogIn, Shield, Zap } from 'lucide-react'

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = getLoginUrl()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Cognito + Ping SSO</h1>
          <p className="text-slate-400">Secure authentication with enterprise SSO</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-white">Welcome</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in with your Ping Identity credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <span>Single Sign-On with Ping Identity</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10">
                  <Shield className="w-4 h-4 text-green-400" />
                </div>
                <span>Secured by AWS Cognito</span>
              </div>
            </div>

            {/* Login Button */}
            <Button 
              onClick={handleLogin}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200"
              size="lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Ping
            </Button>

            {/* Footer */}
            <p className="text-xs text-center text-slate-500">
              By signing in, you agree to the terms of service and privacy policy.
            </p>
          </CardContent>
        </Card>

        {/* Environment indicator */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
            Development Environment
          </span>
        </div>
      </div>
    </div>
  )
}
