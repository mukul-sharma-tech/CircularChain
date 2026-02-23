// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Marketplace {
    enum Status {
        AVAILABLE,  // Item is listed and for sale
        LOCKED,     // A buyer has paid, funds are in escrow awaiting delivery
        SOLD,       // Delivery was confirmed, seller has been paid
        REFUNDED    // Delivery failed, buyer has been refunded
    }

    struct Item {
        uint256 id;
        string name;
        string companyName;          // Seller’s company/brand name
        uint256 price;
        uint256 quantityAvailable;   // Number of units available
        address payable seller;
        address payable buyer;
        string buyerName;            // Buyer’s personal name
        string buyerCompany;         // Buyer’s company name
        address payable deliveryAgent;
        Status status;
    }

    mapping(uint256 => Item) public items;
    uint256 public nextItemId = 1;

    address payable public owner;   // Superadmin

    uint256 public constant FEE_PERCENT = 15; // 1.5% fee (basis points: 15/1000)

    event ItemListed(
        uint256 id,
        string name,
        string companyName,
        uint256 price,
        uint256 quantity,
        address seller
    );
    event ItemPurchased(
        uint256 id,
        address buyer,
        string buyerName,
        string buyerCompany,
        address deliveryAgent
    );
    event DeliveryConfirmed(
        uint256 id,
        address seller,
        uint256 sellerAmount,
        uint256 feeAmount
    );
    event BuyerRefunded(uint256 id, address buyer, uint256 amount);

    constructor() {
        owner = payable(msg.sender); // deployer is superadmin
    }

    /// @notice Seller lists an item for sale with stock.
    function listItem(
        string memory _name,
        string memory _companyName,
        uint256 _price,
        uint256 _quantity
    ) public {
        require(_price > 0, "Price must be greater than zero");
        require(_quantity > 0, "Quantity must be at least 1");

        items[nextItemId] = Item({
            id: nextItemId,
            name: _name,
            companyName: _companyName,
            price: _price,
            quantityAvailable: _quantity,
            seller: payable(msg.sender),
            buyer: payable(address(0)),
            buyerName: "",
            buyerCompany: "",
            deliveryAgent: payable(address(0)),
            status: Status.AVAILABLE
        });

        emit ItemListed(nextItemId, _name, _companyName, _price, _quantity, msg.sender);
        nextItemId++;
    }

    /// @notice Buyer purchases an item (1 unit at a time).
    function buyItem(
        uint256 _itemId,
        address payable _deliveryAgent,
        string memory _buyerName,
        string memory _buyerCompany
    ) public payable {
        Item storage item = items[_itemId];

        require(item.id != 0, "Item does not exist.");
        require(item.status == Status.AVAILABLE, "Item is not for sale.");
        require(item.quantityAvailable > 0, "Out of stock.");
        require(msg.value == item.price, "Please provide the exact price.");
        require(msg.sender != item.seller, "You cannot buy your own item.");
        require(
            _deliveryAgent != msg.sender && _deliveryAgent != item.seller,
            "Agent cannot be buyer or seller."
        );

        item.buyer = payable(msg.sender);
        item.buyerName = _buyerName;
        item.buyerCompany = _buyerCompany;
        item.deliveryAgent = _deliveryAgent;
        item.status = Status.LOCKED;

        // Decrease stock
        item.quantityAvailable -= 1;

        emit ItemPurchased(_itemId, msg.sender, _buyerName, _buyerCompany, _deliveryAgent);
    }

    /// @notice Delivery agent confirms delivery, releasing funds to the seller (minus 1.5% fee).
    function confirmDelivery(uint256 _itemId) public {
        Item storage item = items[_itemId];

        require(item.status == Status.LOCKED, "Item is not awaiting delivery.");
        require(msg.sender == item.deliveryAgent, "Only the delivery agent can confirm.");

        item.status = Status.SOLD;

        uint256 feeAmount = (item.price * FEE_PERCENT) / 1000; // 1.5%
        uint256 sellerAmount = item.price - feeAmount;

        // Pay seller
        (bool sentSeller, ) = item.seller.call{value: sellerAmount}("");
        require(sentSeller, "Payment to seller failed");

        // Pay owner (superadmin fee)
        (bool sentOwner, ) = owner.call{value: feeAmount}("");
        require(sentOwner, "Payment to owner failed");

        emit DeliveryConfirmed(_itemId, item.seller, sellerAmount, feeAmount);
    }

    /// @notice Delivery agent triggers a refund to the buyer if delivery fails.
    function refundBuyer(uint256 _itemId) public {
        Item storage item = items[_itemId];

        require(item.status == Status.LOCKED, "Item is not awaiting delivery.");
        require(msg.sender == item.deliveryAgent, "Only the delivery agent can trigger a refund.");

        item.status = Status.REFUNDED;

        (bool sent, ) = item.buyer.call{value: item.price}("");
        require(sent, "Refund failed");

        emit BuyerRefunded(_itemId, item.buyer, item.price);
    }
}
