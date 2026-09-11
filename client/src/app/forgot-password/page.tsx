'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModalStore } from '@/store/useAuthModalStore';

function ForgotPasswordContent() {
  const router = useRouter();

  useEffect(() => {
    useAuthModalStore.getState().openModal('forgot-password');
    router.replace('/');
  }, [router]);

  return null;
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
