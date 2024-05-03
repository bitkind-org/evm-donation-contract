import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DonationModule = buildModule("Donation", (m) => {
  const token = m.contract("Token", [21000000000000000000000000n]);
  const donation = m.contract("Donation", [], {
    after: [token]
  });
  return { donation };
});

export default DonationModule;
