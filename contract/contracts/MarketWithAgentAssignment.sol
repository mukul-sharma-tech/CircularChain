// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MarketWithAgentAssignment {
    // --- STRUCTS (no change) ---
    struct Listing {
        uint256 id;
        string name;
        string companyName;
        uint256 pricePerUnit;
        uint256 quantityAvailable;
        address payable seller;
        bool isActive;
    }

    struct Order {
        uint256 id;
        uint256 listingId;
        uint256 quantity;
        uint256 totalAmount;
        address payable buyer;
        string buyerName;
        string buyerCompany;
        address payable deliveryAgent;
        bool agentConfirmed;
        bool buyerConfirmed;
        OrderStatus status;
    }

    // --- MODIFIED: Added AWAITING_AGENT status ---
    enum OrderStatus {
        AWAITING_AGENT, // NEW: Order is created, seller needs to assign an agent.
        AWAITING_DELIVERY,
        COMPLETE,
        REFUNDED
    }

    // --- STATE (no change) ---
    address payable public owner;
    uint256 public constant FEE_PERCENT = 15;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Order) public orders;
    uint256 public nextListingId = 1;
    uint256 public nextOrderId = 1;

    // --- EVENTS (Added AgentAssigned) ---
    event ListingCreated(uint256 id, string name, uint256 pricePerUnit, uint256 quantity, address seller);
    event OrderCreated(uint256 orderId, uint256 listingId, uint256 quantity, address buyer);
    event AgentAssigned(uint256 orderId, address agent); // NEW
    event AgentConfirmed(uint256 orderId, address agent);
    event BuyerConfirmed(uint256 orderId, address buyer);
    event DeliveryCompleted(uint256 orderId, address seller, uint256 sellerAmount, uint256 feeAmount);
    event OrderRefunded(uint256 orderId, address buyer, uint256 amount);

    constructor() {
        owner = payable(msg.sender);
    }

    // --- createListing is unchanged ---
    // --- SELLER FUNCTIONS ---
    function createListing(
        string memory _name,
        string memory _companyName,
        uint256 _pricePerUnit,
        uint256 _quantity
    ) public {
        require(_pricePerUnit > 0, "Price must be greater than zero");
        require(_quantity > 0, "Quantity must be at least 1");

        listings[nextListingId] = Listing({
            id: nextListingId,
            name: _name,
            companyName: _companyName,
            pricePerUnit: _pricePerUnit,
            quantityAvailable: _quantity,
            seller: payable(msg.sender),
            isActive: true
        });

        emit ListingCreated(nextListingId, _name, _pricePerUnit, _quantity, msg.sender);
        nextListingId++;
    }

    // --- MODIFIED: Buyer no longer provides an agent ---
    function createOrder(
        uint256 _listingId,
        uint256 _quantityToBuy,
        string memory _buyerName,
        string memory _buyerCompany
    ) public payable {
        Listing storage listing = listings[_listingId];

        require(listing.id != 0, "Listing does not exist.");
        require(listing.isActive, "Listing is not active.");
        require(listing.quantityAvailable >= _quantityToBuy, "Not enough stock.");
        
        uint256 totalAmount = listing.pricePerUnit * _quantityToBuy;
        require(msg.value == totalAmount, "Incorrect Ether value sent.");
        require(msg.sender != listing.seller, "Seller cannot buy own item.");

        listing.quantityAvailable -= _quantityToBuy;

        orders[nextOrderId] = Order({
            id: nextOrderId,
            listingId: _listingId,
            quantity: _quantityToBuy,
            totalAmount: totalAmount,
            buyer: payable(msg.sender),
            buyerName: _buyerName,
            buyerCompany: _buyerCompany,
            deliveryAgent: payable(address(0)), // Agent is initially NULL
            agentConfirmed: false,
            buyerConfirmed: false,
            status: OrderStatus.AWAITING_AGENT // NEW initial status
        });

        emit OrderCreated(nextOrderId, _listingId, _quantityToBuy, msg.sender);
        nextOrderId++;
    }

    // --- NEW: Function for the SELLER to assign an agent ---
    function assignAgent(uint256 _orderId, address payable _agentAddress) public {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];

        require(msg.sender == listing.seller, "Only the seller can assign an agent.");
        require(order.status == OrderStatus.AWAITING_AGENT, "An agent has already been assigned.");
        require(_agentAddress != address(0) && _agentAddress != order.buyer && _agentAddress != listing.seller, "Invalid agent address.");

        order.deliveryAgent = _agentAddress;
        order.status = OrderStatus.AWAITING_DELIVERY; // The order now proceeds to the delivery phase.

        emit AgentAssigned(_orderId, _agentAddress);
    }


    // --- CONFIRMATION SYSTEM ---
    function agentConfirmDelivery(uint256 _orderId) public {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.AWAITING_DELIVERY, "Order not active.");
        require(msg.sender == order.deliveryAgent, "Only delivery agent can confirm.");

        order.agentConfirmed = true;
        emit AgentConfirmed(_orderId, msg.sender);

        _tryCompleteOrder(_orderId);
    }

    function buyerConfirmDelivery(uint256 _orderId) public {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.AWAITING_DELIVERY, "Order not active.");
        require(msg.sender == order.buyer, "Only buyer can confirm.");

        order.buyerConfirmed = true;
        emit BuyerConfirmed(_orderId, msg.sender);

        _tryCompleteOrder(_orderId);
    }

    // --- INTERNAL HELPERS ---
    function _tryCompleteOrder(uint256 _orderId) internal {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];

        if (order.agentConfirmed && order.buyerConfirmed) {
            order.status = OrderStatus.COMPLETE;

            uint256 feeAmount = (order.totalAmount * FEE_PERCENT) / 1000;
            uint256 sellerAmount = order.totalAmount - feeAmount;

            (bool sentSeller, ) = listing.seller.call{value: sellerAmount}("");
            require(sentSeller, "Payment to seller failed");

            (bool sentOwner, ) = owner.call{value: feeAmount}("");
            require(sentOwner, "Payment to owner failed");

            emit DeliveryCompleted(_orderId, listing.seller, sellerAmount, feeAmount);
        }
    }

    // --- REFUND ---
    function refundOrder(uint256 _orderId) public {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];

        require(order.status == OrderStatus.AWAITING_DELIVERY, "Not refundable.");
        require(msg.sender == order.deliveryAgent, "Only delivery agent can refund.");

        order.status = OrderStatus.REFUNDED;
        listing.quantityAvailable += order.quantity;

        (bool sent, ) = order.buyer.call{value: order.totalAmount}("");
        require(sent, "Refund failed");

        emit OrderRefunded(_orderId, order.buyer, order.totalAmount);
    }
}