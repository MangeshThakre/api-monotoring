class BaseIngestRepository {
  constructor(model) {
    if (!model) throw new Error("Model is required");
    this.model = model;
  }

  async create(data) {
    throw new Error("Method not implemented");
  }
}
