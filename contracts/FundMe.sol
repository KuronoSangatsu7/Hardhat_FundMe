// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceConverter.sol";

error NotOwner();

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address public immutable i_owner;
    address[] public funders;
    mapping(address => uint256) funderToAmount;

    constructor (){
        i_owner = msg.sender;
    }

    function fund() public payable {
        require(msg.value.getConversionRate() > MINIMUM_USD, "too low");
        funders.push(msg.sender);
        funderToAmount[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        for(uint i = 0; i < funders.length; i++) {
            address funder = funders[i];
            funderToAmount[funder] = 0;
        }
        funders = new address[](0);
        (bool sent,) = payable(msg.sender).call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }

    modifier onlyOwner {
        //require(msg.sender == i_owner, "Sender is not owner!!!");
        if(msg.sender != i_owner) { revert NotOwner(); }
        _;
    }

    receive () external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
