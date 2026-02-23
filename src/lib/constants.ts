export const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "agent",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isLocal",
                "type": "bool"
            }
        ],
        "name": "AgentAssigned",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "agent",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isLocal",
                "type": "bool"
            }
        ],
        "name": "AgentOfferCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "AgentConfirmed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            }
        ],
        "name": "BuyerConfirmed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "sellerPayout",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "adminFee",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "agentFee",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "payoutSuccess",
                "type": "bool"
            }
        ],
        "name": "DeliveryCompleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "pricePerUnit",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "quantity",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "seller",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string[]",
                "name": "imageHashes",
                "type": "string[]"
            }
        ],
        "name": "ListingCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "listingId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "rating",
                "type": "uint8"
            }
        ],
        "name": "ReviewSubmitted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "OrderRefunded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "listingId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "quantity",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalAmount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum MarketUpdated.PaymentMethod",
                "name": "method",
                "type": "uint8"
            }
        ],
        "name": "OrderCreated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            }
        ],
        "name": "acceptAgentOffer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            }
        ],
        "name": "agentConfirmDelivery",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "agentOfferPending",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            },
            {
                "internalType": "address payable",
                "name": "_agent",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "_isLocal",
                "type": "bool"
            }
        ],
        "name": "assignAgent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            },
            {
                "internalType": "enum Updated.DeliveryStatus",
                "name": "_status",
                "type": "uint8"
            }
        ],
        "name": "updateDeliveryStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            }
        ],
        "name": "agentConfirmDelivery",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            }
        ],
        "name": "buyerConfirmDelivery",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_buyerName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_buyerCompany",
                "type": "string"
            },
            {
                "internalType": "enum MarketUpdated.PaymentMethod",
                "name": "_paymentMethod",
                "type": "uint8"
            },
            {
                "internalType": "address",
                "name": "_fiatBuyerAddress",
                "type": "address"
            }
        ],
        "name": "createListingAndOrder",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_companyName",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_pricePerUnit",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_quantity",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_dataHash",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "_imageHashes",
                "type": "string[]"
            }
        ],
        "name": "createListing",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_listingId",
                "type": "uint256"
            }
        ],
        "name": "getListingImages",
        "outputs": [
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_listingId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_quantityToBuy",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_buyerName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_buyerCompany",
                "type": "string"
            },
            {
                "internalType": "enum MarketUpdated.PaymentMethod",
                "name": "_paymentMethod",
                "type": "uint8"
            },
            {
                "internalType": "address",
                "name": "_fiatBuyerAddress",
                "type": "address"
            }
        ],
        "name": "createOrder",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_rating",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "_review",
                "type": "string"
            }
        ],
        "name": "submitReview",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_listingId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_reviewer",
                "type": "address"
            }
        ],
        "name": "hasReviewed",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "listingReviews",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "rating",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "review",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "reviewer",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },

    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "listings",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "companyName",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "pricePerUnit",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "quantityAvailable",
                "type": "uint256"
            },
            {
                "internalType": "address payable",
                "name": "seller",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            },
            {
                "internalType": "string",
                "name": "dataHash",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "imageHashes",
                "type": "string[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },

    {
        "inputs": [],
        "name": "nextListingId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nextOrderId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "orderIsLocalOffer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "orders",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "listingId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "quantity",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "totalAmount",
                "type": "uint256"
            },
            {
                "internalType": "address payable",
                "name": "buyer",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "buyerName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "buyerCompany",
                "type": "string"
            },
            {
                "internalType": "address payable",
                "name": "deliveryAgent",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "agentConfirmed",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "buyerConfirmed",
                "type": "bool"
            },
            {
                "internalType": "enum MarketUpdated.OrderStatus",
                "name": "status",
                "type": "uint8"
            },
            {
                "internalType": "enum MarketUpdated.PaymentMethod",
                "name": "paymentMethod",
                "type": "uint8"
            },
            {
                "internalType": "bool",
                "name": "isLocalAgent",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            },
            {
                "internalType": "address payable",
                "name": "_agent",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "_isLocal",
                "type": "bool"
            }
        ],
        "name": "requestAgent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            }
        ],
        "name": "refundOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalFeesCollected",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

export const contractAddress = "0xAF495314768216465B9ACB5340DEf6BE9356835F";