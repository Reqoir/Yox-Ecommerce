'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import { useAuthStore } from '@/store/useAuthStore';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || searchParams?.get('callbackUrl') || undefined;
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (user || isAuthenticated) {
      router.replace(redirectUrl || '/');
      return;
    }
    useAuthModalStore.getState().openModal('login', redirectUrl);
    router.replace('/');
  }, [router, redirectUrl, user, isAuthenticated]);

  return null;
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
