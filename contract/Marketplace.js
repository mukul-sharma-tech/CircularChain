// // const { expect } = require("chai");
// // const { ethers } = require("hardhat");

// // describe("Marketplace", function () {
// //   let Marketplace, marketplace;
// //   let owner, seller, buyer, deliveryAgent;

// //   beforeEach(async function () {
// //     [owner, seller, buyer, deliveryAgent] = await ethers.getSigners();

// //     Marketplace = await ethers.getContractFactory("Marketplace");
// //     marketplace = await Marketplace.deploy();
// //     await marketplace.waitForDeployment(); // <-- use this in ethers v6
// //   });

// //   it("Should deploy with correct owner", async function () {
// //     expect(await marketplace.owner()).to.equal(owner.address);
// //   });

// //   it("Seller can list an item", async function () {
// //     await expect(
// //       marketplace.connect(seller).listItem("Laptop", "TechCorp", ethers.parseEther("1"), 5)
// //     )
// //       .to.emit(marketplace, "ItemListed")
// //       .withArgs(1, "Laptop", "TechCorp", ethers.parseEther("1"), 5, seller.address);

// //     const item = await marketplace.items(1);
// //     expect(item.name).to.equal("Laptop");
// //     expect(item.companyName).to.equal("TechCorp");
// //     expect(item.price).to.equal(ethers.parseEther("1"));
// //     expect(item.quantityAvailable).to.equal(5);
// //     expect(item.status).to.equal(0); // AVAILABLE
// //   });

// //   it("Buyer can purchase an item", async function () {
// //     await marketplace.connect(seller).listItem("Laptop", "TechCorp", ethers.parseEther("1"), 5);

// //     await expect(
// //       marketplace.connect(buyer).buyItem(
// //         1,
// //         deliveryAgent.address,
// //         "Alice",
// //         "BuyerCorp",
// //         { value: ethers.parseEther("1") }
// //       )
// //     )
// //       .to.emit(marketplace, "ItemPurchased")
// //       .withArgs(1, buyer.address, "Alice", "BuyerCorp", deliveryAgent.address);

// //     const item = await marketplace.items(1);
// //     expect(item.status).to.equal(1); // LOCKED
// //     expect(item.buyer).to.equal(buyer.address);
// //     expect(item.quantityAvailable).to.equal(4);
// //   });

// //   it("Delivery agent can confirm delivery", async function () {
// //     await marketplace.connect(seller).listItem("Laptop", "TechCorp", ethers.parseEther("1"), 5);
// //     await marketplace.connect(buyer).buyItem(
// //       1,
// //       deliveryAgent.address,
// //       "Alice",
// //       "BuyerCorp",
// //       { value: ethers.parseEther("1") }
// //     );

// //     const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
// //     const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

// //     const tx = await marketplace.connect(deliveryAgent).confirmDelivery(1);
// //     await tx.wait();

// //     const item = await marketplace.items(1);
// //     expect(item.status).to.equal(2); // SOLD

// //     const fee = ethers.parseEther("1") * 15n / 1000n; // 1.5%
// //     const sellerAmount = ethers.parseEther("1") - fee;

// //     const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
// //     const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

// //     expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount);
// //     expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(fee);
// //   });

// //   it("Delivery agent can refund buyer", async function () {
// //     await marketplace.connect(seller).listItem("Laptop", "TechCorp", ethers.parseEther("1"), 5);
// //     await marketplace.connect(buyer).buyItem(
// //       1,
// //       deliveryAgent.address,
// //       "Alice",
// //       "BuyerCorp",
// //       { value: ethers.parseEther("1") }
// //     );

// //     const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

// //     const tx = await marketplace.connect(deliveryAgent).refundBuyer(1);
// //     const receipt = await tx.wait();

// //     const gasUsed = receipt.gasUsed * receipt.gasPrice;

// //     const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
// //     const item = await marketplace.items(1);

// //     expect(item.status).to.equal(3); // REFUNDED
// //     expect(buyerBalanceAfter).to.be.closeTo(
// //       buyerBalanceBefore + ethers.parseEther("1"),
// //       ethers.parseEther("0.001") // allow gas differences
// //     );
// //   });
// // });


// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("Deliver Marketplace Contract", function () {
//   let Deliver;
//   let contract;
//   let owner, seller, buyer, agent, localAgent;
  
//   // Constants for fees (Basis Points: 20 = 2%, 50 = 5%)
//   // Note: In your contract ADMIN_FEE_BP = 20 (denominator 1000)
//   // 20/1000 = 2%. 50/1000 = 5%.
//   const ADMIN_FEE_BP = 20n;
//   const AGENT_FEE_BP = 50n;
  
//   // Enums matching the Smart Contract
//   const OrderStatus = { AWAITING_AGENT: 0, AWAITING_DELIVERY: 1, COMPLETE: 2, REFUNDED: 3 };
//   const PaymentMethod = { ETH: 0, FIAT: 1 };

//   // Helper to parse ETH values
//   const toWei = (num) => ethers.parseEther(num.toString());

//   beforeEach(async function () {
//     // 1. Get Signers
//     [owner, seller, buyer, agent, localAgent] = await ethers.getSigners();

//     // 2. Deploy Contract
//     // IMPORTANT: Make sure the name inside getContractFactory matches "contract Deliver" in your .sol file
//     const ContractFactory = await ethers.getContractFactory("MarketUpdated");
//     contract = await ContractFactory.deploy();
//     await contract.waitForDeployment();
//   });

//   describe("1. Listings & Orders", function () {
//     it("Should create a listing successfully", async function () {
//       const price = toWei(1);
//       const quantity = 10;
//       const dataHash = "ipfs_hash_123";

//       await expect(contract.connect(seller).createListing("Item A", "Company A", price, quantity, dataHash))
//         .to.emit(contract, "ListingCreated")
//         .withArgs(1, "Item A", price, quantity, seller.address, dataHash);
      
//       const listing = await contract.listings(1);
//       expect(listing.seller).to.equal(seller.address);
//       expect(listing.pricePerUnit).to.equal(price);
//     });

//     it("Should allow a user to buy with ETH", async function () {
//       // Create Listing
//       await contract.connect(seller).createListing("Item B", "Co B", toWei(1), 10, "hash");

//       const qty = 2;
//       const totalCost = toWei(2); // 1 ETH * 2

//       // Create Order (Method: ETH)
//       await expect(contract.connect(buyer).createOrder(
//         1, 
//         qty, 
//         "Buyer Name", 
//         "Buyer Co", 
//         PaymentMethod.ETH, 
//         ethers.ZeroAddress, // No Fiat Buyer needed
//         { value: totalCost }
//       ))
//         .to.emit(contract, "OrderCreated")
//         .withArgs(1, 1, qty, buyer.address, totalCost, PaymentMethod.ETH);

//       const order = await contract.orders(1);
//       expect(order.buyer).to.equal(buyer.address);
//       expect(order.status).to.equal(OrderStatus.AWAITING_AGENT);
//     });

//     it("Should allow Admin (Relayer) to create a Fiat Order", async function () {
//         await contract.connect(seller).createListing("Item Fiat", "Co C", toWei(1), 10, "hash");
  
//         // Create Order (Method: FIAT) - Only Admin can call
//         await expect(contract.connect(owner).createOrder(
//           1, 
//           1, 
//           "Stripe User", 
//           "Stripe Co", 
//           PaymentMethod.FIAT, 
//           buyer.address, // The fiat buyer address (wallet or placeholder)
//           // No msg.value sent
//         ))
//           .to.emit(contract, "OrderCreated")
//           .withArgs(1, 1, 1, buyer.address, toWei(1), PaymentMethod.FIAT);
        
//         const order = await contract.orders(1);
//         expect(order.paymentMethod).to.equal(PaymentMethod.FIAT);
//     });
//   });

//   describe("2. Agent & Delivery Logic", function () {
//     const price = toWei(10); 

//     beforeEach(async function () {
//         // Setup: Seller lists item for 10 ETH
//         await contract.connect(seller).createListing("Heavy Load", "Co", price, 5, "hash");
//         await contract.connect(buyer).createOrder(1, 1, "Buyer", "Co", PaymentMethod.ETH, ethers.ZeroAddress, { value: price });
//     });

