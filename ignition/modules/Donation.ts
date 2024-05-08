import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DonationModule = buildModule("Donation", (m) => {
  const donation = m.contract("Donation", []);
  return { donation };
});

export default DonationModule;
