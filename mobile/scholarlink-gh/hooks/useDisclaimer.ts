import { useState, useCallback } from 'react';
import { DisclaimerStatus } from '../types/api';
import { documentService } from '../services/documentService';

export const useDisclaimer = () => {
  const [disclaimerStatus, setDisclaimerStatus] = useState<DisclaimerStatus | null>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState<boolean>(false);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setIsFetchingStatus(true);
    setError(null);
    try {
      const status = await documentService.getDisclaimerStatus();
      setDisclaimerStatus(status);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch disclaimer status');
    } finally {
      setIsFetchingStatus(false);
    }
  }, []);

  const acceptDisclaimer = useCallback(async () => {
    setIsAccepting(true);
    setError(null);
    try {
      await documentService.acceptDisclaimer();
      setDisclaimerStatus((prev) => 
        prev ? { ...prev, disclaimer_accepted: true } : { disclaimer_accepted: true } as DisclaimerStatus
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to accept disclaimer');
    } finally {
      setIsAccepting(false);
    }
  }, []);

  const isAccepted = disclaimerStatus?.disclaimer_accepted ?? false;

  return {
    disclaimerStatus,
    isAccepted,
    isFetchingStatus,
    isAccepting,
    error,
    refreshStatus,
    acceptDisclaimer,
  };
};
