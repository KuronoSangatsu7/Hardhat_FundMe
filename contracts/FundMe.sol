// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceConverter.sol";

error FuneMe__NotOwner();

/** @title A contract for crown funding
 *  @author Jaffar Totanji
 *  @notice This contract is a demo used for practice
 *  @dev This implements price feeds as our library
 */
contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address public immutable i_owner;
    address[] public funders;
    mapping(address => uint256) funderToAmount;
    AggregatorV3Interface public priceFeed;

    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Sender is not owner!!!");
        if (msg.sender != i_owner) {
            revert FuneMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
    *  @notice This function funds the contracts
    *  @dev This implements price feeds as our library
    */
    function fund() public payable {
        require(
            msg.value.getConversionRate(priceFeed) > MINIMUM_USD,
            "too low"
        );
        funders.push(msg.sender);
        funderToAmount[msg.sender] = msg.value;
    }

    /**
    *  @notice This function allows the owner to withdraw funds
    *  @dev This implements price feeds as our library
    */
    function withdraw() public onlyOwner {
        for (uint256 i = 0; i < funders.length; i++) {
            address funder = funders[i];
            funderToAmount[funder] = 0;
        }
        funders = new address[](0);
        (bool sent, ) = payable(msg.sender).call{value: address(this).balance}(
            ""
        );
        require(sent, "Failed to send Ether");
    }
}
