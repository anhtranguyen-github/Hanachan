
'use client'

import { useState } from 'react'
import { login, signup } from '../actions'
import { toast } from 'sonner'

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = isLogin ? await login(formData) : await signup(formData)

        if (result?.error) {
            toast.error(result.error)
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md p-8 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                    {isLogin ? 'Chào mừng trở lại' : 'Bắt đầu hành trình'}
                </h1>
                <p className="text-zinc-400 mt-2">
                    {isLogin ? 'Đăng nhập để tiếp tục học tập' : 'Tạo tài khoản Hanachan mới'}
                </p>
            </div>

            <form action={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">
                            Tên hiển thị
                        </label>
                        <input
                            name="display_name"
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-zinc-100"
                            placeholder="Sakura Chan"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">
                        Email
                    </label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-zinc-100"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">
                        Mật khẩu
                    </label>
                    <input
                        name="password"
                        type="password"
                        required
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-zinc-100"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký ngay')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-zinc-400 hover:text-pink-400 transition-colors"
                >
                    {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
                </button>
            </div>
        </div>
    )
}