//     it("Scenario A: Platform Agent (5% Fee)", async function () {
//         // 1. Assign Agent (isLocal = false)
//         await contract.connect(seller).assignAgent(1, agent.address, false);

//         // 2. Agent Confirms
//         await contract.connect(agent).agentConfirmDelivery(1);

//         // Capture balances before completion
//         const adminPre = await ethers.provider.getBalance(owner.address);
//         const agentPre = await ethers.provider.getBalance(agent.address);
//         const sellerPre = await ethers.provider.getBalance(seller.address);

//         // 3. Buyer Confirms (Triggers Payout)
//         await contract.connect(buyer).buyerConfirmDelivery(1);

//         // Capture balances after
//         const adminPost = await ethers.provider.getBalance(owner.address);
//         const agentPost = await ethers.provider.getBalance(agent.address);
//         const sellerPost = await ethers.provider.getBalance(seller.address);

//         // Math Check:
//         // Total: 10 ETH
//         // Admin (2%): 0.2 ETH
//         // Agent (5%): 0.5 ETH
//         // Seller (93%): 9.3 ETH

//         expect(adminPost - adminPre).to.equal(toWei(0.2));
//         expect(agentPost - agentPre).to.equal(toWei(0.5));
//         expect(sellerPost - sellerPre).to.equal(toWei(9.3));
//     });

//     it("Scenario B: Local Agent (0% Fee)", async function () {
//         // 1. Assign Agent (isLocal = true)
//         await contract.connect(seller).assignAgent(1, localAgent.address, true);

//         // 2. Agent Confirms
//         await contract.connect(localAgent).agentConfirmDelivery(1);

//         const adminPre = await ethers.provider.getBalance(owner.address);
//         const agentPre = await ethers.provider.getBalance(localAgent.address);
//         const sellerPre = await ethers.provider.getBalance(seller.address);

//         // 3. Buyer Confirms
//         await contract.connect(buyer).buyerConfirmDelivery(1);

//         const adminPost = await ethers.provider.getBalance(owner.address);
//         const agentPost = await ethers.provider.getBalance(localAgent.address);
//         const sellerPost = await ethers.provider.getBalance(seller.address);

//         // Math Check:
//         // Admin (2%): 0.2 ETH
//         // Agent (0%): 0 ETH (Paid offline)
//         // Seller (98%): 9.8 ETH

