'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Wrench, Mail, Lock, Loader2, ArrowLeft, ShieldCheck, Clock, Users, ArrowRightLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Enviamos as instruções de recuperação para o seu e-mail. Por favor, verifique sua caixa de entrada e a pasta de spam.');
        setIsForgotPassword(false);
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email ou senha inválidos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else {
        setError('Ocorreu um erro ao tentar autenticar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-1 bg-white">
      {/* Left Pane - Features Showcase */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-slate-950 overflow-hidden flex-col justify-between p-12 xl:p-20 text-white">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-amber-500/10 blur-[120px]" />
          <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-emerald-500/5 blur-[80px]" />
        </div>

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-16"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20">
              <Wrench className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Stockly</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl xl:text-6xl font-semibold leading-[1.1] tracking-tight mb-6"
          >
            O controle total do seu <span className="text-amber-500">inventário</span> em um só lugar.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-400 mb-16 max-w-lg leading-relaxed"
          >
            Gerencie ferramentas, acompanhe retiradas e devoluções, e mantenha o histórico completo da sua equipe com segurança e eficiência.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
            {[
              { icon: ArrowRightLeft, title: 'Retiradas e Devoluções', desc: 'Registre movimentações em segundos com rastreamento de ID.' },
              { icon: Users, title: 'Gestão de Equipe', desc: 'Controle quem está com qual equipamento e suas competências.' },
              { icon: Clock, title: 'Histórico Completo', desc: 'Auditoria detalhada de todas as ações realizadas no sistema.' },
              { icon: ShieldCheck, title: 'Segurança e Permissões', desc: 'Acesso baseado em funções para proteger seus dados.' },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                className="flex flex-col gap-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800/50 border border-slate-700/50 text-amber-500">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-200 text-lg">{feature.title}</h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="relative z-10 mt-20 text-sm text-slate-500"
        >
          &copy; {new Date().getFullYear()} Stockly. Todos os direitos reservados.
        </motion.div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="flex w-full lg:w-[45%] flex-col items-center justify-center bg-white px-6 sm:px-12 lg:px-16 relative">
        {/* Mobile Header (only visible on small screens) */}
        <div className="absolute top-8 left-6 sm:left-12 flex lg:hidden items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-slate-900">
            <Wrench className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Stockly</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
              {isForgotPassword ? 'Recuperar Senha' : isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}
            </h2>
            <p className="text-slate-500">
              {isForgotPassword
                ? 'Digite seu email para receber um link de recuperação de senha.'
                : isLogin 
                  ? 'Faça login para acessar o sistema de gerenciamento.' 
                  : 'Preencha os dados abaixo para criar sua conta.'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-start gap-3"
            >
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
          
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-600 border border-emerald-100 flex items-start gap-3"
            >
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 py-2.5 pl-11 pr-4 text-sm placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Senha</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-sm font-medium text-amber-600 hover:text-amber-500 focus:outline-none transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2.5 pl-11 pr-4 text-sm placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:opacity-70 transition-all"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              {isForgotPassword ? 'Enviar Link de Recuperação' : isLogin ? 'Entrar na Plataforma' : 'Criar Minha Conta'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {isForgotPassword ? (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccessMsg('');
                }}
                className="inline-flex items-center justify-center font-medium text-slate-600 hover:text-slate-900 focus:outline-none transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o login
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <span>{isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}</span>
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="font-medium text-amber-600 hover:text-amber-500 focus:outline-none transition-colors"
                >
                  {isLogin ? 'Cadastre-se agora' : 'Faça login'}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Credits */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 text-xs text-slate-400 text-right max-w-[250px] sm:max-w-none">
          Desenvolvido por Victor Hugo, Fabrício, Daniel e Pedro Henrique
        </div>
      </div>
    </div>
  );
}
