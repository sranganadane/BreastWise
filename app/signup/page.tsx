'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

type Errors = Partial<Record<keyof FormState | 'confirmPassword' | 'accept', string>>;

interface FormState {
  firstName: string;
  lastName: string;
  birthdate: string;
  email: string;
  password: string;
  confirmPassword: string;
  accept: boolean;
}

const minName = 2;
const maxName = 50;

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    birthdate: '',
    email: '',
    password: '',
    confirmPassword: '',
    accept: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isAdult = (dateStr: string) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    const adultDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return d <= adultDate;
  };
  const passwordStrength = (pwd: string) => {
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 'fort';
    if (pwd.length >= 8) return 'moyen';
    return 'faible';
  };

  const validate = () => {
    const nextErrors: Errors = {};

    if (!form.firstName || form.firstName.length < minName) nextErrors.firstName = 'Merci de renseigner ton prénom.';
    if (!form.lastName || form.lastName.length < minName) nextErrors.lastName = 'Merci de renseigner ton nom.';
    if (!form.birthdate || !isAdult(form.birthdate)) nextErrors.birthdate = 'Merci de renseigner une date de naissance valide.';
    if (!form.email || !validateEmail(form.email)) nextErrors.email = 'Ce format d’e-mail ne semble pas valide.';
    if (!form.password || form.password.length < 8) nextErrors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    if (!form.accept) nextErrors.accept = 'Merci d’accepter les conditions d’utilisation pour continuer.';
    return nextErrors;
  };

  const handleChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === 'accept' ? e.target.checked : e.target.value;
    setForm((prev) => {
      const updatedForm = { ...prev, [key]: value };
      
      // Validation en temps réel pour la correspondance des mots de passe
      if (key === 'password' || key === 'confirmPassword') {
        if (updatedForm.password && updatedForm.confirmPassword) {
          if (updatedForm.password !== updatedForm.confirmPassword) {
            setErrors((prevErrors) => ({ ...prevErrors, confirmPassword: 'Les mots de passe ne correspondent pas.' }));
          } else {
            setErrors((prevErrors) => ({ ...prevErrors, confirmPassword: undefined }));
          }
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, confirmPassword: undefined }));
        }
      } else {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
      
      return updatedForm;
    });
    setGlobalError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    setGlobalError('');
    
    try {
      const supabase = createClient();
      
      // 1. Inscription avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            birth_date: form.birthdate,
          },
        },
      });

      if (authError) {
        console.error('Supabase Auth Error:', authError);
        
        if (authError.message.includes('already registered') || authError.message.includes('already exists') || authError.message.includes('User already registered')) {
          setGlobalError('Cette adresse e-mail est déjà utilisée. Tu peux te connecter si tu as déjà un compte.');
        } else if (authError.message.includes('Password') || authError.message.includes('password')) {
          setGlobalError('Le mot de passe ne respecte pas les critères de sécurité.');
        } else if (authError.message.includes('Invalid email')) {
          setGlobalError('Ce format d\'e-mail n\'est pas valide.');
        } else {
          setGlobalError(`Erreur : ${authError.message}. Si le problème persiste, vérifie ta connexion internet.`);
        }
        setIsLoading(false);
        return;
      }

      if (!authData?.user) {
        setGlobalError('Aucun utilisateur créé. Vérifie que l\'authentification est bien activée dans Supabase.');
        setIsLoading(false);
        return;
      }

      console.log('User created in auth.users with ID:', authData.user.id);

      // 2. Se connecter automatiquement pour établir la session AVANT de créer le profil
      // Cela garantit que auth.uid() sera disponible pour les RLS policies
      console.log('Signing in to establish session...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        console.error('❌ Error signing in after signup:', signInError);
        
        // Si l'erreur est due à l'email non confirmé
        if (signInError.message.includes('Email not confirmed') || signInError.message.includes('email not confirmed')) {
          setGlobalError('Un email de confirmation a été envoyé. Vérifie ta boîte mail et clique sur le lien pour activer ton compte, puis connecte-toi.');
          setIsLoading(false);
          return;
        }
        
        // Autre erreur
        setGlobalError('Ton compte a été créé, mais la connexion automatique a échoué. Tu peux te connecter manuellement maintenant.');
        setIsLoading(false);
        return;
      }

      if (!signInData?.session) {
        console.error('❌ No session after sign in');
        setGlobalError('Ton compte a été créé, mais la session n\'a pas pu être établie. Tu peux te connecter manuellement maintenant.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Session established via signIn');
      console.log('✅ User ID:', signInData.user.id);

      // Vérifier que la session est bien disponible
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        console.error('❌ No session available after signIn');
        setGlobalError('La session n\'a pas pu être établie. Réessaye de te connecter manuellement.');
        setIsLoading(false);
        return;
      }
      console.log('✅ Session verified:', currentSession.user.id);

      // 3. Maintenant que la session est établie, créer le profil dans public.users
      // auth.uid() sera maintenant disponible pour les RLS policies
      console.log('Creating user profile with established session...');
      const { data: userProfileData, error: profileError } = await supabase
        .from('users')
        .upsert({
          id: signInData.user.id,
          email: form.email,
          first_name: form.firstName,
          last_name: form.lastName,
          onboarding_completed: false,
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        console.error('Error code:', (profileError as any).code);
        console.error('Error message:', (profileError as any).message);
        
        const errorCode = (profileError as any).code;
        const errorMessage = (profileError as any).message || 'Erreur inconnue';
        
        // Si c'est une erreur RLS, donner des instructions
        if (errorCode === '42501' || errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
          setGlobalError(`Erreur de permissions : ${errorMessage}\n\n💡 SOLUTION : Tu dois créer une RLS policy pour INSERT dans Supabase.\n\nVa dans Supabase Dashboard > Table Editor > users > Policies\n\nCrée cette policy :\n\nCREATE POLICY "Users can insert their own profile"\nON users\nFOR INSERT\nWITH CHECK (auth.uid() = id);`);
        } else {
          setGlobalError(`Erreur lors de la création du profil : ${errorMessage}`);
        }
        setIsLoading(false);
        return;
      }

      console.log('✅ User profile created successfully');

      // Stocker le prénom dans localStorage pour un affichage immédiat dans l'onboarding
      localStorage.setItem('user_first_name', form.firstName);

      // 4. Rediriger vers l'onboarding avec window.location.href pour forcer le refresh
      console.log('Redirecting to onboarding...');
      window.location.href = '/onboarding';
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      setGlobalError(`Une erreur inattendue s'est produite : ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  };

  const strength = passwordStrength(form.password);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden">
      {/* Décorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[var(--pink-300)] to-[var(--pink-400)] rounded-full blur-[140px] opacity-25 animate-gentle-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--lavender-300)] to-[var(--lavender-200)] rounded-full blur-[140px] opacity-25 animate-gentle-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-gradient-to-br from-[var(--pink-200)] to-[var(--lavender-200)] rounded-full blur-[120px] opacity-15 animate-gentle-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Navbar avec retour */}
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
          
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-[var(--text-primary)] border-2 border-[var(--button-secondary-border)] rounded-xl hover:border-[var(--button-secondary-hover-border)] hover:bg-gradient-to-r hover:from-[var(--pink-50)] hover:to-[var(--lavender-50)] transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              J'ai déjà un compte
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-semibold text-[var(--text-primary)] border-2 border-[var(--button-secondary-border)] rounded-xl hover:border-[var(--button-secondary-hover-border)] hover:bg-gradient-to-r hover:from-[var(--pink-50)] hover:to-[var(--lavender-50)] transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </nav>

      {/* Section principale */}
      <section className="relative px-6 py-12 md:py-20 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl border border-[var(--pink-200)]/50 shadow-2xl p-8 md:p-10 animate-fade-in overflow-hidden hover:shadow-[0_25px_70px_rgba(232,132,150,0.2)] transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--pink-200)]/30 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[var(--lavender-200)]/30 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ transitionDelay: '0.1s' }}></div>

            <div className="relative z-10 space-y-8">
              {/* Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)] rounded-2xl mb-6 shadow-xl animate-gentle-float">
                  <span className="text-4xl">🌸</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-light text-[var(--text-primary)] mb-2 tracking-tight">
                  Créer mon espace BreastWise
                </h1>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                  Bienvenue ! Créons ensemble ton espace personnalisé pour t'accompagner tout au long de ton parcours.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/70 border border-[var(--pink-200)]/50 rounded-xl text-sm text-[var(--text-light)]">
                  <span>🔒</span>
                  <span>Vos données sont privées et sécurisées.</span>
                </div>
              </div>

              {/* Global error */}
              {globalError && (
                <div className="p-4 bg-gradient-to-r from-[var(--error)]/20 to-[var(--error)]/10 border border-[var(--error)]/50 rounded-xl animate-fade-in">
                  <p className="text-sm text-[var(--text-primary)] text-center flex items-center justify-center gap-2">
                    <span>⚠️</span>
                    <span>{globalError}</span>
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FieldText
                    id="firstName"
                    label="Prénom"
                    placeholder="Ton prénom"
                    value={form.firstName}
                    onChange={handleChange('firstName')}
                    error={errors.firstName}
                  />
                  <FieldText
                    id="lastName"
                    label="Nom"
                    placeholder="Ton nom"
                    value={form.lastName}
                    onChange={handleChange('lastName')}
                    error={errors.lastName}
                  />
                </div>

                <FieldDate
                  id="birthdate"
                  label="Date de naissance"
                  value={form.birthdate}
                  onChange={handleChange('birthdate')}
                  error={errors.birthdate}
                />

                <FieldText
                  id="email"
                  label="Adresse e-mail"
                  placeholder="vous@exemple.com"
                  value={form.email}
                  onChange={handleChange('email')}
                  error={errors.email}
                  icon="✉️"
                  type="email"
                />

                <FieldPassword
                  id="password"
                  label="Mot de passe"
                  placeholder="Ton mot de passe"
                  value={form.password}
                  onChange={handleChange('password')}
                  error={errors.password}
                  helper="Minimum 8 caractères recommandé."
                  icon="🔒"
                  strength={strength}
                />

                <FieldPassword
                  id="confirmPassword"
                  label="Confirmer le mot de passe"
                  placeholder="Confirme ton mot de passe"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  error={errors.confirmPassword}
                  icon="✅"
                  matchesPassword={!!form.password && !!form.confirmPassword && form.password === form.confirmPassword}
                />

                <FieldCheckbox
                  id="accept"
                  label={
                    <>
                      J'accepte les conditions d'utilisation et la politique de confidentialité{' '}
                      <span className="text-red-500 font-bold">*</span>
                    </>
                  }
                  checked={form.accept}
                  onChange={handleChange('accept')}
                  error={errors.accept}
                />

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
                        <span>Création de ton compte...</span>
                      </>
                    ) : (
                      <>
                        <span>Créer mon compte</span>
                        <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                </button>
              </form>

              {/* Lien vers login */}
              <div className="text-center text-sm text-[var(--text-secondary)]">
                Tu as déjà un compte ?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-[var(--accent-medium)] hover:text-[var(--accent-strong)] transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============ Sous-composants ============ */

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  icon?: string;
  helper?: string;
  strength?: 'faible' | 'moyen' | 'fort';
  matchesPassword?: boolean;
}

function FieldText({ id, label, value, onChange, placeholder, error, type = 'text', icon }: FieldProps) {
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 pl-12 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300 hover:border-[var(--pink-300)]"
        />
        {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-light)] text-lg">{icon}</span>}
      </div>
      {error && <p className="mt-2 text-sm text-[var(--error)]">{error}</p>}
    </div>
  );
}

function FieldDate({ id, label, value, onChange, error }: FieldProps) {
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3.5 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300 hover:border-[var(--pink-300)]"
      />
      {error && <p className="mt-2 text-sm text-[var(--error)]">{error}</p>}
    </div>
  );
}

function FieldPassword({ id, label, value, onChange, placeholder, error, helper, icon, strength, matchesPassword }: FieldProps) {
  const strengthColor =
    strength === 'fort' ? 'bg-green-500' : strength === 'moyen' ? 'bg-yellow-500' : 'bg-red-400';
  const strengthWidth =
    strength === 'fort' ? 'w-full' : strength === 'moyen' ? 'w-2/3' : 'w-1/3';
  
  // Pour le champ de confirmation, afficher une barre verte si les mots de passe correspondent
  const showMatchIndicator = matchesPassword !== undefined;
  const matchColor = matchesPassword ? 'bg-green-500' : 'bg-red-400';

  return (
    <div className="relative space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="password"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 pl-12 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300 hover:border-[var(--pink-300)]"
        />
        {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-light)] text-lg">{icon}</span>}
      </div>
      {helper && <p className="text-xs text-[var(--text-light)]">{helper}</p>}
      {value && strength && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-full bg-[var(--pink-50)] rounded-full overflow-hidden">
            <div className={`h-full ${strengthColor} ${strengthWidth} transition-all duration-300`}></div>
          </div>
          <span className="text-xs text-[var(--text-light)] capitalize">{strength}</span>
        </div>
      )}
      {value && showMatchIndicator && (
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="relative h-3 w-full bg-gradient-to-r from-[var(--pink-50)] to-[var(--lavender-50)] rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full w-full rounded-full transition-all duration-500 ease-out ${
                matchesPassword 
                  ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-lg shadow-green-500/50' 
                  : 'bg-gradient-to-r from-red-300 via-red-400 to-red-500 shadow-lg shadow-red-400/50'
              }`}
              style={{ 
                animation: matchesPassword ? 'slideIn 0.5s ease-out' : undefined 
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {matchesPassword ? (
              <>
                <span className="text-lg animate-gentle-float">✓</span>
                <span className="text-sm font-semibold text-green-600">
                  Les mots de passe correspondent
                </span>
              </>
            ) : (
              <>
                <span className="text-lg">⚠️</span>
                <span className="text-sm font-medium text-red-500">
                  Les mots de passe ne correspondent pas
                </span>
              </>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
    </div>
  );
}

interface FieldCheckboxProps {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

function FieldCheckbox({ id, label, checked, onChange, error }: FieldCheckboxProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mt-1 h-5 w-5 rounded-md border-2 border-[var(--pink-200)] text-[var(--accent-medium)] focus:ring-[var(--accent-light)] focus:ring-2"
        />
        <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {label}
        </span>
      </label>
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
    </div>
  );
}