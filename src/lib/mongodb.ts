import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  const client = new MongoClient(uri);

  if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    clientPromise = client.connect();
  }
}

export const getMongoClient = () => clientPromise;
