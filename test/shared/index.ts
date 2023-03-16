// Each test should consist of a single call to run with the list of accounts, the done callback,
// and an auction schema describing the auction to run.
//
// An auction schema is an object with the following properties:
//    type:               A string denoting the type of auction to run.
//    reservePrice:       The auction reserve price.
//    judgeAddress:       For auctions with a judge, the address of the judge.
//    actions:            An ordered list of actions to run.
//
// An action is an object with the following properties:
//    block:              The block in which the action should occur.
//    action:             A string or callback function. If the action is a function, then running
//                        the action will cause the callback to be invoked with the list of
//                        accounts as its argument.
//
// If action is a string, the action must have the following additional properties:
//    succeed:            Whether the action should succeed.
//    on_error:           A message to show if the action succeeded when succeed is false or vice
//                        versa.
//
// "bid" actions can have the following additional properties:
//    account:            The index of the account that should bid.
//    payment:            The number of wei to bid.
//
// "finalize" actions take no additional properties.
//

// Implementation
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers"; 
// import { NFTDutchAuction } from "../../typechain-types";
import { ethers } from "hardhat";
import { expect } from "chai";
import '@openzeppelin/hardhat-upgrades';
import { BigNumber, BigNumberish, constants, Signature, Wallet } from "ethers";
import { splitSignature } from "ethers/lib/utils";
import { PayToken, PayToken__factory } from '../typechain-types';
import { NFTDutchAuction, NFTDutchAuction__factory } from "../../typechain-types";

