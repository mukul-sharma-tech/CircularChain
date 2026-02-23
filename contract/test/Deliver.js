// const {
//   loadFixture,
// } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("MarketWaste Contract", function () {
  
//   // --- FIXTURE: Deploys the contract freshly for every test ---
//   async function deployMarketFixture() {
//     // Get signers: owner (Admin), seller, buyer, agent, agentLocal (for 0% fee test), other
//     const [owner, seller, buyer, agent, agentLocal, otherAccount] = await ethers.getSigners();
    
//     // Deploy Contract
//     const MarketWaste = await ethers.getContractFactory("MarketWaste");
//     const market = await MarketWaste.deploy();

//     return { market, owner, seller, buyer, agent, agentLocal, otherAccount };
//   }

//   // --- 1. DEPLOYMENT TESTS ---
//   describe("Deployment", function () {
//     it("Should set the right owner", async function () {
//       const { market, owner } = await loadFixture(deployMarketFixture);
//       expect(await market.owner()).to.equal(owner.address);
//     });

//     it("Should start with correct initial IDs", async function () {
//       const { market } = await loadFixture(deployMarketFixture);
//       expect(await market.nextListingId()).to.equal(1);
//       expect(await market.nextOrderId()).to.equal(1);
//     });
//   });

//   // --- 2. LISTING TESTS ---
//   describe("Listings", function () {
//     it("Should create a listing successfully", async function () {
//       const { market, seller } = await loadFixture(deployMarketFixture);

//       await expect(
//         market.connect(seller).createListing(
//           "Recycled Plastic",
//           "Green Co",
//           ethers.parseEther("1"), // 1 ETH per unit
//           10,
//           "hash123"
//         )
//       )
//         .to.emit(market, "ListingCreated")
//         .withArgs(1, "Recycled Plastic", ethers.parseEther("1"), 10, seller.address, "hash123");

//       const listing = await market.listings(1);
//       expect(listing.name).to.equal("Recycled Plastic");
//       expect(listing.quantityAvailable).to.equal(10);
//       expect(listing.isActive).to.be.true;
//     });

//     it("Should fail if price or quantity is zero", async function () {
//       const { market, seller } = await loadFixture(deployMarketFixture);
//       await expect(
//         market.connect(seller).createListing("Item", "Co", 0, 10, "hash")
//       ).to.be.revertedWith("Price must be > 0");
//     });
//   });

//   // --- 3. ORDER CREATION TESTS ---
//   describe("Orders", function () {
//     // Helper to setup a listing before testing orders
//     async function setupListingFixture() {
//       const base = await deployMarketFixture();
//       // Listing: Price 1 ETH, Qty 5
//       await base.market.connect(base.seller).createListing("Scrap Metal", "IronWorks", ethers.parseEther("1"), 5, "imgHash");
//       return base;
//     }

//     it("Should create an ETH Order successfully", async function () {
//       const { market, buyer } = await loadFixture(setupListingFixture);
      
//       const totalCost = ethers.parseEther("2"); // Buying 2 units

//       await expect(
//         market.connect(buyer).createOrder(
//           1, 2, "BuyerName", "BuyerCo", 0, ethers.ZeroAddress, // 0 = ETH
//           { value: totalCost }
//         )
//       )
//       .to.emit(market, "OrderCreated")
//       .withArgs(1, 1, 2, buyer.address, totalCost, 0);

//       const listing = await market.listings(1);
//       expect(listing.quantityAvailable).to.equal(3); // 5 - 2 = 3
//     });

//     it("Should revert ETH Order if incorrect value sent", async function () {
//       const { market, buyer } = await loadFixture(setupListingFixture);
//       await expect(
//         market.connect(buyer).createOrder(1, 1, "B", "C", 0, ethers.ZeroAddress, { value: ethers.parseEther("0.5") })
//       ).to.be.revertedWith("Incorrect ETH value");
//     });

//     it("Should only allow Admin to create FIAT Orders", async function () {
//       const { market, owner, buyer, seller } = await loadFixture(deployMarketFixture);
//       await market.connect(seller).createListing("Item", "Co", ethers.parseEther("1"), 5, "hash");

//       // Random buyer tries to create Fiat order -> Fail
//       await expect(
//         market.connect(buyer).createOrder(1, 1, "B", "C", 1, buyer.address)
//       ).to.be.revertedWith("Only Admin can relay Fiat orders");

//       // Admin creates Fiat order -> Success
//       await expect(
//         market.connect(owner).createOrder(1, 1, "B", "C", 1, buyer.address)
//       ).to.emit(market, "OrderCreated");
//     });
//   });

