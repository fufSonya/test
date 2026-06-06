import supabase from "./supabase.js";

export class BaseApiService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  _logError(error) {
    console.error(`[${this.tableName}]`, error);
    return null;
  }

  async getAll() {
    const { data, error } = await supabase.from(this.tableName).select("*");
    if (error) return this._logError(error);
    return data;
  }

  async create(row) {
    const { data, error } = await supabase.from(this.tableName).insert([row]);
    if (error) return this._logError(error);
    return data;
  }

  async update(id, updates) {
    const { data, error } = await supabase.from(this.tableName).update(updates).eq("id", id);
    if (error) return this._logError(error);
    return data;
  }

  async remove(id) {
    const { error } = await supabase.from(this.tableName).delete().eq("id", id);
    if (error) {
      this._logError(error);
      return false;
    }
    return true;
  }
}
