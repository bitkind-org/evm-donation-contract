import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenModule = buildModule("Token", (m) => {
  const token = m.contract("Token", [21000000000000000000000000n]);
  return { token };
});

export default TokenModule;