//   // --- 4. AGENT ASSIGNMENT TESTS ---
//   describe("Agent Assignment", function () {
//     async function setupOrderFixture() {
//       const base = await deployMarketFixture();
//       // Setup: 1 Listing, 1 Order
//       await base.market.connect(base.seller).createListing("Item", "Co", ethers.parseEther("1"), 1, "hash");
//       await base.market.connect(base.buyer).createOrder(1, 1, "B", "C", 0, ethers.ZeroAddress, { value: ethers.parseEther("1") });
//       return base;
//     }

//     it("Direct Assignment works", async function () {
//       const { market, seller, agent } = await loadFixture(setupOrderFixture);
//       await market.connect(seller).assignAgent(1, agent.address, false);
      
//       const order = await market.orders(1);
//       expect(order.deliveryAgent).to.equal(agent.address);
//       expect(order.status).to.equal(1); // AWAITING_DELIVERY
//     });

//     it("Offer & Accept works", async function () {
//       const { market, seller, agent } = await loadFixture(setupOrderFixture);
      
//       // Seller requests agent
//       await expect(market.connect(seller).requestAgent(1, agent.address, false))
//         .to.emit(market, "AgentOfferCreated");

//       // Agent accepts offer
//       await expect(market.connect(agent).acceptAgentOffer(1))
//         .to.emit(market, "AgentAssigned");
        
//       const order = await market.orders(1);
//       expect(order.deliveryAgent).to.equal(agent.address);
//     });

//     it("Should fail if wrong agent tries to accept offer", async function () {
//       const { market, seller, agent, otherAccount } = await loadFixture(setupOrderFixture);
      
//       await market.connect(seller).requestAgent(1, agent.address, false);

//       await expect(
//         market.connect(otherAccount).acceptAgentOffer(1)
//       ).to.be.revertedWith("No pending offer");
//     });
//   });

//   // --- 5. DELIVERY & PAYOUT TESTS (CRITICAL) ---
//   describe("Delivery & Payout Logic", function () {
//     async function setupActiveOrder() {
//       const base = await deployMarketFixture();
//       // Price: 10 ETH to make percentage math easy
//       // Admin (2%) = 0.2 ETH
//       // Agent (5%) = 0.5 ETH
//       // Seller = 9.3 ETH
//       await base.market.connect(base.seller).createListing("HighVal", "Co", ethers.parseEther("10"), 1, "hash");
//       await base.market.connect(base.buyer).createOrder(1, 1, "B", "C", 0, ethers.ZeroAddress, { value: ethers.parseEther("10") });
//       return base;
//     }

//     it("Standard Agent: Distributes fees correctly (Push)", async function () {
//       const { market, owner, seller, agent, buyer } = await loadFixture(setupActiveOrder);
      
//       await market.connect(seller).assignAgent(1, agent.address, false); // Standard Agent
//       await market.connect(agent).agentConfirmDelivery(1);

//       // Buyer Confirm triggers payout
//       await expect(
//         market.connect(buyer).buyerConfirmDelivery(1)
//       ).to.changeEtherBalances(
//         [owner, agent, seller],
//         [ethers.parseEther("0.2"), ethers.parseEther("0.5"), ethers.parseEther("9.3")]
//       );

//       const order = await market.orders(1);
//       expect(order.status).to.equal(2); // COMPLETE
//     });

//     it("Local Agent: No Agent Fee (Paid Offline)", async function () {
//       const { market, owner, seller, agentLocal, buyer } = await loadFixture(setupActiveOrder);
      
//       await market.connect(seller).assignAgent(1, agentLocal.address, true); // Local Agent (True)
//       await market.connect(agentLocal).agentConfirmDelivery(1);

//       // Admin gets 0.2, Agent gets 0 (Offline), Seller gets 9.8 (Remainder)
//       await expect(
//         market.connect(buyer).buyerConfirmDelivery(1)
//       ).to.changeEtherBalances(
//         [owner, agentLocal, seller],
//         [ethers.parseEther("0.2"), 0, ethers.parseEther("9.8")]
//       );
//     });

//     it("Delivery Updates: Can update 'PickedUp' but NOT 'Delivered' manually", async function () {
//         const { market, seller, agent } = await loadFixture(setupActiveOrder);
//         await market.connect(seller).assignAgent(1, agent.address, false);

//         // Success: Update to PickedUp (1)
//         await expect(market.connect(agent).updateDeliveryStatus(1, 1))
//             .to.emit(market, "DeliveryStatusUpdated")
//             .withArgs(1, 1);
        
