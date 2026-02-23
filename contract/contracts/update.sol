// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Updated is ReentrancyGuard {
    enum OrderStatus { AWAITING_AGENT, AWAITING_DELIVERY, COMPLETE, REFUNDED }
    enum PaymentMethod { ETH, FIAT }
    enum DeliveryStatus { NotStarted, PickedUp, InTransit, Weighment, Delivered }

    struct Review {
        uint8 rating;
        string review;
        address reviewer;
        uint256 timestamp;
    }

    struct Listing {
        uint256 id;
        string name;
        string companyName;
        uint256 pricePerUnit;
        uint256 quantityAvailable;
        address payable seller;
        bool isActive;
        string dataHash;       // Hash for Description/Specs (JSON or Text)
        string[] imageHashes;  // NEW: Array to store multiple image IPFS CIDs/URLs
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
        PaymentMethod paymentMethod; 
        bool isLocalAgent;           
        DeliveryStatus deliveryStatus;
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
    mapping(uint256 => bool) public orderIsLocalOffer; 

    mapping(uint256 => Review[]) public listingReviews;
    mapping(uint256 => mapping(address => bool)) public hasReviewed;

    // --- SAFETY: Withdrawal Pattern ---
    mapping(address => uint256) public pendingWithdrawals;

    // Events
    // Updated Event to emit the array of images
    event ListingCreated(uint256 id, string name, uint256 pricePerUnit, uint256 quantity, address seller, string[] imageHashes);
    event OrderCreated(uint256 indexed orderId, uint256 indexed listingId, uint256 quantity, address buyer, uint256 totalAmount, PaymentMethod method);
    event AgentOfferCreated(uint256 orderId, address agent, bool isLocal);
    event AgentAssigned(uint256 orderId, address agent, bool isLocal);
    event AgentConfirmed(uint256 orderId, address agent);
    event BuyerConfirmed(uint256 orderId, address buyer);
    event DeliveryCompleted(uint256 orderId, uint256 sellerPayout, uint256 adminFee, uint256 agentFee, bool payoutSuccess);
    event OrderRefunded(uint256 orderId, address buyer, uint256 amount);
    event DeliveryStatusUpdated(uint256 orderId, DeliveryStatus status);
    event ReviewSubmitted(uint256 indexed listingId, uint8 rating);
    event FundsWithdrawn(address indexed user, uint256 amount);

    constructor() {
        owner = payable(msg.sender);
    }

    // --- LISTING FUNCTIONS ---

    function createListing(
        string memory _name,
        string memory _companyName,
        uint256 _pricePerUnit,
        uint256 _quantity,
        string memory _dataHash, // Description/Metadata
        string[] memory _imageHashes // NEW: Accepts list of image links/hashes
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
            dataHash: _dataHash,
            imageHashes: _imageHashes
        });

        emit ListingCreated(nextListingId, _name, _pricePerUnit, _quantity, msg.sender, _imageHashes);
        nextListingId++;
    }

    // Helper function to get images (Standard mapping getter omits arrays)
    function getListingImages(uint256 _listingId) public view returns (string[] memory) {
        return listings[_listingId].imageHashes;
    }

    // --- ORDER FUNCTIONS ---

    function createOrder(
        uint256 _listingId,
        uint256 _quantityToBuy,
        string memory _buyerName,
        string memory _buyerCompany,
        PaymentMethod _paymentMethod,
        address _fiatBuyerAddress 
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
            require(msg.sender == owner, "Only Admin can relay Fiat orders");
            require(_fiatBuyerAddress != address(0), "Invalid Fiat Buyer");
            require(msg.value == 0, "Fiat orders must be value 0"); 
            buyerAddress = payable(_fiatBuyerAddress);
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
            isLocalAgent: false, 
            deliveryStatus: DeliveryStatus.NotStarted
        });

        emit OrderCreated(nextOrderId, _listingId, _quantityToBuy, buyerAddress, totalAmount, _paymentMethod);
        nextOrderId++;
    }

    // --- AGENT FUNCTIONS ---

    function requestAgent(uint256 _orderId, address payable _agent, bool _isLocal) external {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];

        require(msg.sender == listing.seller, "Only seller");
        require(order.status == OrderStatus.AWAITING_AGENT, "Not awaiting agent");
        require(order.deliveryAgent == address(0), "Already assigned");

        agentOfferPending[_orderId][_agent] = true;
        orderIsLocalOffer[_orderId] = _isLocal; 

        emit AgentOfferCreated(_orderId, _agent, _isLocal);
    }

    function acceptAgentOffer(uint256 _orderId) external {
        Order storage order = orders[_orderId];

        require(agentOfferPending[_orderId][msg.sender], "No pending offer");
        require(order.deliveryAgent == address(0), "Already assigned");

        order.deliveryAgent = payable(msg.sender);
        order.isLocalAgent = orderIsLocalOffer[_orderId]; 
        order.status = OrderStatus.AWAITING_DELIVERY;
        
        agentOfferPending[_orderId][msg.sender] = false;

        emit AgentAssigned(_orderId, msg.sender, order.isLocalAgent);
    }

    function assignAgent(uint256 _orderId, address payable _agent, bool _isLocal) public {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];

        require(msg.sender == listing.seller, "Only seller");
        require(order.status == OrderStatus.AWAITING_AGENT, "Not awaiting");
        require(order.deliveryAgent == address(0), "Already assigned");

        order.deliveryAgent = _agent;
        order.isLocalAgent = _isLocal;
        order.status = OrderStatus.AWAITING_DELIVERY;
        emit AgentAssigned(_orderId, _agent, _isLocal);
    }

    function updateDeliveryStatus(uint256 _orderId, DeliveryStatus _status) public {
        Order storage order = orders[_orderId];
        require(msg.sender == order.deliveryAgent, "Only agent can update");
        require(order.status == OrderStatus.AWAITING_DELIVERY, "Not in delivery phase");
        
        require(_status != DeliveryStatus.Delivered, "Use ConfirmDelivery to set Delivered"); 
        
        require(uint(_status) > uint(order.deliveryStatus), "Cannot revert status");

        order.deliveryStatus = _status;
        emit DeliveryStatusUpdated(_orderId, _status);
    }

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

    function submitReview(uint256 _orderId, uint8 _rating, string memory _review) public {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];
        require(order.status == OrderStatus.COMPLETE, "Order not completed");
        require(msg.sender == order.buyer, "Only buyer can review");
        require(order.buyer != listing.seller, "Self review not allowed");
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        require(!hasReviewed[order.listingId][msg.sender], "Already reviewed");
        
        listingReviews[order.listingId].push(Review(_rating, _review, msg.sender, block.timestamp));
        hasReviewed[order.listingId][msg.sender] = true;
        emit ReviewSubmitted(order.listingId, _rating);
    }

    // --- INTERNAL PAYOUT LOGIC ---
    function _tryCompleteOrder(uint256 _orderId) internal nonReentrant {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];
        
        if (order.agentConfirmed && order.buyerConfirmed) {
            order.status = OrderStatus.COMPLETE;
            order.deliveryStatus = DeliveryStatus.Delivered;

            if (order.paymentMethod == PaymentMethod.ETH) {
                uint256 total = order.totalAmount;
                uint256 adminFee = (total * ADMIN_FEE_BP) / 1000; // 2%
                uint256 agentFee = 0;
                uint256 sellerPayout = 0;

                _safeTransfer(owner, adminFee);
                totalFeesCollected += adminFee;

                if (!order.isLocalAgent && order.deliveryAgent != address(0)) {
                    agentFee = (total * AGENT_FEE_BP) / 1000; // 5%
                    _safeTransfer(order.deliveryAgent, agentFee);
                }

                sellerPayout = total - adminFee - agentFee;
                bool success = _safeTransfer(listing.seller, sellerPayout);

                emit DeliveryCompleted(_orderId, sellerPayout, adminFee, agentFee, success);
            } else {
                emit DeliveryCompleted(_orderId, 0, 0, 0, true); 
            }
        }
    }

    function _safeTransfer(address _to, uint256 _amount) internal returns (bool) {
        if (_amount == 0) return true;
        (bool sent, ) = _to.call{value: _amount}("");
        if (!sent) {
            pendingWithdrawals[_to] += _amount;
            return false;
        }
        return true;
    }

    function withdrawFunds() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdraw failed");
        emit FundsWithdrawn(msg.sender, amount);
    }

    function refundOrder(uint256 _orderId) public nonReentrant {
        Order storage order = orders[_orderId];
        Listing storage listing = listings[order.listingId];

        require(order.status == OrderStatus.AWAITING_DELIVERY, "Cannot Refund");
        require(msg.sender == order.deliveryAgent || msg.sender == owner, "Auth Failed");

        order.status = OrderStatus.REFUNDED;
        listing.quantityAvailable += order.quantity;

        if (order.paymentMethod == PaymentMethod.ETH) {
            _safeTransfer(order.buyer, order.totalAmount);
        }
        emit OrderRefunded(_orderId, order.buyer, order.totalAmount);
    }
}