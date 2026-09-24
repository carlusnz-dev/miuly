export abstract class BaseRepository<TDatabase> {
  constructor(private readonly database: TDatabase) {}

  protected get db(): TDatabase {
    return this.database;
  }
}