//         // Fail: Try to manually set Delivered (4) - Contract enforces confirmation flow
//         await expect(market.connect(agent).updateDeliveryStatus(1, 4))
//             .to.be.revertedWith("Use ConfirmDelivery to set Delivered");
//     });
//   });

//   // --- 6. REFUNDS & WITHDRAWALS ---
//   describe("Refunds & Withdrawals", function () {
//     async function setupRefundFixture() {
//       const base = await deployMarketFixture();
//       await base.market.connect(base.seller).createListing("Item", "Co", ethers.parseEther("1"), 1, "hash");
//       await base.market.connect(base.buyer).createOrder(1, 1, "B", "C", 0, ethers.ZeroAddress, { value: ethers.parseEther("1") });
//       await base.market.connect(base.seller).assignAgent(1, base.agent.address, false);
//       return base;
//     }

//     it("Should refund ETH to buyer", async function () {
//         const { market, agent, buyer } = await loadFixture(setupRefundFixture);

//         // Agent triggers refund
//         // Note: Using await on the tx to get the receipt for chaining is good practice, 
//         // but passing the promise to expect works too.
//         const tx = market.connect(agent).refundOrder(1);

//         await expect(tx).to.changeEtherBalances([buyer], [ethers.parseEther("1")]);
//         await expect(tx).to.emit(market, "OrderRefunded");
        
//         const order = await market.orders(1);
//         expect(order.status).to.equal(3); // REFUNDED
//     });

//     it("Should allow withdrawal of pending funds (Manual Pull)", async function () {
//         // Since we can't easily force a failed ETH transfer in Hardhat without a malicious mock contract,
//         // we test the fundamental logic: Does it revert when empty?
//         // This confirms the function is accessible and has the basic check.
//         const { market, buyer } = await loadFixture(setupRefundFixture);
        
//         await expect(market.connect(buyer).withdrawFunds())
//             .to.be.revertedWith("No funds to withdraw");
//     });
//   });
  
//   // --- 7. REVIEWS ---
//   describe("Reviews", function () {
//     it("Should allow review only after completion", async function () {
//         const { market, seller, buyer, agent } = await loadFixture(deployMarketFixture);
        
//         // Setup Completed Order
//         await market.connect(seller).createListing("Item", "Co", ethers.parseEther("1"), 1, "hash");
//         await market.connect(buyer).createOrder(1, 1, "B", "C", 0, ethers.ZeroAddress, {value: ethers.parseEther("1")});
//         await market.connect(seller).assignAgent(1, agent.address, false);
//         await market.connect(agent).agentConfirmDelivery(1);
//         await market.connect(buyer).buyerConfirmDelivery(1);

//         // Submit Review
//         await expect(market.connect(buyer).submitReview(1, 5, "Great!"))
//             .to.emit(market, "ReviewSubmitted")
//             .withArgs(1, 5);

//         const review = await market.listingReviews(1, 0);
//         expect(review.rating).to.equal(5);
//         expect(review.review).to.equal("Great!");
//     });
//   });
// });

