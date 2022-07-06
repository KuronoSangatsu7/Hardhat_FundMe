const { expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe, deployer, mockV3Aggregator
          const sendValue = ethers.utils.parseEther("0.086")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  expect(response).to.equal(mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith("too low")
              })

              it("updated the amount funded mapping", async function () {
                  await fundMe.fund({ value: sendValue })

                  const response = await fundMe.getAddressToAmount(deployer)
                  //const reponseValue = response.toString()
                  const reponseValue = ethers.utils.formatUnits(response, "wei")

                  expect(sendValue).to.equal(reponseValue)
              })

              it("adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunder(0)

                  expect(response).to.equal(deployer)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single funder", async function () {
                  // Arrange

                  //Could also use ethers.provider same thing doesnt matter
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  expect(endingFundMeBalance).to.equal(0)
                  expect(
                      endingDeployerBalance.add(gasCost).toString()
                  ).to.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  )
              })

              it("allows to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()

                  for (let account of accounts) {
                      const fundMeConnectedContract = await fundMe.connect(
                          account
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  expect(endingFundMeBalance).to.equal(0)
                  expect(
                      endingDeployerBalance.add(gasCost).toString()
                  ).to.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  )
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let account of accounts) {
                      expect(
                          await fundMe.getAddressToAmount(account.address)
                      ).to.equal(0)
                  }
              })

              it("only allows owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const notOwnerConnectedContract = await fundMe.connect(
                      accounts[1]
                  )

                  await expect(
                      notOwnerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
          })
      })