//         expect(adminPost - adminPre).to.equal(toWei(0.2));
//         expect(agentPost - agentPre).to.equal(0n); // No change
//         expect(sellerPost - sellerPre).to.equal(toWei(9.8));
//     });
//   });
// });

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MarketWaste Marketplace", function () {
  let MarketWaste, marketWaste;
  let owner, seller, buyer, agent, other;

  beforeEach(async function () {
    [owner, seller, buyer, agent, other] = await ethers.getSigners();

    MarketWaste = await ethers.getContractFactory("MarketWaste");
    marketWaste = await MarketWaste.deploy();
    await marketWaste.deployed();
  });

  it("Should create a waste listing", async function () {
    await marketWaste.connect(seller).createListing(
      "Steel Slag",
      "Industrial steel waste",
      ethers.parseEther("1"),
      100,
      "hash123"
    );

    const listing = await marketWaste.listings(1);
    expect(listing.name).to.equal("Steel Slag");
    expect(listing.quantityAvailable).to.equal(100);
    expect(listing.seller).to.equal(seller.address);
  });

  it("Should allow buyer to create order with escrow", async function () {
    await marketWaste.connect(seller).createListing(
      "Plastic Scrap",
      "Recyclable plastic",
      ethers.parseEther("1"),
      50,
      "hash456"
    );

    await marketWaste.connect(buyer).createOrder(
      1,
      10,
      "Buyer Name",
      "Buyer Company",
      0, // PaymentMethod.ETH
      ethers.ZeroAddress,
      { value: ethers.parseEther("10") }
    );

    const order = await marketWaste.orders(1);
    expect(order.buyer).to.equal(buyer.address);
    expect(order.totalAmount).to.equal(ethers.parseEther("10"));
  });

  it("Should assign and accept delivery agent", async function () {
    await marketWaste.connect(seller).createListing(
      "E-waste",
      "Old electronics",
      ethers.parseEther("2"),
      20,
      "hash789"
    );

    await marketWaste.connect(buyer).createOrder(
      1,
      5,
      "Buyer Name",
      "Buyer Company",
      0,
      ethers.ZeroAddress,
      { value: ethers.parseEther("10") }
    );

    // Seller assigns agent
    await marketWaste.connect(seller).assignAgent(1, agent.address, false);

    const order = await marketWaste.orders(1);
    expect(order.deliveryAgent).to.equal(agent.address);
    expect(order.status).to.equal(1); // AWAITING_DELIVERY
  });

  it("Should complete full delivery lifecycle", async function () {
    await marketWaste.connect(seller).createListing(
      "Rubber Waste",
      "Factory scrap",
      ethers.parseEther("1"),
      100,
      "hash999"
    );

    await marketWaste.connect(buyer).createOrder(
      1,
      10,
      "Buyer Name",
      "Buyer Company",
      0,
      ethers.ZeroAddress,
      { value: ethers.parseEther("10") }
    );

    await marketWaste.connect(seller).assignAgent(1, agent.address, false);

    await marketWaste.connect(agent).agentConfirmDelivery(1);
    await marketWaste.connect(buyer).buyerConfirmDelivery(1);

    const order = await marketWaste.orders(1);
    expect(order.status).to.equal(2); // COMPLETE
    expect(order.deliveryStatus).to.equal(3); // Delivered
  });

  it("Should allow buyer to rate & review after delivery", async function () {
    await marketWaste.connect(seller).createListing(
      "Metal Scrap",
      "Reusable metal",
      ethers.parseEther("1"),
      50,
      "hash111"
    );

    await marketWaste.connect(buyer).createOrder(
      1,
      50,
      "Buyer Name",
      "Buyer Company",
      0,
      ethers.ZeroAddress,
      { value: ethers.parseEther("50") }
    );

    await marketWaste.connect(seller).assignAgent(1, agent.address, false);

    await marketWaste.connect(agent).agentConfirmDelivery(1);
    await marketWaste.connect(buyer).buyerConfirmDelivery(1);

    await marketWaste.connect(buyer).submitReview(1, 5, "Excellent quality!");

    const reviews = await marketWaste.getListingReviews(1);
    expect(reviews.length).to.equal(1);
    expect(reviews[0].rating).to.equal(5);
    expect(reviews[0].review).to.equal("Excellent quality!");
  });

  it("Should NOT allow duplicate reviews", async function () {
    await marketWaste.connect(seller).createListing(
      "Paper Waste",
      "Recycled paper",
      ethers.parseEther("1"),
      100,
      "hash222"
    );

    await marketWaste.connect(buyer).createOrder(
      1,
      10,
      "Buyer Name",
      "Buyer Company",
      0,
      ethers.ZeroAddress,
      { value: ethers.parseEther("10") }
    );

    await marketWaste.connect(seller).assignAgent(1, agent.address, false);

    await marketWaste.connect(agent).agentConfirmDelivery(1);
    await marketWaste.connect(buyer).buyerConfirmDelivery(1);

    await marketWaste.connect(buyer).submitReview(1, 5, "Good");

    await expect(
      marketWaste.connect(buyer).submitReview(1, 4, "Second review")
    ).to.be.revertedWith("Already reviewed");
  });

  it("Should NOT allow seller to review own listing", async function () {
    await marketWaste.connect(seller).createListing(
      "Glass Waste",
      "Broken glass",
      ethers.parseEther("1"),
      30,
      "hash333"
    );

    await marketWaste.connect(buyer).createOrder(
      1,
      10,
      "Buyer Name",
      "Buyer Company",
      0,
      ethers.ZeroAddress,
      { value: ethers.parseEther("10") }
    );

    await marketWaste.connect(seller).assignAgent(1, agent.address, false);

    await marketWaste.connect(agent).agentConfirmDelivery(1);
    await marketWaste.connect(buyer).buyerConfirmDelivery(1);

    await expect(
      marketWaste.connect(seller).submitReview(1, 5, "Self review")
    ).to.be.revertedWith("Only buyer can review");
  });
});
