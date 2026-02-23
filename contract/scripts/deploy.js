async function main() {
  const market = await ethers.deployContract("Updated");
  await market.waitForDeployment();
  console.log(`Marketplace deployed to: ${market.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



