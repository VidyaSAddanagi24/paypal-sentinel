import dns from 'node:dns'
import mongoose from 'mongoose'

// Some networks block SRV lookups on their default DNS; use public resolvers instead.
dns.setServers(['8.8.8.8', '1.1.1.1'])

export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB connected')
}