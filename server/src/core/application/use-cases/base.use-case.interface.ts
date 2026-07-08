/**
 * @file base.use-case.interface.ts
 * @layer Application
 *
 * Generic interface for all Use Cases (Interactors).
 * Every concrete use case must implement this interface.
 *
 * Rules:
 * - NO imports from Infrastructure or Presentation layers.
 * - Use cases depend only on repository INTERFACES (defined in Domain).
 * - TInput = the DTO/command coming in; TOutput = the result going out.
 */

export interface IUseCase<TInput, TOutput> {
  /**
   * Executes the use case.
   * @param input - Input DTO or command object
   * @returns Promise resolving to the output DTO
   */
  execute(input: TInput): Promise<TOutput>;
}

/**
 * A use case with no input (e.g., "get all config")
 */
export interface IUseCaseNoInput<TOutput> {
  execute(): Promise<TOutput>;
}

/**
 * A use case with no output (e.g., "send notification")
 */
export interface IUseCaseNoOutput<TInput> {
  execute(input: TInput): Promise<void>;
}
