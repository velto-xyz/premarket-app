export declare const fundingManagerAbi: readonly [{
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "BASE_CARRY_RATE_PER_BLOCK";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "CARRY_SENSITIVITY";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "PRECISION";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "market";
        readonly internalType: "contract PerpMarket";
        readonly type: "address";
    }, {
        readonly name: "isLong";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "notional";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "carrySnapshot";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly name: "calculateCarryPnl";
    readonly outputs: readonly [{
        readonly name: "carryPnl";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "market";
        readonly internalType: "contract PerpMarket";
        readonly type: "address";
    }];
    readonly name: "calculateUpdatedCarry";
    readonly outputs: readonly [{
        readonly name: "newCarryIndex";
        readonly internalType: "int256";
        readonly type: "int256";
    }, {
        readonly name: "carryPerBlock";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "market";
        readonly internalType: "contract PerpMarket";
        readonly type: "address";
    }];
    readonly name: "getCurrentCarryIndex";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "blockNumber";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "cumulativeCarryIndex";
        readonly internalType: "int256";
        readonly type: "int256";
        readonly indexed: false;
    }, {
        readonly name: "carryPerBlock";
        readonly internalType: "int256";
        readonly type: "int256";
        readonly indexed: false;
    }, {
        readonly name: "longOI";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "shortOI";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "CarryUpdated";
}];
export declare const liquidationEngineAbi: readonly [{
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "EPSILON";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "LIQUIDATION_FEE_RATIO";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "PRECISION";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "positionManager";
        readonly internalType: "contract PositionManager";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract PerpMarket";
        readonly type: "address";
    }, {
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "calculateLiquidationFee";
    readonly outputs: readonly [{
        readonly name: "liqFee";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "positionManager";
        readonly internalType: "contract PositionManager";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract PerpMarket";
        readonly type: "address";
    }, {
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "getLiquidationInfo";
    readonly outputs: readonly [{
        readonly name: "isLiq";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "currentLoss";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "allowedLoss";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "equity";
        readonly internalType: "int256";
        readonly type: "int256";
    }, {
        readonly name: "leverage";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "positionManager";
        readonly internalType: "contract PositionManager";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract PerpMarket";
        readonly type: "address";
    }, {
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "isLiquidatable";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "user";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "liquidator";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "avgClosePrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "totalPnl";
        readonly internalType: "int256";
        readonly type: "int256";
        readonly indexed: false;
    }, {
        readonly name: "equity";
        readonly internalType: "int256";
        readonly type: "int256";
        readonly indexed: false;
    }, {
        readonly name: "liqFee";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "timestamp";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "PositionLiquidated";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "PositionNotLiquidatable";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "PositionNotOpen";
}];
export declare const mockUsdcAbi: readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "DOMAIN_SEPARATOR";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "allowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "approve";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "decimals";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint8";
        readonly type: "uint8";
    }];
    readonly stateMutability: "pure";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "eip712Domain";
    readonly outputs: readonly [{
        readonly name: "fields";
        readonly internalType: "bytes1";
        readonly type: "bytes1";
    }, {
        readonly name: "name";
        readonly internalType: "string";
        readonly type: "string";
    }, {
        readonly name: "version";
        readonly internalType: "string";
        readonly type: "string";
    }, {
        readonly name: "chainId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "verifyingContract";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "salt";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "extensions";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "faucet";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "mint";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "name";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "string";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "nonces";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "deadline";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "v";
        readonly internalType: "uint8";
        readonly type: "uint8";
    }, {
        readonly name: "r";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "s";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly name: "permit";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "symbol";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "string";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "totalSupply";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "transfer";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "transferFrom";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Approval";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [];
    readonly name: "EIP712DomainChanged";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Transfer";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "ECDSAInvalidSignature";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "length";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "ECDSAInvalidSignatureLength";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "s";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly name: "ECDSAInvalidSignatureS";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "allowance";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "needed";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "ERC20InsufficientAllowance";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "balance";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "needed";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "ERC20InsufficientBalance";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "approver";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "ERC20InvalidApprover";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "receiver";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "ERC20InvalidReceiver";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "ERC20InvalidSender";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "ERC20InvalidSpender";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "deadline";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "ERC2612ExpiredSignature";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "signer";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "ERC2612InvalidSigner";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "currentNonce";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "InvalidAccountNonce";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InvalidShortString";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "str";
        readonly internalType: "string";
        readonly type: "string";
    }];
    readonly name: "StringTooLong";
}];
export declare const perpEngineAbi: readonly [{
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "MAX_LEVERAGE";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "PRECISION";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "USDC_TO_INTERNAL";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "closePosition";
    readonly outputs: readonly [{
        readonly name: "totalPnl";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "collateralToken";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "deploymentBlock";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "deposit";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "depositAmount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "isLong";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "totalToUse";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "leverage";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "depositAndOpenPosition";
    readonly outputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "depositAmount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "permitAmount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "isLong";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "totalToUse";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "leverage";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "deadline";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "v";
        readonly internalType: "uint8";
        readonly type: "uint8";
    }, {
        readonly name: "r";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "s";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly name: "depositAndOpenPositionWithPermit";
    readonly outputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "depositAmount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "permitAmount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "deadline";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "v";
        readonly internalType: "uint8";
        readonly type: "uint8";
    }, {
        readonly name: "r";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "s";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly name: "depositWithPermit";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "fundingManager";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract FundingManager";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getFundBalances";
    readonly outputs: readonly [{
        readonly name: "trade";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "insurance";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "protocol";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getMarketInfo";
    readonly outputs: readonly [{
        readonly name: "perpEngine";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "perpMarket";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "positionMgr";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "chainId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "deployBlock";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "getWalletBalance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_collateralToken";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "_market";
        readonly internalType: "contract PerpMarket";
        readonly type: "address";
    }, {
        readonly name: "_positionManager";
        readonly internalType: "contract PositionManager";
        readonly type: "address";
    }, {
        readonly name: "_fundingManager";
        readonly internalType: "contract FundingManager";
        readonly type: "address";
    }, {
        readonly name: "_liquidationEngine";
        readonly internalType: "contract LiquidationEngine";
        readonly type: "address";
    }];
    readonly name: "initialize";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "insuranceFund";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "liquidate";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "liquidationEngine";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract LiquidationEngine";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "market";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract PerpMarket";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "isLong";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "totalToUse";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "leverage";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "openPosition";
    readonly outputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "positionManager";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract PositionManager";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "protocolFees";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "tradeFund";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "userWallets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "withdraw";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "user";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Deposit";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "version";
        readonly internalType: "uint64";
        readonly type: "uint64";
        readonly indexed: false;
    }];
    readonly name: "Initialized";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "user";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "totalPnl";
        readonly internalType: "int256";
        readonly type: "int256";
        readonly indexed: false;
    }, {
        readonly name: "avgClosePrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "PositionClosed";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "user";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "liquidator";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "liqFee";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "PositionLiquidated";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "user";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "isLong";
        readonly internalType: "bool";
        readonly type: "bool";
        readonly indexed: true;
    }, {
        readonly name: "totalToUse";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "margin";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "fee";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "leverage";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "baseSize";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "entryPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "PositionOpened";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "user";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Withdraw";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InsufficientBalance";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InvalidAmount";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InvalidInitialization";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InvalidLeverage";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "NotInitializing";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "NotLiquidatable";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "NotPositionOwner";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "PositionNotFound";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "ReentrancyGuardReentrantCall";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "SafeERC20FailedOperation";
}];
export declare const perpFactoryAbi: readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_perpMarketImpl";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "_positionManagerImpl";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "_perpEngineImpl";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "_liquidationEngine";
        readonly internalType: "contract LiquidationEngine";
        readonly type: "address";
    }, {
        readonly name: "_fundingManager";
        readonly internalType: "contract FundingManager";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "collateralToken";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "config";
        readonly internalType: "struct PerpFactory.MarketConfig";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "baseReserve";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "quoteReserve";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxLeverage";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }];
    readonly name: "createMarket";
    readonly outputs: readonly [{
        readonly name: "engineAddress";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "fundingManager";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract FundingManager";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getAllMarkets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "index";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getMarketCount";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEngine";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isMarketCreator";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "liquidationEngine";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract LiquidationEngine";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "markets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "owner";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "perpEngineImplementation";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "perpMarketImplementation";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "positionManagerImplementation";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "renounceOwnership";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "creator";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "authorized";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly name: "setMarketCreator";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "newOwner";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "transferOwnership";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "marketIndex";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "engine";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "market";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "collateralToken";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }];
    readonly name: "MarketCreated";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "creator";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "authorized";
        readonly internalType: "bool";
        readonly type: "bool";
        readonly indexed: false;
    }];
    readonly name: "MarketCreatorUpdated";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "previousOwner";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "newOwner";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "OwnershipTransferred";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "FailedDeployment";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "balance";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "needed";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "InsufficientBalance";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InvalidLeverage";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InvalidReserves";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "OwnableInvalidOwner";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "OwnableUnauthorizedAccount";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "Unauthorized";
}];
export declare const perpMarketAbi: readonly [{
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "PRECISION";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "numBlocks";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "advanceBlocks";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "baseReserve";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "cumulativeCarryIndex";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "currentBlock";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "isLong";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "notional";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "decreaseOpenInterest";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "engine";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "baseSize";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "executeCloseLong";
    readonly outputs: readonly [{
        readonly name: "quoteOut";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "avgPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "baseSize";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "executeCloseShort";
    readonly outputs: readonly [{
        readonly name: "quoteIn";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "avgPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "quoteIn";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "executeOpenLong";
    readonly outputs: readonly [{
        readonly name: "baseOut";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "avgPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "quoteOut";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "executeOpenShort";
    readonly outputs: readonly [{
        readonly name: "baseIn";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "avgPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "factory";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getMarkPrice";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "isLong";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "notional";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "increaseOpenInterest";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_baseReserve";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_quoteReserve";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_factory";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "initialize";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "k";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "lastFundingBlock";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "longOpenInterest";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "quoteReserve";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_engine";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "setEngine";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "shortOpenInterest";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "baseSize";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "simulateCloseLong";
    readonly outputs: readonly [{
        readonly name: "quoteOut";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "avgPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "baseSize";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "simulateCloseShort";
    readonly outputs: readonly [{
        readonly name: "quoteIn";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "avgPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "quoteIn";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "simulateOpenLong";
    readonly outputs: readonly [{
        readonly name: "baseOut";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "avgPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "quoteOut";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "simulateOpenShort";
    readonly outputs: readonly [{
        readonly name: "baseIn";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "avgPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "newCarryIndex";
        readonly internalType: "int256";
        readonly type: "int256";
    }, {
        readonly name: "newFundingBlock";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "updateFundingState";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "version";
        readonly internalType: "uint64";
        readonly type: "uint64";
        readonly indexed: false;
    }];
    readonly name: "Initialized";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "longOpenInterest";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "shortOpenInterest";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "OpenInterestUpdated";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "baseReserve";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "quoteReserve";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "markPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "ReservesUpdated";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "EngineAlreadySet";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InsufficientLiquidity";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InvalidInitialization";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InvalidReserves";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "NotInitializing";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "Unauthorized";
}];
export declare const positionManagerAbi: readonly [{
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "BUFFER_RATIO_1";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "BUFFER_RATIO_2";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "BUFFER_RATIO_3";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "LEVERAGE_BUCKET_1_MAX";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "LEVERAGE_BUCKET_2_MAX";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "LEVERAGE_BUCKET_3_MAX";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "PRECISION";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "isLong";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "baseSize";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "entryPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "margin";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "carrySnapshot";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly name: "createPosition";
    readonly outputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "engine";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "factory";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getEffectiveOpenFeeRate";
    readonly outputs: readonly [{
        readonly name: "feeRate";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "leverage";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "getLiquidationBufferRatio";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "pure";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "getPosition";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct PositionManager.Position";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "user";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "isLong";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "baseSize";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "entryPrice";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "entryNotional";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "margin";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "carrySnapshot";
            readonly internalType: "int256";
            readonly type: "int256";
        }, {
            readonly name: "openBlock";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "status";
            readonly internalType: "enum PositionManager.PositionStatus";
            readonly type: "uint8";
        }, {
            readonly name: "realizedPnl";
            readonly internalType: "int256";
            readonly type: "int256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_market";
        readonly internalType: "contract PerpMarket";
        readonly type: "address";
    }, {
        readonly name: "_factory";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "initialize";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "isPositionOpen";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "market";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract PerpMarket";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "nextPositionId";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "positions";
    readonly outputs: readonly [{
        readonly name: "id";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "user";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "isLong";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "baseSize";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "entryPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "entryNotional";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "margin";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "carrySnapshot";
        readonly internalType: "int256";
        readonly type: "int256";
    }, {
        readonly name: "openBlock";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "status";
        readonly internalType: "enum PositionManager.PositionStatus";
        readonly type: "uint8";
    }, {
        readonly name: "realizedPnl";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_engine";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "setEngine";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "simulateEquityIfClosed";
    readonly outputs: readonly [{
        readonly name: "closeNotional";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "avgClosePrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "pnlTrade";
        readonly internalType: "int256";
        readonly type: "int256";
    }, {
        readonly name: "carryPnl";
        readonly internalType: "int256";
        readonly type: "int256";
    }, {
        readonly name: "totalPnl";
        readonly internalType: "int256";
        readonly type: "int256";
    }, {
        readonly name: "equityIfClosed";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "newStatus";
        readonly internalType: "enum PositionManager.PositionStatus";
        readonly type: "uint8";
    }, {
        readonly name: "realizedPnl";
        readonly internalType: "int256";
        readonly type: "int256";
    }];
    readonly name: "updatePositionStatus";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "version";
        readonly internalType: "uint64";
        readonly type: "uint64";
        readonly indexed: false;
    }];
    readonly name: "Initialized";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "positionId";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "user";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "isLong";
        readonly internalType: "bool";
        readonly type: "bool";
        readonly indexed: true;
    }, {
        readonly name: "baseSize";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "entryPrice";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "entryNotional";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "margin";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "carrySnapshot";
        readonly internalType: "int256";
        readonly type: "int256";
        readonly indexed: false;
    }, {
        readonly name: "openBlock";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "PositionCreated";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "EngineAlreadySet";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "InvalidInitialization";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "NotInitializing";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "PositionNotFound";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "PositionNotOpen";
}, {
    readonly type: "error";
    readonly inputs: readonly [];
    readonly name: "Unauthorized";
}];
//# sourceMappingURL=generated.d.ts.map