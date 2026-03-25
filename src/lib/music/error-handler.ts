export type GenerationErrorCategory = 'SAFETY' | 'CREDITS' | 'VENDOR' | 'SYSTEM' | 'INPUT';

export interface UnifiedGenerationError {
  success: false;
  category: GenerationErrorCategory;
  error: string;
  code?: number;
  details?: any;
}

/**
 * Maps technical vendor codes and system errors to human-readable categories
 * and authentic American English messages.
 */
export function mapGenerationError(
  input: { success: false; error: string; statusCode?: number; details?: any } | Error | any
): UnifiedGenerationError {
  let code: number | undefined;
  let originalMessage = '';
  let details: any;

  if (input instanceof Error) {
    originalMessage = input.message;
  } else {
    code = input.statusCode || input.code;
    originalMessage = input.error || input.message || String(input);
    details = input.details;
  }

  // 1. SAFETY (Content Filtering)
  if (
    code === 2013 ||
    originalMessage.toLowerCase().includes('sensitive') ||
    originalMessage.toLowerCase().includes('content safety')
  ) {
    return {
      success: false,
      category: 'SAFETY',
      error:
        'Content Safety Alert: We’re unable to generate music with sensitive, controversial, or prohibited lyrics. Please keep it clean and try again!',
      code,
      details,
    };
  }

  // 2. CREDITS (Insufficient Balance)
  if (code === 1010 || code === 402 || /credit|balance|insufficient|refuel/i.test(originalMessage)) {
    const isTokenBudgetIssue = /max_tokens|token|afford/i.test(originalMessage);
    return {
      success: false,
      category: 'CREDITS',
      error: isTokenBudgetIssue
        ? 'Generation budget exceeded: the upstream model was asked for more output tokens than your current OpenRouter key can afford. Lower the output cap or raise the OpenRouter daily limit and try again.'
        : "Refuel Required: You've run out of credits for this generation. Please top up your account to keep the music flowing!",
      code,
      details,
    };
  }

  // 3. VENDOR / RATE LIMIT (Upstream availability)
  if (code === 429 || /rate limit|too many|retry after/i.test(originalMessage)) {
    return {
      success: false,
      category: 'VENDOR',
      error:
        "Taking a Breather: You're moving faster than our AI can keep up with! Please take a quick 30-second break and try again.",
      code,
      details,
    };
  }

  if (
    code === 1000 ||
    code === 1001 ||
    code === 2001 ||
    /busy|overload|maintenance|unavailable/i.test(originalMessage)
  ) {
    return {
      success: false,
      category: 'VENDOR',
      error:
        "Studio's Packed: Our AI servers are currently at capacity or undergoing maintenance. Please give it a minute and try again!",
      code,
      details,
    };
  }

  // 4. INPUT (User Parameter Validation)
  if (code === 400 || /invalid|missing|required|too short/i.test(originalMessage)) {
    return {
      success: false,
      category: 'INPUT',
      error:
        'Check Your Gears: Something looks off with your inputs. Please double-check your lyrics or style prompts and try again.',
      code,
      details,
    };
  }

  // 5. SYSTEM (Default Catch-all)
  return {
    success: false,
    category: 'SYSTEM',
    error:
      originalMessage ||
      `System Glitch: We hit an unexpected snag (Code: ${code || 'Unknown'}). Please refresh or try again!`,
    code,
    details,
  };
}