// Run a test with the given accounts, done callback, and auction schema.
async function getPermitSignature(signer: any, token: PayToken, spender: string, value: any, deadline: BigNumber) {
  const [nonce, name, version, chainId] = await Promise.all([
  token.nonces(signer.address),
  token.name(),
  "1",
  signer.getChainId(),
  ])
  
  console.log(token.address)
  return ethers.utils.splitSignature(
      await signer._signTypedData(
          {
              name,
              version,
              chainId,
              verifyingContract: token.address,
          },
          {
          Permit: [
          {
          name: "owner",
          type: "address",
          },
          {
          name: "spender",
          type: "address",
          },
          {
          name: "value",
          type: "uint256",
          },
          {
          name: "nonce",
          type: "uint256",
          },
          {
          name: "deadline",
          type: "uint256",
          },
          ],
          },
          {
              owner: signer.address,
              spender,
              value,
              nonce,
              deadline
          }
      )


  describe('Dutch Auction', async function () {
    let accounts = [];
    this.beforeAll(async () => {
      accounts  = await ethers.getSigners();
    })

  const tokenID = 100;
1
  var factory = await ethers.getContractFactory("MyNFT");
  let nftInstance = await factory.deploy();  
  await nftInstance.mint(tokenID);

  const value = 1000;

  var factory1 = await ethers.getContractFactory("PayToken");
  let erc20 = await factory1.deploy();


  var C = await ethers.getContractFactory("NFTDutchAuction");
  let instance = await C.deploy();

  //Deploy Prozy
  const MyNFTProxyFactory = new NFTDutchAuction__factory();
  const proxy = await upgrades.deployProxy(C, [erc20.address, nftInstance.address, tokenID, schema.reservePrice, schema.biddingTimePeriod, schema.offerPriceDecrement], { initializer: "initialize" });
  instance = MyNFTProxyFactory.attach(proxy.address);


  await nftInstance.approve(instance.address,tokenID);



  let actions = schema.actions;
  let nopaccount = accounts[accounts.length  - 1];


  function error(message:string) {
    return (Error("Test: " + message));
  }

  function fail(action:any, message:any) {
    return (Error("Action " + action + ": " + message));
  }

  async function run_(block:number, index:number): Promise<any> {
    //console.log("web3.eth.blockNumber: " + web3.eth.blockNumber + " block=" + block + " index=" + index);
    // If we've run out of actions, the test has passed.
    if (index >= actions.length) {
      return undefined;
    }
    var action = actions[index];
    var nextBlock = block + 1;
    var nextIndex = index + 1;
    // If the next action takes place in a future block, delay.
    if (action.block > block) {
      await instance.connect(nopaccount).nop();
      
      return await run_(nextBlock, index);
    }
    // If the next action takes place in a previous block, error.
    if (action.block != block) {
      return  error("Current block is " + block + ", but action " + index +
          " takes place in prior block " + action.block);
    }
    // If the next action is a callback, execute it.
    if (typeof(action.action) == "function") {
      let result = action.action();
      if (result) {
        return fail(index, result);
      }
      // On successful evaluation of the callback, reinvoke ourselves.
      return await run_(block, nextIndex);
    }

    //console.log("Running action: " + action.action);
    // Run the action and get a promise.
    var promise;
    var account = accounts[action.account] || accounts[0];
    await erc20.connect(account).mint(action.payment);
    
    let balance = await erc20.balanceOf(account.address);
    let sellerBalance = await erc20.balanceOf(accounts[0].address);

    switch (action.action) {
      case "bid":
        await erc20.connect(account).approve(instance.address, action.payment);
        promise =  instance.connect(account).bid(action.payment);
          action.post = async (bal:BigNumber) => {
            expect(balance.sub(action.payment).eq(bal))
              .to.be.true;
            expect(await erc20.balanceOf(accounts[0].address)).equal(sellerBalance.add(action.payment));
          }
        break;
      default:
        return error("Unknown action " + action.action);
    }
    // Continue the computation after the promise.


    if(!action.succeed)
      await expect(promise, action.on_error).to.be.reverted;
    else
      await expect(promise, action.on_error).to.not.be.reverted;
    
    if (action.post && action.succeed) {
        await action.post(await erc20.balanceOf(account.address));
    }
    
    return await run_(nextBlock, nextIndex);
  }

    return await run_(1,0);

    it("creates a dutch auction", async function () {
      await run(accounts, {
        type:                "dutch",
        reservePrice:        500,
        biddingTimePeriod:   10,
        offerPriceDecrement: 25,
        actions: [
  
        ],
      });
    });
    it("ERC20 Permit Rejection due to invalid signature", async function(){
      const amount = 1000;
      const deadline = constants.MaxUint256;
      console.log(PayToken.address)
      const {v, r, s} = await getPermitSignature(
          owner,
          GCNMintToken,
          nftDutchAuctionToken.address,
          amount,
          deadline
      )
      await expect(PayToken.permit(owner.address, nftDutchAuctionToken.address, 200, deadline, v, r, s)).to.be.revertedWith("ERC20Permit: invalid signature");
  });

    it("Approving ERC20", async function(){
      const amount = 800;
      const deadline = constants.MaxUint256;
      
      console.log(PayToken.address)
      
      const {v, r, s} = await getPermitSignature(
          owner,
          PayToken,
          nftDutchAuctionToken.address,
          amount,
          deadline
      )
      await PayToken.permit(owner.address, nftDutchAuctionToken.address, amount, deadline, v, r, s);
}

it("rejects a low bid", async function () {
  await run(accounts ,  {
    type:                "dutch",
    reservePrice:        500,
    biddingTimePeriod:   10,
    offerPriceDecrement: 25,
    actions: [
      { block: 1, action: "bid", account: 1, payment: 450, succeed: false, on_error: "Low bid accepted" },
    ],
  });
});

it("accepts good bid", async function () {
  await run(accounts, {
    type:                "dutch",
    reservePrice:        500,
    biddingTimePeriod:   10,
    offerPriceDecrement: 25,
    actions: [
      { block: 1, action: "bid", account: 1, payment: 725, succeed: true, on_error: "Valid bid rejected" },
    ],
  });
});

it("rejects second bid", async function () {
  await run(accounts,  {
    type:                "dutch",
    reservePrice:        500,
    biddingTimePeriod:   10,
    offerPriceDecrement: 25,
    actions: [
      { block: 1, action: "bid", account: 1, payment: 725, succeed: true,  on_error: "Valid bid rejected" },
      { block: 2, action: "bid", account: 2, payment: 750, succeed: false, on_error: "Second bid accepted" },
    ],
  });
});

  it("ACCPET BID", async function () {
    await run(accounts,  {
      type:                "dutch",
      reservePrice:        500,
      biddingTimePeriod:   10,
      offerPriceDecrement: 25,
      actions: [
        { block: 1, action: "bid",      account: 1, payment: 725, succeed: true, on_error: "Valid bid accepted" },
      ],
    });
  });

  it("rejects a bid after the last round", async function () {
    await run(accounts, {
      type:                "dutch",
      reservePrice:        500,
      biddingTimePeriod:   10,
      offerPriceDecrement: 25,
      actions: [
        { block: 10, action: "bid", account: 1, payment: 750, succeed: false, on_error: "Invalid bid accepted" },
      ],
    });
  });

});


)}


