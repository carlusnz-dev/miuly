export abstract class BaseContract<TInput, TOutput> {
  abstract parse(input: unknown): TInput;

  abstract present(output: TOutput): unknown;
}
