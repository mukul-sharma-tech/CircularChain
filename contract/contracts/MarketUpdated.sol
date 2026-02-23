// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MarketUpdated {
    enum OrderStatus { AWAITING_AGENT, AWAITING_DELIVERY, COMPLETE, REFUNDED }
    enum PaymentMethod { ETH, FIAT }

    struct Listing {
        uint256 id;
        string name;
        string companyName;
        uint256 pricePerUnit;
        uint256 quantityAvailable;
        address payable seller;
        bool isActive;
        string dataHash; // SHA256 Hash of Off-Chain Data (Images/Specs)
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
        PaymentMethod paymentMethod; // ETH or FIAT
        bool isLocalAgent;           // True = No 5% fee (Offline Pay), False = 5% Platform Fee
    }

    address payable public owner;
    
    // Fees (Basis Points: 100 = 10%, 10 = 1%)
    uint256 public constant ADMIN_FEE_BP = 20; // 2%
    uint256 public constant AGENT_FEE_BP = 50; // 5%

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Order) public orders;
    uint256 public nextListingId = 1;
    uint256 public nextOrderId = 1;
    uint256 public totalFeesCollected;

    // Agent offer tracking
    mapping(uint256 => mapping(address => bool)) public agentOfferPending;
    mapping(uint256 => bool) public orderIsLocalOffer; // Temp storage for pending offer type

    // Events
    event ListingCreated(uint256 id, string name, uint256 pricePerUnit, uint256 quantity, address seller, string dataHash);
    event OrderCreated(uint256 orderId, uint256 listingId, uint256 quantity, address buyer, uint256 totalAmount, PaymentMethod method);
    
    // Agent Events
    event AgentOfferCreated(uint256 orderId, address agent, bool isLocal);
    event AgentAssigned(uint256 orderId, address agent, bool isLocal);
    
    // Delivery Events
    event AgentConfirmed(uint256 orderId, address agent);
    event BuyerConfirmed(uint256 orderId, address buyer);
    event DeliveryCompleted(uint256 orderId, uint256 sellerPayout, uint256 adminFee, uint256 agentFee);
    event OrderRefunded(uint256 orderId, address buyer, uint256 amount);

    constructor() {
        owner = payable(msg.sender);
    }

    // --- LISTING FUNCTIONS ---

    function createListing(
        string memory _name,
        string memory _companyName,
        uint256 _pricePerUnit,
        uint256 _quantity,
        string memory _dataHash // ImageKit/Mongo Hash
    ) public {
        require(_pricePerUnit > 0, "Price must be > 0");
        require(_quantity > 0, "Quantity must be > 0");

        listings[nextListingId] = Listing({
            id: nextListingId,
            name: _name,
            companyName: _companyName,
            pricePerUnit: _pricePerUnit,
            quantityAvailable: _quantity,
            seller: payable(msg.sender),
            isActive: true,
            dataHash: _dataHash
        });

        emit ListingCreated(nextListingId, _name, _pricePerUnit, _quantity, msg.sender, _dataHash);
        nextListingId++;
    }

    // --- ORDER FUNCTIONS ---

    function createOrder(
        uint256 _listingId,
        uint256 _quantityToBuy,
        string memory _buyerName,
        string memory _buyerCompany,
        PaymentMethod _paymentMethod,
        address _fiatBuyerAddress // Only used if FIAT (Relayer sets this)
    ) public payable {
        Listing storage listing = listings[_listingId];

        require(listing.id != 0 && listing.isActive, "Invalid Listing");
        require(listing.quantityAvailable >= _quantityToBuy, "Not enough stock");
        
        uint256 totalAmount = listing.pricePerUnit * _quantityToBuy;
        address payable buyerAddress;

        if (_paymentMethod == PaymentMethod.ETH) {
            require(msg.value == totalAmount, "Incorrect ETH value");
            require(msg.sender != listing.seller, "Seller cannot buy own item");
            buyerAddress = payable(msg.sender);
        } else {
            // FIAT (Relayer Mode)
            require(msg.sender == owner, "Only Admin can relay Fiat orders");
            require(_fiatBuyerAddress != address(0), "Invalid Fiat Buyer");
            require(msg.value == 0, "Fiat orders must be value 0"); 
            buyerAddress = payable(_fiatBuyerAddress);
            // Note: Money is held in Stripe, not contract.
        }

        listing.quantityAvailable -= _quantityToBuy;

        orders[nextOrderId] = Order({
            id: nextOrderId,
            listingId: _listingId,
            quantity: _quantityToBuy,
            totalAmount: totalAmount,
            buyer: buyerAddress,
            buyerName: _buyerName,
            buyerCompany: _buyerCompany,
            deliveryAgent: payable(address(0)),
            agentConfirmed: false,
            buyerConfirmed: false,
            status: OrderStatus.AWAITING_AGENT,
            paymentMethod: _paymentMethod,
            isLocalAgent: false // Default, updated on assignment
        });

        emit OrderCreated(nextOrderId, _listingId, _quantityToBuy, buyerAddress, totalAmount, _paymentMethod);
        nextOrderId++;
    }

    // --- AGENT FUNCTIONS ---

    // 1. Seller offers job to specific agent
    function requestAgent(uint256 _orderId, address payable _agent, bool _isLocal) external {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];

        require(msg.sender == listing.seller, "Only seller");
        require(order.status == OrderStatus.AWAITING_AGENT, "Not awaiting agent");
        require(order.deliveryAgent == address(0), "Already assigned");

        agentOfferPending[_orderId][_agent] = true;
        orderIsLocalOffer[_orderId] = _isLocal; // Store intent

        emit AgentOfferCreated(_orderId, _agent, _isLocal);
    }

    // 2. Agent accepts the job
    function acceptAgentOffer(uint256 _orderId) external {
        Order storage order = orders[_orderId];

        require(agentOfferPending[_orderId][msg.sender], "No pending offer");
        require(order.deliveryAgent == address(0), "Already assigned");

        // Assign
        order.deliveryAgent = payable(msg.sender);
        order.isLocalAgent = orderIsLocalOffer[_orderId]; // Set the Fee Flag based on what seller offered
        order.status = OrderStatus.AWAITING_DELIVERY;
        
        // Clear pending
        agentOfferPending[_orderId][msg.sender] = false;

        emit AgentAssigned(_orderId, msg.sender, order.isLocalAgent);
    }

    // 3. Direct Assignment (Legacy/Quick)
    function assignAgent(uint256 _orderId, address payable _agent, bool _isLocal) public {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];

        require(msg.sender == listing.seller, "Only seller");
        require(order.status == OrderStatus.AWAITING_AGENT, "Not awaiting");

        order.deliveryAgent = _agent;
        order.isLocalAgent = _isLocal;
        order.status = OrderStatus.AWAITING_DELIVERY;

        emit AgentAssigned(_orderId, _agent, _isLocal);
    }

    // --- DELIVERY & PAYOUT ---

    function agentConfirmDelivery(uint256 _orderId) public {
        Order storage order = orders[_orderId];
        require(msg.sender == order.deliveryAgent, "Only Agent");
        require(order.status == OrderStatus.AWAITING_DELIVERY, "Invalid State");
        
        order.agentConfirmed = true;
        emit AgentConfirmed(_orderId, msg.sender);
        _tryCompleteOrder(_orderId);
    }

    function buyerConfirmDelivery(uint256 _orderId) public {
        Order storage order = orders[_orderId];
        require(msg.sender == order.buyer || (order.paymentMethod == PaymentMethod.FIAT && msg.sender == owner), "Only Buyer/Admin");
        require(order.status == OrderStatus.AWAITING_DELIVERY, "Invalid State");

        order.buyerConfirmed = true;
        emit BuyerConfirmed(_orderId, msg.sender);
        _tryCompleteOrder(_orderId);
    }

    function _tryCompleteOrder(uint256 _orderId) internal {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];

        if (order.agentConfirmed && order.buyerConfirmed) {
            order.status = OrderStatus.COMPLETE;

            // --- PAYOUT LOGIC ---
            if (order.paymentMethod == PaymentMethod.ETH) {
                uint256 total = order.totalAmount;
                uint256 adminFee = (total * ADMIN_FEE_BP) / 1000; // 2%
                uint256 agentFee = 0;

                // Transfer Admin Fee
                (bool sentAdmin, ) = owner.call{value: adminFee}("");
                require(sentAdmin, "Admin Pay Failed");

                // Calculate Agent Fee
                if (!order.isLocalAgent && order.deliveryAgent != address(0)) {
                    agentFee = (total * AGENT_FEE_BP) / 1000; // 5%
                    (bool sentAgent, ) = order.deliveryAgent.call{value: agentFee}("");
                    require(sentAgent, "Agent Pay Failed");
                }
                // If isLocalAgent is TRUE, agentFee remains 0 (They get paid offline)

                // Seller gets the rest
                uint256 sellerPayout = total - adminFee - agentFee;
                (bool sentSeller, ) = listing.seller.call{value: sellerPayout}("");
                require(sentSeller, "Seller Pay Failed");

                totalFeesCollected += adminFee;
                emit DeliveryCompleted(_orderId, sellerPayout, adminFee, agentFee);

            } else {
                // FIAT MODE: No ETH transfer. Just emit event.
                // Money is handled via Stripe Connect payouts.
                emit DeliveryCompleted(_orderId, 0, 0, 0); 
            }
        }
    }

    function refundOrder(uint256 _orderId) public {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];

        require(order.status == OrderStatus.AWAITING_DELIVERY, "Cannot Refund");
        require(msg.sender == order.deliveryAgent || msg.sender == owner, "Auth Failed");

        order.status = OrderStatus.REFUNDED;
        listing.quantityAvailable += order.quantity;

        if (order.paymentMethod == PaymentMethod.ETH) {
            (bool sent, ) = order.buyer.call{value: order.totalAmount}("");
            require(sent, "Refund Failed");
        }
        // If FIAT, Admin triggers Stripe Refund via Backend.

        emit OrderRefunded(_orderId, order.buyer, order.totalAmount);
    }
}