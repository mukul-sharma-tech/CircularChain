import { Listing, IListing } from '../../models';
import dbConnect from '../dbConnect';

export class ListingService {
  static async create(listingData: Partial<IListing>): Promise<IListing> {
    await dbConnect();
    const listing = new Listing(listingData);
    return listing.save();
  }

  static async findById(listingId: number): Promise<IListing | null> {
    await dbConnect();
    return Listing.findOne({ listingId });
  }

  static async findActive(): Promise<IListing[]> {
    await dbConnect();
    return Listing.find({ isActive: true, quantityAvailable: { $gt: 0 } })
      .sort({ createdAt: -1 });
  }

  static async findBySeller(sellerAddress: string): Promise<IListing[]> {
    await dbConnect();
    return Listing.find({
      seller: sellerAddress.toLowerCase(),
      isActive: true
    }).sort({ createdAt: -1 });
  }

  static async search(query: string, filters?: {
    category?: string;
    materialType?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<IListing[]> {
    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchQuery: Record<string, any> = {
      isActive: true,
      quantityAvailable: { $gt: 0 }
    };

    // Text search
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { companyName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Filters
    if (filters?.category) {
      searchQuery.category = filters.category;
    }
    if (filters?.materialType) {
      searchQuery.materialType = filters.materialType;
    }
    if (filters?.location) {
      searchQuery.location = { $regex: filters.location, $options: 'i' };
    }
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      searchQuery.pricePerUnit = {};
      if (filters.minPrice !== undefined) {
        searchQuery.pricePerUnit.$gte = filters.minPrice.toString();
      }
      if (filters.maxPrice !== undefined) {
        searchQuery.pricePerUnit.$lte = filters.maxPrice.toString();
      }
    }

    return Listing.find(searchQuery).sort({ createdAt: -1 });
  }

  static async updateQuantity(listingId: number, quantitySold: number): Promise<IListing | null> {
    await dbConnect();
    return Listing.findOneAndUpdate(
      { listingId },
      {
        $inc: { quantitySold },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async deactivate(listingId: number): Promise<IListing | null> {
    await dbConnect();
    return Listing.findOneAndUpdate(
      { listingId },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
  }

  static async getCategories(): Promise<string[]> {
    await dbConnect();
    const categories = await Listing.distinct('category', { isActive: true });
    return categories.filter(Boolean);
  }

  static async getMaterialTypes(): Promise<string[]> {
    await dbConnect();
    const materialTypes = await Listing.distinct('materialType', { isActive: true });
    return materialTypes.filter(Boolean);
  }

  static async getLocations(): Promise<string[]> {
    await dbConnect();
    const locations = await Listing.distinct('location', { isActive: true });
    return locations.filter(Boolean);
  }

  static async getStats(): Promise<{
    total: number;
    active: number;
    totalQuantity: number;
    totalValue: number;
  }> {
    await dbConnect();
    const stats = await Listing.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalQuantity: { $sum: '$quantityAvailable' },
          totalValue: {
            $sum: {
              $multiply: [
                { $toDouble: '$pricePerUnit' },
                '$quantityAvailable'
              ]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      active: 0,
      totalQuantity: 0,
      totalValue: 0
    };
  }
}