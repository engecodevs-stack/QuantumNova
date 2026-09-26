export type OnboardingProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface OnboardingState {
  status: OnboardingProgressStatus;
  currentStepIndex: number;
  completedAt?: string;
  skippedAt?: string;
}

const STORAGE_PREFIX = 'quantum_onboarding_v1_';

function getKey(userId?: string): string {
  const cleanId = userId ? userId.trim() : 'default_user';
  return `${STORAGE_PREFIX}${cleanId}`;
}

export function getOnboardingState(userId?: string): OnboardingState {
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          status: parsed.status || 'not_started',
          currentStepIndex: typeof parsed.currentStepIndex === 'number' ? parsed.currentStepIndex : 0,
          completedAt: parsed.completedAt,
          skippedAt: parsed.skippedAt
        };
      }
    }
  } catch (e) {
    console.error('Error reading onboarding state from localStorage:', e);
  }

  return {
    status: 'not_started',
    currentStepIndex: 0
  };
}

export function saveOnboardingState(state: Partial<OnboardingState>, userId?: string): void {
  try {
    const current = getOnboardingState(userId);
    const updated: OnboardingState = {
      ...current,
      ...state
    };
    localStorage.setItem(getKey(userId), JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving onboarding state to localStorage:', e);
  }
}

export function markOnboardingCompleted(userId?: string): void {
  saveOnboardingState(
    {
      status: 'completed',
      completedAt: new Date().toISOString()
    },
    userId
  );
}

export function markOnboardingSkipped(userId?: string): void {
  saveOnboardingState(
    {
      status: 'skipped',
      skippedAt: new Date().toISOString()
    },
    userId
  );
}

export function resetOnboardingStatus(userId?: string): void {
  saveOnboardingState(
    {
      status: 'not_started',
      currentStepIndex: 0,
      completedAt: undefined,
      skippedAt: undefined
    },
    userId
  );
}

export function shouldShowAutoOnboarding(userId?: string): boolean {
  const state = getOnboardingState(userId);
  return state.status === 'not_started';
}
