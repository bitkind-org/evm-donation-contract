import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenModule = buildModule("Token", (m) => {
  const token = m.contract("Token", ["Bitkind", "BTK", BigInt(999_000_000) * BigInt(10 ** 18)]);
  return { token };
});

export default TokenModule;
