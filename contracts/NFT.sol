// contracts/MyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    constructor() ERC721("MyNFT", "MNFT") {
    }

    function mint(uint _tokenId) public {
        _mint(msg.sender, _tokenId);
    }
}