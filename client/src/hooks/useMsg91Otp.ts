'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

declare global {
  interface Window {
    initSendOTP?: (config: any) => void;
    sendOtp?: (
      identifier: string,
      success?: (data: any) => void,
      failure?: (error: any) => void
    ) => void;
    retryOtp?: (
      channel: string | null,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string
    ) => void;
    verifyOtp?: (
      otp: string | number,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string
    ) => void;
    getWidgetData?: () => any;
  }
}

const MSG91_SCRIPT_URL = 'https://verify.msg91.com/otp-provider.js';
const WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '3669726b756e373832333938';
const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '572383Ttjt0vYaGk36aad1f58P1';

export function useMsg91Otp() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);

  const initWidget = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (typeof window.initSendOTP === 'function' && !isInitializedRef.current) {
      try {
        const config = {
          widgetId: WIDGET_ID,
          tokenAuth: TOKEN_AUTH,
          exposeMethods: true,
          success: (data: any) => {
            console.debug('[MSG91] Global success event:', data);
          },
          failure: (error: any) => {
            console.warn('[MSG91] Global failure event:', error);
          },
        };

        window.initSendOTP(config);
        isInitializedRef.current = true;
        setIsReady(true);
      } catch (err: any) {
        console.error('[MSG91] Failed to initSendOTP:', err);
        setInitError(err?.message || 'Failed to initialize OTP widget');
      }
    } else if (typeof window.sendOtp === 'function') {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if methods are already exposed on window
    if (typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function') {
      setIsReady(true);
      return;
    }

    // Check if script is already present in DOM
    const existingScript = document.querySelector(`script[src="${MSG91_SCRIPT_URL}"]`);
    if (existingScript) {
      if (typeof window.initSendOTP === 'function') {
        initWidget();
      } else {
        existingScript.addEventListener('load', initWidget);
      }
      return;
    }

    // Inject script tag
    const script = document.createElement('script');
    script.src = MSG91_SCRIPT_URL;
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      initWidget();
    };
    script.onerror = () => {
      setInitError('Failed to load mobile OTP provider script. Please check your network or ad-blocker.');
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount to keep widget persistent across modal toggles
    };
  }, [initWidget]);

  /**
   * Formats Indian or international phone numbers to digits only with country code,
   * without the '+' prefix as required by MSG91.
   * e.g. "9876543210" -> "919876543210"
   */
  const formatPhoneForMsg91 = useCallback((phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      // Standard 10-digit Indian mobile number
      return `91${cleaned}`;
    }
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return `91${cleaned.slice(1)}`;
    }
    return cleaned;
  }, []);

  /**
   * Trigger MSG91 sendOtp
   */
  const sendOtp = useCallback(
    async (phone: string): Promise<any> => {
      setIsLoading(true);
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || typeof window.sendOtp !== 'function') {
          setIsLoading(false);
          reject(new Error('OTP service is still loading. Please try again in a few seconds.'));
          return;
        }

        const formattedIdentifier = formatPhoneForMsg91(phone);

        window.sendOtp!(
          formattedIdentifier,
          (data) => {
            setIsLoading(false);
            resolve(data);
          },
          (error) => {
            setIsLoading(false);
            const errMsg =
              typeof error === 'string'
                ? error
                : error?.message || error?.description || 'Failed to send OTP to this mobile number.';
            reject(new Error(errMsg));
          }
        );
      });
    },
    [formatPhoneForMsg91]
  );

  /**
   * Trigger MSG91 retryOtp
   */
  const retryOtp = useCallback(async (): Promise<any> => {
    setIsLoading(true);
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof window.retryOtp !== 'function') {
        setIsLoading(false);
        reject(new Error('OTP service is not ready.'));
        return;
      }

      window.retryOtp!(
        null, // Default channel (or '11' for SMS)
        (data) => {
          setIsLoading(false);
          resolve(data);
        },
        (error) => {
          setIsLoading(false);
          const errMsg =
            typeof error === 'string'
              ? error
              : error?.message || error?.description || 'Failed to resend OTP. Please wait before retrying.';
          reject(new Error(errMsg));
        }
      );
    });
  }, []);

  /**
   * Trigger MSG91 verifyOtp
   * Returns the verified access token string
   */
  const verifyOtp = useCallback(async (otp: string): Promise<string> => {
    setIsLoading(true);
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof window.verifyOtp !== 'function') {
        setIsLoading(false);
        reject(new Error('OTP service is not ready.'));
        return;
      }

      const cleanOtp = otp.trim();
      if (!cleanOtp) {
        setIsLoading(false);
        reject(new Error('Please enter the verification code.'));
        return;
      }

      window.verifyOtp!(
        cleanOtp,
        (data) => {
          setIsLoading(false);
          // Extract token from MSG91 response
          let token = '';
          if (typeof data === 'string') {
            token = data;
          } else if (data && typeof data === 'object') {
            token =
              data['access-token'] ||
              data.token ||
              data.message ||
              data.jwt ||
              data.accessToken ||
              (typeof data.data === 'string' ? data.data : '') ||
              '';
          }

          if (!token) {
            reject(new Error('Invalid response received from verification provider.'));
            return;
          }

          resolve(token);
        },
        (error) => {
          setIsLoading(false);
          const errMsg =
            typeof error === 'string'
              ? error
              : error?.message || error?.description || 'Invalid verification code. Please check and try again.';
          reject(new Error(errMsg));
        }
      );
    });
  }, []);

  return {
    isReady,
    isLoading,
    initError,
    formatPhoneForMsg91,
    sendOtp,
    retryOtp,
    verifyOtp,
  };
}
