"use client";

import { useState, useEffect, useCallback } from "react";

interface AITermsState {
  required: boolean;
  accepted: boolean;
  acceptedAt: string | null;
  isLoading: boolean;
}

interface UseAITermsReturn {
  // State
  termsRequired: boolean;
  termsAccepted: boolean;
  isLoading: boolean;
  showTermsModal: boolean;

  // Actions
  checkTerms: () => Promise<boolean>;
  acceptTerms: () => Promise<boolean>;
  openTermsModal: () => void;
  closeTermsModal: () => void;
  handleTermsAccept: () => void;
}

export function useAITerms(): UseAITermsReturn {
  const [state, setState] = useState<AITermsState>({
    required: false,
    accepted: true, // Default to true to not block FREE users
    acceptedAt: null,
    isLoading: true,
  });
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Check terms status on mount
  useEffect(() => {
    checkTermsStatus();
  }, []);

  const checkTermsStatus = async () => {
    try {
      const response = await fetch("/api/user/ai-terms");
      if (response.ok) {
        const data = await response.json();
        setState({
          required: data.required,
          accepted: data.accepted,
          acceptedAt: data.acceptedAt,
          isLoading: false,
        });
      } else {
        // If API fails, don't block user (assume accepted)
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("[useAITerms] Failed to check terms status:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Check if user can proceed with AI generation
  // Returns true if can proceed, false if needs to accept terms
  const checkTerms = useCallback(async (): Promise<boolean> => {
    // If still loading, refresh status
    if (state.isLoading) {
      await checkTermsStatus();
    }

    // If terms not required (FREE plan) or already accepted, proceed
    if (!state.required || state.accepted) {
      return true;
    }

    // Need to show modal
    setShowTermsModal(true);
    return false;
  }, [state.required, state.accepted, state.isLoading]);

  // Accept terms via API
  const acceptTerms = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/user/ai-terms", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          accepted: true,
          acceptedAt: data.acceptedAt,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("[useAITerms] Failed to accept terms:", error);
      return false;
    }
  }, []);

  // Modal controls
  const openTermsModal = useCallback(() => setShowTermsModal(true), []);
  const closeTermsModal = useCallback(() => setShowTermsModal(false), []);

  // Handler for when user accepts terms in modal
  const handleTermsAccept = useCallback(() => {
    setState((prev) => ({ ...prev, accepted: true }));
    setShowTermsModal(false);
  }, []);

  return {
    termsRequired: state.required,
    termsAccepted: state.accepted,
    isLoading: state.isLoading,
    showTermsModal,
    checkTerms,
    acceptTerms,
    openTermsModal,
    closeTermsModal,
    handleTermsAccept,
  };
}
