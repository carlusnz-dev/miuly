export abstract class BaseController<TService> {
  constructor(private readonly serviceInstance: TService) {}

  protected get service(): TService {
    return this.serviceInstance;
  }
}
