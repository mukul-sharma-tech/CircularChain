import { NextRequest, NextResponse } from 'next/server';
import { ListingService } from '@/lib/services/listingService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get('listingId');
    const name = searchParams.get('name');
    const limit = parseInt(searchParams.get('limit') || '4');

    console.log('=== SIMILAR LISTINGS REQUEST ===');
    console.log('Current listing ID:', listingId);
    console.log('Current listing name:', name);

    if (!listingId || !name) {
      return NextResponse.json(
        { error: 'listingId and name are required' },
        { status: 400 }
      );
    }

    // Get all active listings
    const allListings = await ListingService.findActive();
    console.log('Total active listings found:', allListings.length);
    console.log('All listing names:', allListings.map(l => `${l.listingId}: ${l.name}`));

    if (allListings.length === 0) {
      console.log('No active listings in database');
      return NextResponse.json({ similar: [] });
    }

    // Simple word-based matching
    const currentNameLower = name.toLowerCase();
    const currentWords = currentNameLower.split(/[\s,\-_]+/).filter(w => w.length > 2);
    
    console.log('Current listing words:', currentWords);

    const scoredListings = allListings
      .filter(listing => listing.listingId !== parseInt(listingId))
      .map(listing => {
        const listingNameLower = listing.name.toLowerCase();
        const listingWords = listingNameLower.split(/[\s,\-_]+/).filter(w => w.length > 2);
        
        let score = 0;
        
        // Check for exact word matches (highest priority)
        currentWords.forEach(word => {
          if (listingWords.includes(word)) {
            score += 10;
            console.log(`Exact match: "${word}" in "${listing.name}"`);
          }
        });
        
        // Check if any word from current listing appears as substring in the other listing
        currentWords.forEach(word => {
          if (listingNameLower.includes(word) && !listingWords.includes(word)) {
            score += 5;
            console.log(`Substring match: "${word}" in "${listing.name}"`);
          }
        });

        // Check for partial matches (e.g., "wood" matches "wooden")
        listingWords.forEach(listingWord => {
          currentWords.forEach(currentWord => {
            if (listingWord.includes(currentWord) || currentWord.includes(listingWord)) {
              if (listingWord !== currentWord) {
                score += 3;
                console.log(`Partial match: "${currentWord}" ~ "${listingWord}" in "${listing.name}"`);
              }
            }
          });
        });
        
        console.log(`Listing "${listing.name}" scored: ${score}`);
        
        return { listing, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log('Final similar listings:', scoredListings.map(s => `${s.listing.name} (score: ${s.score})`));

    return NextResponse.json({ 
      similar: scoredListings.map(item => item.listing)
    });
  } catch (error) {
    console.error('Error fetching similar listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch similar listings', details: String(error) },
      { status: 500 }
    );
  }
}
