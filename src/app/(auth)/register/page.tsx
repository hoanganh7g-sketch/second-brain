'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/notes` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-700">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-2xl bg-green-600/20 border border-green-500/30">
                <Brain className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white">Kiểm tra email của bạn!</h2>
            <p className="text-slate-400 text-sm">
              Chúng tôi đã gửi link xác nhận đến <strong className="text-white">{email}</strong>.
              Nhấn vào link để kích hoạt tài khoản.
            </p>
            <Link href="/login">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white w-full mt-2">
                Về trang đăng nhập
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
              <Brain className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Tạo tài khoản</CardTitle>
          <CardDescription className="text-slate-400">
            Bắt đầu xây dựng bộ não thứ hai của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-4">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
