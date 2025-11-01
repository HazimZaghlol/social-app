import mongoose, { FilterQuery, Model, ProjectionType, QueryOptions } from "mongoose";

export abstract class BaseRepository<T> {
  constructor(private model: Model<T>) {}

  async createNewDocument(document: Partial<T>): Promise<T> {
    return await this.model.create(document);
  }

  async findOneDocument(filters: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T | null> {
    return await this.model.findOne(filters, projection, options);
  }

  async findDocumentsByFilter(filters: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T[]> {
    return await this.model.find(filters, projection, options);
  }

  async findManyDocuments(ids: mongoose.Types.ObjectId[], projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T[]> {
    return await this.model.find({ _id: { $in: ids } }, projection, options);
  }

  async updateOneDocument(filters: FilterQuery<T>, update: Partial<T>, options: QueryOptions<T> = { new: true }): Promise<T | null> {
    return await this.model.findOneAndUpdate(filters, update, options);
  }

  async findDocumentById(id: mongoose.Types.ObjectId, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T | null> {
    return await this.model.findById(id, projection, options);
  }

  async deleteOneDocument(filters: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOneAndDelete(filters);
  }

  async deleteManyDocuments(filters: FilterQuery<T>): Promise<{ deletedCount?: number }> {
    return await this.model.deleteMany(filters);
  }

  async deleteDocumentById(id: mongoose.Types.ObjectId): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }
}
