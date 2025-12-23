'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [canResend, setCanResend] = useState(true);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validation du champ vide
    if (!email) {
      setError('Merci de renseigner ton adresse e-mail.');
      return;
    }

    // Validation du format email
    if (!validateEmail(email)) {
      setError('Ce format d\'e-mail ne semble pas valide.');
      return;
    }

    setIsLoading(true);

    // Simulation d'envoi d'email (mocké pour l'instant)
    // Plus tard, ce sera remplacé par Supabase Auth
    try {
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Toujours afficher le message de succès (sécurité : ne pas confirmer l'existence du compte)
      setIsSubmitted(true);
      setCanResend(false);
      
      // Réactiver le bouton après 60 secondes
      setTimeout(() => {
        setCanResend(true);
      }, 60000);
    } catch (err) {
      setError('Le service est temporairement indisponible. Réessaie dans quelques minutes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setIsSubmitted(true);
      setCanResend(false);
      
      setTimeout(() => {
        setCanResend(true);
      }, 60000);
    } catch (err) {
      setError('Le service est temporairement indisponible. Réessaie dans quelques minutes.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden">
      {/* Éléments décoratifs en arrière-plan */}
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

          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-[var(--text-primary)] border-2 border-[var(--button-secondary-border)] rounded-xl hover:border-[var(--button-secondary-hover-border)] hover:bg-gradient-to-r hover:from-[var(--pink-50)] hover:to-[var(--lavender-50)] transition-all duration-300 hover:scale-105 hover:shadow-md"
          >
            ← Retour
          </Link>
        </div>
      </nav>

      {/* Section principale */}
      <section className="relative px-6 py-12 md:py-20 z-10">
        <div className="max-w-md mx-auto">
          {/* Carte principale */}
          <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl border border-[var(--pink-200)]/50 shadow-2xl p-8 md:p-10 animate-fade-in overflow-hidden hover:shadow-[0_25px_70px_rgba(232,132,150,0.2)] transition-all duration-500">
            {/* Effets de lumière en arrière-plan */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--pink-200)]/30 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[var(--lavender-200)]/30 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ transitionDelay: '0.1s' }}></div>
            
            <div className="relative z-10">
              {/* Titre avec icône décorative */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)] rounded-2xl mb-6 shadow-xl animate-gentle-float">
                  <span className="text-4xl">🔐</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-light text-[var(--text-primary)] mb-2 tracking-tight">
                  On va t'aider à te reconnecter
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[var(--accent-medium)] to-transparent mx-auto mt-4 rounded-full"></div>
              </div>

              {!isSubmitted ? (
                <>
                  {/* Texte introductif */}
                  <p className="text-center text-[var(--text-light)] mb-8">
                    Indique l'adresse e-mail de ton compte. Nous t'enverrons un lien pour choisir un nouveau mot de passe.
                  </p>

                  {/* Formulaire */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Champ Email */}
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
                        Utilise l'adresse que tu as choisie à la création du compte.
                      </p>
                    </div>

                    {/* Message d'erreur */}
                    {error && (
                      <div className="p-4 bg-gradient-to-r from-[var(--error)]/20 to-[var(--error)]/10 border border-[var(--error)]/50 rounded-xl animate-fade-in">
                        <p className="text-sm text-[var(--text-primary)] text-center flex items-center justify-center gap-2">
                          <span>⚠️</span>
                          <span>{error}</span>
                        </p>
                      </div>
                    )}

                    {/* Bouton d'envoi */}
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
                            <span>Envoi en cours…</span>
                          </>
                        ) : (
                          <>
                            <span>Envoyer le lien</span>
                            <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {/* État après soumission */}
                  <div className="text-center space-y-6">
                    <div className="p-6 bg-gradient-to-r from-[var(--accent-light)]/20 to-[var(--pink-200)]/20 border border-[var(--accent-medium)]/50 rounded-xl">
                      <div className="text-4xl mb-4">📧</div>
                      <p className="text-[var(--text-primary)] text-sm leading-relaxed">
                        Si un compte existe avec cette adresse, tu recevras un e-mail avec un lien pour réinitialiser ton mot de passe. Pense à vérifier tes spams.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleResend}
                        disabled={!canResend || isLoading}
                        className="w-full px-6 py-3 bg-white border-2 border-[var(--pink-300)] text-[var(--pink-600)] rounded-xl font-semibold hover:bg-[var(--pink-50)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-[var(--pink-600)]/30 border-t-[var(--pink-600)] rounded-full animate-spin"></span>
                            <span>Envoi en cours…</span>
                          </span>
                        ) : (
                          'Renvoyer l\'e-mail'
                        )}
                      </button>

                      <Link
                        href="/login"
                        className="w-full px-6 py-3 text-center text-[var(--text-primary)] border-2 border-[var(--button-secondary-border)] rounded-xl hover:bg-gradient-to-r hover:from-[var(--pink-50)] hover:to-[var(--lavender-50)] transition-all duration-300"
                      >
                        Retour à la connexion
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Message de bienveillance */}
          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-[var(--pink-200)]/50">
              <span className="text-lg">🌸</span>
              <p className="text-sm text-[var(--text-light)] italic">
                Pas de souci, on s'en occupe.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}