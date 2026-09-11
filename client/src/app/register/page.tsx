'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthModalStore } from '@/store/useAuthModalStore';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || searchParams?.get('callbackUrl') || undefined;

  useEffect(() => {
    useAuthModalStore.getState().openModal('register', redirectUrl);
    router.replace('/');
  }, [router, redirectUrl]);

  return null;
}

export default function CustomerRegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
