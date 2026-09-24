export abstract class BaseService<TRepository> {
  constructor(private readonly repositoryInstance: TRepository) {}

  protected get repository(): TRepository {
    return this.repositoryInstance;
  }
}
