export abstract class BaseRoutes<TController, TRouter> {
  constructor(private readonly controllerInstance: TController) {}

  protected get controller(): TController {
    return this.controllerInstance;
  }

  abstract register(router: TRouter): TRouter;
}
