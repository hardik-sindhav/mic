import { CustomAd } from '../models/CustomAd.js'

export async function listCustomAds() {
  return CustomAd.find().sort({ order: 1, createdAt: -1 }).lean()
}

export async function listActiveCustomAds() {
  return CustomAd.find({ enabled: true }).sort({ order: 1, createdAt: -1 }).lean()
}

export async function createCustomAd(payload) {
  const count = await CustomAd.countDocuments()
  const ad = await CustomAd.create({
    ...payload,
    order: count,
  })
  return ad.toObject()
}

export async function updateCustomAdById(id, payload) {
  const ad = await CustomAd.findByIdAndUpdate(id, payload, { new: true })
  return ad ? ad.toObject() : null
}

export async function deleteCustomAdById(id) {
  await CustomAd.findByIdAndDelete(id)
  return true
}

export async function updateCustomAdsOrder(idOrderArray) {
  const bulkOps = idOrderArray.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order: index } },
    },
  }))
  await CustomAd.bulkWrite(bulkOps)
  return listCustomAds()
}
