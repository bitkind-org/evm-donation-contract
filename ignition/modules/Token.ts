import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockERC20Module = buildModule("MockERC20", (m) => {
  const token = m.contract("MockERC20", ["Bitkind", "BTK", BigInt(999_000_000) * BigInt(10 ** 18)]);
  return { token };
});

export default MockERC20Module;
