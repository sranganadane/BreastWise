import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Routes publiques (accessibles sans authentification)
  const publicRoutes = ['/', '/login', '/signup', '/mot-de-passe-oublie'];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  // Routes protégées (nécessitent une authentification)
  const protectedRoutes = [
    '/dashboard',
    '/onboarding',
    '/etat-du-jour',
    '/traitement',
    '/plan-du-jour',
    '/journal',
    '/bien-etre',
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Pour les routes publiques, on laisse passer sans vérifier la session
  // Les utilisateurs peuvent toujours accéder à /login et /signup
  if (isPublicRoute) {
    return response;
  }

  // Vérifier la session seulement pour les routes protégées
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Pour les routes protégées, vérifier la session
  if (isProtectedRoute) {
    // Si pas d'utilisateur, rediriger vers login
    if (!user || error) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Vérifier le statut d'onboarding
    const { data: userData } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    const onboardingCompleted = userData?.onboarding_completed === true;

    // Si l'utilisateur accède à /onboarding mais a déjà terminé, rediriger vers dashboard
    if (request.nextUrl.pathname === '/onboarding' && onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Si l'utilisateur accède à une autre route protégée mais n'a pas terminé l'onboarding, rediriger vers onboarding
    if (request.nextUrl.pathname !== '/onboarding' && !onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (pour éviter les conflits)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
