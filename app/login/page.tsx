'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Merci de renseigner votre e-mail et votre mot de passe.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Ce format d\'e-mail ne semble pas valide.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const normalizedEmail = email.trim().toLowerCase();
      console.log('🔍 Attempting login with email:', normalizedEmail);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password,
      });

      if (authError) {
        console.error('❌ Login error:', authError);
        console.error('❌ Error message:', authError.message);
        console.error('❌ Error status:', authError.status);
        console.error('❌ Error name:', authError.name);
        
        // Afficher TOUTE l'erreur pour diagnostic
        setError(`Erreur de connexion : ${authError.message} (Status: ${authError.status || 'N/A'})`);
        setIsLoading(false);
        return;
      }

      if (!authData?.user) {
        console.error('❌ No user returned');
        setError('Aucun utilisateur retourné après connexion.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Login successful!');
      console.log('✅ User ID:', authData.user.id);
      console.log('✅ Email:', authData.user.email);
      console.log('✅ Email confirmed:', authData.user.email_confirmed_at);

      // Vérifier l'onboarding (avec plusieurs tentatives si nécessaire)
      let userData = null;
      let userError = null;
      
      for (let i = 0; i < 3; i++) {
        const result = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', authData.user.id)
          .single();

        if (!result.error && result.data) {
          userData = result.data;
          break;
        }
        
        userError = result.error;
        
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      if (userError || !userData) {
        console.error('⚠️ Error fetching user data:', userError);
        // Si l'utilisateur n'existe pas dans public.users, le créer
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email || normalizedEmail,
            onboarding_completed: false,
          });

        if (createError) {
          console.error('❌ Error creating user profile:', createError);
        }
        
        // Rediriger vers onboarding par défaut
        console.log('Redirecting to onboarding (new user or error)...');
        window.location.href = '/onboarding';
        return;
      }

      console.log('✅ User data fetched:', userData);
      console.log('✅ Onboarding completed:', userData?.onboarding_completed);

      // Rediriger selon le statut d'onboarding
      // Vérifier explicitement si c'est true (et non juste truthy)
      if (userData.onboarding_completed === true) {
        console.log('Redirecting to dashboard (onboarding completed)...');
        window.location.href = '/dashboard';
      } else {
        console.log('Redirecting to onboarding (onboarding not completed)...');
        window.location.href = '/onboarding';
      }
    } catch (err: any) {
      console.error('💥 Unexpected error:', err);
      setError(`Erreur inattendue : ${err?.message || 'Erreur inconnue'}`);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden">
      {/* Éléments décoratifs en arrière-plan - Plus dynamiques */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[var(--pink-300)] to-[var(--pink-400)] rounded-full blur-[140px] opacity-25 animate-gentle-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--lavender-300)] to-[var(--lavender-200)] rounded-full blur-[140px] opacity-25 animate-gentle-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-[var(--pink-200)] to-[var(--lavender-200)] rounded-full blur-[120px] opacity-15 animate-gentle-pulse" style={{ animationDelay: '4s' }}></div>
      
      {/* Barre de navigation */}
      <nav className="relative z-50 px-6 py-6 md:py-8 backdrop-blur-md bg-white/60 border-b border-[var(--pink-200)]/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-13 h-13 bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-strong)] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden">
              <Image 
                src="/logo2.png" 
                alt="BreastWise Logo" 
                width={50} 
                height={50}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[var(--text-primary)] to-[var(--accent-strong)] bg-clip-text text-transparent">BreastWise</span>
          </Link>
        </div>
      </nav>

      {/* Section principale - Formulaire de connexion */}
      <section className="relative px-6 py-12 md:py-20 z-10">
        <div className="max-w-md mx-auto">
          {/* Carte principale avec effets améliorés */}
          <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl border border-[var(--pink-200)]/50 shadow-2xl p-8 md:p-10 animate-fade-in overflow-hidden hover:shadow-[0_25px_70px_rgba(232,132,150,0.2)] transition-all duration-500">
            {/* Effets de lumière en arrière-plan */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--pink-200)]/30 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[var(--lavender-200)]/30 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ transitionDelay: '0.1s' }}></div>
            
            <div className="relative z-10">
              {/* Titre avec icône décorative */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)] rounded-2xl mb-6 shadow-xl animate-gentle-float">
                  <span className="text-4xl">💝</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-light text-[var(--text-primary)] mb-2 tracking-tight">
                  Ravie de vous revoir
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[var(--accent-medium)] to-transparent mx-auto mt-4 rounded-full"></div>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Champ Email avec icône */}
                <div className="relative">
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-semibold text-[var(--text-primary)] mb-2"
                  >
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      className="w-full px-4 py-3.5 pl-12 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300 hover:border-[var(--pink-300)]"
                      disabled={isLoading}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-light)] text-lg">✉️</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-light)]">
                    Utilisez l'adresse avec laquelle vous avez créé votre compte.
                  </p>
                </div>

                {/* Champ Mot de passe avec icône */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <label 
                      htmlFor="password" 
                      className="block text-sm font-semibold text-[var(--text-primary)]"
                    >
                      Mot de passe
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-[var(--accent-medium)] hover:text-[var(--accent-strong)] transition-colors font-medium"
                    >
                      J'ai oublié mon mot de passe
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      className="w-full px-4 py-3.5 pl-12 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300 hover:border-[var(--pink-300)]"
                      disabled={isLoading}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-light)] text-lg">🔒</span>
                  </div>
                </div>

                {/* Message d'erreur amélioré */}
                {error && (
                  <div className="p-4 bg-gradient-to-r from-[var(--error)]/20 to-[var(--error)]/10 border border-[var(--error)]/50 rounded-xl animate-fade-in">
                    <p className="text-sm text-[var(--text-primary)] text-center flex items-center justify-center gap-2">
                      <span>⚠️</span>
                      <span>{error}</span>
                    </p>
                  </div>
                )}

                {/* Bouton de connexion amélioré */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group/btn w-full px-6 py-4 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold text-lg hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
                  style={{ color: '#ffffff' }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Connexion en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Accéder à mon compte</span>
                        <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                </button>
              </form>
            </div>
          </div>

          {/* Message de bienveillance amélioré */}
          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-[var(--pink-200)]/50">
              <span className="text-lg">🌸</span>
              <p className="text-sm text-[var(--text-light)] italic">
                Prenez votre temps. Vous pouvez revenir plus tard si besoin.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}