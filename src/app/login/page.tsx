
import AuthForm from '@/modules/auth/components/AuthForm'

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full" />

            <div className="relative z-10 w-full flex justify-center p-4">
                <AuthForm />
            </div>
        </div>
    )
}