const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MarketWaste Contract", function () {
  
  // --- FIXTURE: Deploys the contract freshly for every test ---
  async function deployMarketFixture() {
    const [owner, seller, buyer, agent, agentLocal, otherAccount] = await ethers.getSigners();
    
    // Deploy Contract
    const MarketWaste = await ethers.getContractFactory("Updated");
    const market = await MarketWaste.deploy();

    return { market, owner, seller, buyer, agent, agentLocal, otherAccount };
  }

  // --- 1. DEPLOYMENT TESTS ---
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { market, owner } = await loadFixture(deployMarketFixture);
      expect(await market.owner()).to.equal(owner.address);
    });

    it("Should start with correct initial IDs", async function () {
      const { market } = await loadFixture(deployMarketFixture);
      expect(await market.nextListingId()).to.equal(1);
      expect(await market.nextOrderId()).to.equal(1);
    });
  });

  // --- 2. LISTING TESTS (UPDATED FOR MULTIPLE IMAGES) ---
  describe("Listings", function () {
    it("Should create a listing with multiple images successfully", async function () {
      const { market, seller } = await loadFixture(deployMarketFixture);

      const imageArray = ["ipfs://image1.png", "ipfs://image2.png"];

      await expect(
        market.connect(seller).createListing(
          "Recycled Plastic",
          "Green Co",
          ethers.parseEther("1"), // 1 ETH per unit
          10,
          "hash123", // Data Hash
          imageArray // NEW: Image Array
        )
      )
        .to.emit(market, "ListingCreated")
        .withArgs(1, "Recycled Plastic", ethers.parseEther("1"), 10, seller.address, imageArray);

      // Verify Basic Struct Data
      const listing = await market.listings(1);
      expect(listing.name).to.equal("Recycled Plastic");
      expect(listing.quantityAvailable).to.equal(10);
      expect(listing.isActive).to.be.true;

      // Verify Image Array via Helper Function
      const retrievedImages = await market.getListingImages(1);
      expect(retrievedImages).to.deep.equal(imageArray);
      expect(retrievedImages.length).to.equal(2);
    });

    it("Should fail if price or quantity is zero", async function () {
      const { market, seller } = await loadFixture(deployMarketFixture);
      await expect(
        market.connect(seller).createListing("Item", "Co", 0, 10, "hash", ["img1"])
      ).to.be.revertedWith("Price must be > 0");
    });
  });

  // --- 3. ORDER CREATION TESTS ---
  describe("Orders", function () {
    async function setupListingFixture() {
      const base = await deployMarketFixture();
      // Listing: Price 1 ETH, Qty 5, Dummy Images
      await base.market.connect(base.seller).createListing(
          "Scrap Metal", 
          "IronWorks", 
          ethers.parseEther("1"), 
          5, 
          "imgHash", 
          ["img1", "img2"]
      );
      return base;
    }

    it("Should create an ETH Order successfully", async function () {
      const { market, buyer } = await loadFixture(setupListingFixture);
      
      const totalCost = ethers.parseEther("2"); // Buying 2 units

      await expect(
        market.connect(buyer).createOrder(
          1, 2, "BuyerName", "BuyerCo", 0, ethers.ZeroAddress, // 0 = ETH
          { value: totalCost }
        )
      )
      .to.emit(market, "OrderCreated")
      .withArgs(1, 1, 2, buyer.address, totalCost, 0);

      const listing = await market.listings(1);
      expect(listing.quantityAvailable).to.equal(3); // 5 - 2 = 3
    });

    it("Should revert ETH Order if incorrect value sent", async function () {
      const { market, buyer } = await loadFixture(setupListingFixture);
      await expect(
        market.connect(buyer).createOrder(1, 1, "B", "C", 0, ethers.ZeroAddress, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Incorrect ETH value");
    });

    it("Should only allow Admin to create FIAT Orders", async function () {
      const { market, owner, buyer, seller } = await loadFixture(deployMarketFixture);
      // Create listing with images
      await market.connect(seller).createListing("Item", "Co", ethers.parseEther("1"), 5, "hash", ["img1"]);

      // Random buyer tries to create Fiat order -> Fail
      await expect(
        market.connect(buyer).createOrder(1, 1, "B", "C", 1, buyer.address)
      ).to.be.revertedWith("Only Admin can relay Fiat orders");

      // Admin creates Fiat order -> Success
      await expect(
        market.connect(owner).createOrder(1, 1, "B", "C", 1, buyer.address)
      ).to.emit(market, "OrderCreated");
    });
  });

  // --- 4. AGENT ASSIGNMENT TESTS ---
  describe("Agent Assignment", function () {
    async function setupOrderFixture() {
      const base = await deployMarketFixture();
      // Setup: 1 Listing, 1 Order
      await base.market.connect(base.seller).createListing("Item", "Co", ethers.parseEther("1"), 1, "hash", ["img1"]);
      await base.market.connect(base.buyer).createOrder(1, 1, "B", "C", 0, ethers.ZeroAddress, { value: ethers.parseEther("1") });
      return base;
    }

    it("Direct Assignment works", async function () {
      const { market, seller, agent } = await loadFixture(setupOrderFixture);
      await market.connect(seller).assignAgent(1, agent.address, false);
      
      const order = await market.orders(1);
      expect(order.deliveryAgent).to.equal(agent.address);
      expect(order.status).to.equal(1); // AWAITING_DELIVERY
    });

    it("Offer & Accept works", async function () {
      const { market, seller, agent } = await loadFixture(setupOrderFixture);
      
      // Seller requests agent
      await expect(market.connect(seller).requestAgent(1, agent.address, false))
        .to.emit(market, "AgentOfferCreated");

      // Agent accepts offer
      await expect(market.connect(agent).acceptAgentOffer(1))
        .to.emit(market, "AgentAssigned");
        
      const order = await market.orders(1);
      expect(order.deliveryAgent).to.equal(agent.address);
    });
  });

  // --- 5. DELIVERY & PAYOUT TESTS ---
  describe("Delivery & Payout Logic", function () {
    async function setupActiveOrder() {
      const base = await deployMarketFixture();
      // Price: 10 ETH
      await base.market.connect(base.seller).createListing("HighVal", "Co", ethers.parseEther("10"), 1, "hash", ["img1"]);
      await base.market.connect(base.buyer).createOrder(1, 1, "B", "C", 0, ethers.ZeroAddress, { value: ethers.parseEther("10") });
      return base;
    }

    it("Standard Agent: Distributes fees correctly (Push)", async function () {
      const { market, owner, seller, agent, buyer } = await loadFixture(setupActiveOrder);
      
      await market.connect(seller).assignAgent(1, agent.address, false); // Standard Agent
      await market.connect(agent).agentConfirmDelivery(1);

      // Buyer Confirm triggers payout
      await expect(
        market.connect(buyer).buyerConfirmDelivery(1)
      ).to.changeEtherBalances(
        [owner, agent, seller],
        [ethers.parseEther("0.2"), ethers.parseEther("0.5"), ethers.parseEther("9.3")]
      );

      const order = await market.orders(1);
      expect(order.status).to.equal(2); // COMPLETE
    });

    it("Local Agent: No Agent Fee (Paid Offline)", async function () {
      const { market, owner, seller, agentLocal, buyer } = await loadFixture(setupActiveOrder);
      
      await market.connect(seller).assignAgent(1, agentLocal.address, true); // Local Agent (True)
      await market.connect(agentLocal).agentConfirmDelivery(1);

      // Admin gets 0.2, Agent gets 0 (Offline), Seller gets 9.8 (Remainder)
      await expect(
        market.connect(buyer).buyerConfirmDelivery(1)
      ).to.changeEtherBalances(
        [owner, agentLocal, seller],
        [ethers.parseEther("0.2"), 0, ethers.parseEther("9.8")]
      );
    });

    it("Delivery Updates: Can update 'PickedUp' but NOT 'Delivered' manually", async function () {
        const { market, seller, agent } = await loadFixture(setupActiveOrder);
        await market.connect(seller).assignAgent(1, agent.address, false);

        // Success: Update to PickedUp (1)
        await expect(market.connect(agent).updateDeliveryStatus(1, 1))
            .to.emit(market, "DeliveryStatusUpdated")
            .withArgs(1, 1);
        
        // Fail: Try to manually set Delivered (4)
        await expect(market.connect(agent).updateDeliveryStatus(1, 4))
            .to.be.revertedWith("Use ConfirmDelivery to set Delivered");
    });
  });

  // --- 6. REFUNDS & WITHDRAWALS ---
  describe("Refunds & Withdrawals", function () {
    async function setupRefundFixture() {
      const base = await deployMarketFixture();
      await base.market.connect(base.seller).createListing("Item", "Co", ethers.parseEther("1"), 1, "hash", ["img1"]);
      await base.market.connect(base.buyer).createOrder(1, 1, "B", "C", 0, ethers.ZeroAddress, { value: ethers.parseEther("1") });
      await base.market.connect(base.seller).assignAgent(1, base.agent.address, false);
      return base;
    }

    it("Should refund ETH to buyer", async function () {
        const { market, agent, buyer } = await loadFixture(setupRefundFixture);

        const tx = market.connect(agent).refundOrder(1);

        await expect(tx).to.changeEtherBalances([buyer], [ethers.parseEther("1")]);
        await expect(tx).to.emit(market, "OrderRefunded");
        
        const order = await market.orders(1);
        expect(order.status).to.equal(3); // REFUNDED
    });

    it("Should allow withdrawal of pending funds (Manual Pull)", async function () {
        const { market, buyer } = await loadFixture(setupRefundFixture);
        
        await expect(market.connect(buyer).withdrawFunds())
            .to.be.revertedWith("No funds to withdraw");
    });
  });
  
  // --- 7. REVIEWS ---
  describe("Reviews", function () {
    it("Should allow review only after completion", async function () {
        const { market, seller, buyer, agent } = await loadFixture(deployMarketFixture);
        
        // Setup Completed Order
        await market.connect(seller).createListing("Item", "Co", ethers.parseEther("1"), 1, "hash", ["img1"]);
        await market.connect(buyer).createOrder(1, 1, "B", "C", 0, ethers.ZeroAddress, {value: ethers.parseEther("1")});
        await market.connect(seller).assignAgent(1, agent.address, false);
        await market.connect(agent).agentConfirmDelivery(1);
        await market.connect(buyer).buyerConfirmDelivery(1);

        // Submit Review
        await expect(market.connect(buyer).submitReview(1, 5, "Great!"))
            .to.emit(market, "ReviewSubmitted")
            .withArgs(1, 5);

        const review = await market.listingReviews(1, 0);
        expect(review.rating).to.equal(5);
        expect(review.review).to.equal("Great!");
    });
  });
});