const { assert, expect, done } = require("chai")
const { network, ethers, getNamedAccounts, waffle } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging Tests", async function () {
          let deployer
          let fundMe
          const sendValue = ethers.utils.parseEther("0.05")
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async function () {
              const fundTx = await fundMe.fund({ value: sendValue })
              await fundTx.wait(1)

              const withdrawTx = await fundMe.withdraw()
              await withdrawTx.wait(1)

              let endingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )

              endingFundMeBalance = endingFundMeBalance.toString()
              console.log(endingFundMeBalance)
              console.log("here")
              expect(endingFundMeBalance).to.equal("0")
          })
      })
