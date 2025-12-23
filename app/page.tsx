import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden">
      {/* Éléments décoratifs en arrière-plan - Alignés et uniformes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[var(--pink-300)] to-[var(--pink-400)] rounded-full blur-[140px] opacity-20 animate-gentle-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[var(--lavender-300)] to-[var(--lavender-200)] rounded-full blur-[140px] opacity-20 animate-gentle-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Barre de navigation moderne avec glassmorphism */}
      <nav className="relative z-50 px-6 py-6 md:py-8 backdrop-blur-md bg-white/60 border-b border-[var(--pink-200)]/30 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo / Nom - Plus stylé */}
          <div className="flex items-center gap-3 group">
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
          </div>
          
          {/* Boutons de navigation - Design moderne */}
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-gradient-to-r from-[var(--button-primary-bg)] to-[var(--pink-600)] text-white rounded-xl font-semibold text-sm hover:from-[var(--pink-600)] hover:to-[var(--pink-700)] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform hover:-translate-y-0.5"
              style={{ color: '#ffffff' }}
            >
              S'inscrire
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 text-[var(--button-secondary-text)] border-2 border-[var(--button-secondary-border)] rounded-xl font-semibold text-sm hover:border-[var(--button-secondary-hover-border)] hover:bg-gradient-to-r hover:from-[var(--pink-50)] hover:to-[var(--lavender-50)] transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Section Héros - Design moderne avec dégradé uniforme */}
      <section className="relative px-6 py-12 md:py-20 text-center max-w-5xl mx-auto z-10">
        {/* Dégradé uniforme derrière le texte - étendu sur toute la largeur et depuis le haut */}
        <div className="fixed left-0 top-0 w-full h-screen bg-gradient-to-r from-[var(--pink-100)]/50 via-[var(--lavender-100)]/40 to-[var(--pink-100)]/50 pointer-events-none -z-10"></div>
        
        <div className="space-y-6 md:space-y-8 relative z-10">
          {/* Titre principal - Plus moderne */}
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-[var(--text-primary)] leading-[1.1] tracking-tight mb-4">
              À vos côtés,{' '}
              <span className="font-semibold text-[var(--accent-strong)] relative inline-block">
                pas à pas
                <svg className="absolute -bottom-2 left-0 w-full h-8 text-[var(--accent-light)] opacity-60" viewBox="0 0 200 30" preserveAspectRatio="none" style={{ zIndex: -1 }}>
                  <path d="M0,25 Q50,10 100,20 T200,23" stroke="currentColor" strokeWidth="3" fill="none" className="animate-wave"/>
                </svg>
              </span>
              <br className="hidden md:block" />
              <span className="font-light bg-gradient-to-r from-[#1a0f0f] via-[#2d1d1d] to-[var(--text-primary)] bg-clip-text text-transparent inline-block">
                tout au long de votre parcours.
              </span>
            </h1>
            
            {/* Sous-titre avec mention du cancer du sein */}
            <div className="max-w-3xl mx-auto mt-6">
              <p className="text-xl md:text-2xl text-[var(--text-secondary)] leading-relaxed font-light">
                Un espace numérique conçu pour les <span className="font-medium text-[var(--accent-strong)]">femmes atteintes du cancer du sein</span>, pour vous accompagner avec douceur et bienveillance.
              </p>
            </div>
          </div>
          
          {/* Points de confiance - Design moderne avec glassmorphism */}
          <div className="flex flex-wrap justify-center gap-3 pt-6 text-sm text-[var(--text-light)] animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-xl border border-[var(--pink-200)]/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
              <span className="text-xl">🔒</span>
              <span className="font-semibold">100% confidentiel</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-xl border border-[var(--pink-200)]/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
              <span className="text-xl">💝</span>
              <span className="font-semibold">Bienveillant</span>
            </div>
          </div>
          
          {/* Boutons d'action - Design moderne */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              <Link
                href="/signup"
                className="group px-10 py-4 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold text-lg hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 relative overflow-hidden inline-block"
                style={{ color: '#ffffff' }}
              >
                <span className="relative z-10">Créer mon espace</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Link>
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[var(--accent-strong)] to-[var(--pink-700)] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-gentle-pulse">
                Essai gratuit
              </span>
            </div>
            <Link
              href="/login"
              className="px-10 py-4 bg-white/90 backdrop-blur-sm text-[var(--button-secondary-text)] border-2 border-[var(--button-secondary-border)] rounded-xl font-semibold text-lg hover:border-[var(--button-secondary-hover-border)] hover:bg-gradient-to-r hover:from-[var(--pink-50)] hover:to-[var(--lavender-50)] hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              J'ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Courbe de séparation moderne avec gradient */}
      <div className="relative w-full h-16 -mt-8 z-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--pink-50)" />
              <stop offset="50%" stopColor="white" />
              <stop offset="100%" stopColor="var(--lavender-50)" />
            </linearGradient>
          </defs>
          <path d="M0,120 L0,80 Q360,20 720,60 T1440,60 L1440,120 Z" fill="url(#gradient1)" opacity="0.95"/>
        </svg>
      </div>

      {/* Section "Comment BreastWise vous aide" - Design moderne avec glassmorphism */}
      <section className="relative px-6 py-16 md:py-24 bg-gradient-to-b from-white via-[var(--pink-50)]/30 to-[var(--lavender-50)]/20 backdrop-blur-sm z-10">
        {/* Dégradé uniforme derrière le texte et les cartes */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--pink-100)]/70 via-[var(--lavender-100)]/60 to-[var(--pink-100)]/50 pointer-events-none -z-10"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[var(--text-primary)] mb-4 tracking-tight">
              Comment BreastWise vous aide
            </h2>
            <div className="w-full flex justify-center">
              <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl font-light leading-relaxed text-center">
              Trois piliers pour vous accompagner au quotidien
            </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {/* Bloc 1 - Design moderne avec glassmorphism */}
            <div className="group relative p-8 bg-white/70 backdrop-blur-xl rounded-3xl border border-[var(--pink-200)]/50 hover:border-[var(--accent-medium)] hover:shadow-[0_25px_70px_rgba(232,132,150,0.25)] transition-all duration-500 animate-fade-in hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--pink-50)]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pink-200)] rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)] rounded-2xl flex items-center justify-center mb-6 animate-gentle-float shadow-xl mx-auto group-hover:scale-110 transition-transform duration-300">
                  <span className="text-5xl">📊</span>
              </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4 text-center">
                Organiser mon quotidien
              </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-base mb-6 text-center">
                Un tableau de bord clair pour visualiser votre énergie, votre humeur et l'évolution de votre traitement.
              </p>
                <ul className="space-y-3 text-sm text-[var(--text-light)]">
                  <li className="flex items-center gap-3">
                    <span className="text-[var(--accent-medium)] text-lg font-bold">✓</span>
                    <span>Suivi de votre énergie au quotidien</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[var(--accent-medium)] text-lg font-bold">✓</span>
                    <span>Graphiques d'évolution</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[var(--accent-medium)] text-lg font-bold">✓</span>
                    <span>Plan du jour adapté</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bloc 2 */}
            <div className="group relative p-8 bg-white/70 backdrop-blur-xl rounded-3xl border border-[var(--lavender-200)]/50 hover:border-[var(--lavender-300)] hover:shadow-[0_25px_70px_rgba(213,207,232,0.25)] transition-all duration-500 animate-fade-in hover:-translate-y-2 overflow-hidden" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--lavender-50)]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--lavender-200)] rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--lavender-100)] via-[var(--lavender-200)] to-[var(--lavender-300)] rounded-2xl flex items-center justify-center mb-6 animate-gentle-float shadow-xl mx-auto group-hover:scale-110 transition-transform duration-300" style={{ animationDelay: '1s' }}>
                  <span className="text-5xl">📅</span>
              </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4 text-center">
                Suivre mon traitement
              </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-base mb-6 text-center">
                Un aperçu simple de vos prochains rendez-vous, des étapes importantes et des séances déjà réalisées.
              </p>
                <ul className="space-y-3 text-sm text-[var(--text-light)]">
                  <li className="flex items-center gap-3">
                    <span className="text-[var(--lavender-300)] text-lg font-bold">✓</span>
                    <span>Timeline de votre parcours</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[var(--lavender-300)] text-lg font-bold">✓</span>
                    <span>Rappels de rendez-vous</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[var(--lavender-300)] text-lg font-bold">✓</span>
                    <span>Documents médicaux organisés</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bloc 3 */}
            <div className="group relative p-8 bg-white/70 backdrop-blur-xl rounded-3xl border border-[var(--pink-200)]/50 hover:border-[var(--accent-medium)] hover:shadow-[0_25px_70px_rgba(232,132,150,0.25)] transition-all duration-500 animate-fade-in hover:-translate-y-2 overflow-hidden" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--pink-50)]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pink-200)] rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)] rounded-2xl flex items-center justify-center mb-6 animate-gentle-float shadow-xl mx-auto group-hover:scale-110 transition-transform duration-300" style={{ animationDelay: '2s' }}>
                  <span className="text-5xl">💝</span>
              </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4 text-center">
                Me sentir soutenue
              </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-base mb-6 text-center">
                Un journal guidé et des exercices pour déposer ce que vous ressentez.
              </p>
                <ul className="space-y-3 text-sm text-[var(--text-light)]">
                  <li className="flex items-center gap-3">
                    <span className="text-[var(--accent-medium)] text-lg font-bold">✓</span>
                    <span>Journal guidé bienveillant</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[var(--accent-medium)] text-lg font-bold">✓</span>
                    <span>Exercices de bien-être</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[var(--accent-medium)] text-lg font-bold">✓</span>
                    <span>Messages de soutien</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section "Ce que vous obtenez" - Bénéfices immédiats */}
      <section className="relative px-6 py-16 md:py-20 bg-gradient-to-b from-[var(--lavender-50)]/30 via-white to-[var(--pink-50)]/20 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] mb-4 tracking-tight">
              Ce que vous obtenez dès aujourd'hui
            </h2>
            <div className="w-full flex justify-center">
              <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl font-light leading-relaxed text-center">
                Dès votre inscription, accédez à tous ces outils pour mieux vous organiser
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-[var(--pink-200)]/50 hover:border-[var(--accent-medium)] hover:shadow-lg transition-all duration-300 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-[var(--text-primary)] mb-2">Tableau de bord</h3>
              <p className="text-sm text-[var(--text-secondary)]">Visualisez votre énergie et votre humeur en un coup d'œil</p>
              </div>
            
            <div className="p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-[var(--lavender-200)]/50 hover:border-[var(--lavender-300)] hover:shadow-lg transition-all duration-300 text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="font-bold text-[var(--text-primary)] mb-2">Plan du jour</h3>
              <p className="text-sm text-[var(--text-secondary)]">Planning adapté à votre état du moment</p>
            </div>
            
            <div className="p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-[var(--pink-200)]/50 hover:border-[var(--accent-medium)] hover:shadow-lg transition-all duration-300 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="font-bold text-[var(--text-primary)] mb-2">Journal guidé</h3>
              <p className="text-sm text-[var(--text-secondary)]">Espace pour exprimer vos émotions</p>
            </div>
            
            <div className="p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-[var(--lavender-200)]/50 hover:border-[var(--lavender-300)] hover:shadow-lg transition-all duration-300 text-center">
              <div className="text-4xl mb-4">💝</div>
              <h3 className="font-bold text-[var(--text-primary)] mb-2">Exercices bien-être</h3>
              <p className="text-sm text-[var(--text-secondary)]">Bibliothèque d'exercices pour vous soutenir</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courbe de séparation avec gradient */}
      <div className="relative w-full h-16 z-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--lavender-50)" />
              <stop offset="50%" stopColor="var(--pink-50)" />
              <stop offset="100%" stopColor="var(--beige-50)" />
            </linearGradient>
          </defs>
          <path d="M0,0 L0,40 Q360,100 720,60 T1440,60 L1440,0 Z" fill="url(#gradient2)" opacity="0.8"/>
        </svg>
      </div>

      {/* Section "À qui s'adresse BreastWise ?" - Design moderne */}
      <section className="relative px-6 py-20 md:py-28 bg-gradient-to-b from-[var(--pink-50)] via-white to-[var(--beige-50)] z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-6 py-2.5 bg-gradient-to-r from-[var(--lavender-100)] to-[var(--pink-100)] rounded-full mb-6 shadow-md">
              <span className="text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">Pour qui ?</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[var(--text-primary)] mb-4 tracking-tight">
              À qui s'adresse BreastWise ?
            </h2>
            <div className="w-full flex justify-center">
              <p className="text-xl md:text-2xl text-[var(--text-light)] max-w-2xl font-light text-center">
                Un espace conçu pour vous accompagner avec douceur
              </p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="group flex items-start gap-6 p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-[var(--pink-200)]/50 hover:border-[var(--accent-medium)] hover:shadow-[0_20px_60px_rgba(232,132,150,0.2)] transition-all duration-500 hover:scale-[1.02] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--pink-50)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="flex-shrink-0 w-18 h-18 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)] rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 relative z-10">
                <span className="text-3xl">💪</span>
              </div>
              <div className="relative z-10">
                <h4 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2">Un parcours médical intense</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm md:text-base">
                  Pour les femmes qui avancent pas à pas dans un parcours médical intense et qui cherchent un accompagnement bienveillant.
                </p>
              </div>
            </div>
            
            <div className="group flex items-start gap-6 p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-[var(--lavender-200)]/50 hover:border-[var(--lavender-300)] hover:shadow-[0_20px_60px_rgba(213,207,232,0.2)] transition-all duration-500 hover:scale-[1.02] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--lavender-50)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="flex-shrink-0 w-18 h-18 bg-gradient-to-br from-[var(--lavender-100)] via-[var(--lavender-200)] to-[var(--lavender-300)] rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 relative z-10">
                <span className="text-3xl">⚖️</span>
              </div>
              <div className="relative z-10">
                <h4 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2">Réduire la charge mentale</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm md:text-base">
                  Pour celles qui jonglent avec la fatigue, les rendez-vous et la charge mentale et qui ont besoin d'un outil pour s'organiser.
                </p>
              </div>
            </div>
            
            <div className="group flex items-start gap-6 p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-[var(--pink-200)]/50 hover:border-[var(--accent-medium)] hover:shadow-[0_20px_60px_rgba(232,132,150,0.2)] transition-all duration-500 hover:scale-[1.02] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--pink-50)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="flex-shrink-0 w-18 h-18 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)] rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 relative z-10">
                <span className="text-3xl">🌸</span>
              </div>
              <div className="relative z-10">
                <h4 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2">Prendre soin de soi</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm md:text-base">
                  Pour celles qui cherchent des outils pour mieux prendre soin d'elles-mêmes au quotidien, émotionnellement et physiquement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section "Respect et confidentialité" - Design centré */}
      <section className="relative px-6 py-12 bg-gradient-to-b from-[var(--beige-50)] to-white z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-[var(--text-secondary)] mb-4">
            Respect et confidentialité
          </h3>
          <div className="space-y-3 text-base md:text-lg text-[var(--text-secondary)] max-w-3xl mx-auto">
            <p className="leading-relaxed">
              <strong className="text-[var(--accent-strong)] font-semibold">Vos données sont privées et protégées.</strong> Nous utilisons les dernières technologies de sécurité pour garantir la confidentialité de vos informations.
            </p>
            <p className="leading-relaxed">
              <strong className="text-[var(--accent-strong)] font-semibold">Vous gardez le contrôle.</strong> Vous pouvez supprimer vos informations à tout moment, modifier vos données, ou exporter vos contenus.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}