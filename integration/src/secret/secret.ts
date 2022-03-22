import * as core from "@shapeshiftoss/hdwallet-core";

import tx_unsigned from "./tx01.mainnet.secret.json";
import tx_signed from "./tx01.mainnet.secret.signed.json";
import tx_verbose from "./tx01.mainnet.secret.verbose.json";

const MNEMONIC12_NOPIN_NOPASSPHRASE = "alcohol woman abuse must during monitor noble actual mixed trade anger aisle";

const TIMEOUT = 60 * 1000;

/**
 *  Main integration suite for testing SecretWallet implementations' Secret support.
 */
export function secretTests(get: () => { wallet: core.HDWallet; info: core.HDWalletInfo }): void {
  let wallet: core.SecretWallet & core.HDWallet;

  describe("Secret", () => {
    beforeAll(async () => {
      const { wallet: w } = get();
      if (core.supportsSecret(w)) wallet = w;
    });

    beforeEach(async () => {
      if (!wallet) return;
      await wallet.wipe();
      await wallet.loadDevice({
        mnemonic: MNEMONIC12_NOPIN_NOPASSPHRASE,
        label: "test",
        skipChecksum: true,
      });
    }, TIMEOUT);

    test(
      "secretGetAccountPaths()",
      () => {
        if (!wallet) return;
        const paths = wallet.secretGetAccountPaths({ accountIdx: 0 });
        expect(paths.length > 0).toBe(true);
        expect(paths[0].addressNList[0] > 0x80000000).toBe(true);
      },
      TIMEOUT
    );

    test.skip(
      "describePath() secret",
      async () => {
        if (!wallet) return;
        expect(
          wallet.describePath({
            path: core.bip32ToAddressNList("m/44'/529'/0'/0/0"),
            coin: "Secret",
          })
        );
      },
      TIMEOUT
    );

    test(
      "secretGetAddress()",
      async () => {
        if (!wallet) return;
        expect(
          await wallet.secretGetAddress({
            addressNList: core.bip32ToAddressNList("m/44'/529'/0'/0/0"),
            showDisplay: false,
            testnet: true,
          })
        ).toEqual("secret1vhtdhfmttwxlvu4ewueqt73tt8y9zv385fagty");
      },
      TIMEOUT
    );

    test(
      "secretSignTx()",
      async () => {
        if (!wallet) return;
        const input: core.SecretSignTx = {
          tx: tx_unsigned as any,
          addressNList: core.bip32ToAddressNList("m/44'/529'/0'/0/0"),
          chain_id: tx_verbose.accountInfo.chainId,
          account_number: String(tx_verbose.accountInfo.accountNumber),
          sequence: String(tx_verbose.accountInfo.sequence),
        };

        switch (wallet.getVendor()) {
          case "Native": {
            // eslint-disable-next-line jest/no-conditional-expect
            await expect(wallet.secretSignTx(input)).rejects.toThrowErrorMatchingInlineSnapshot(
              `"Cannot read properties of undefined (reading 'map')"`
            );
            break;
          }
          default: {
            const res = await wallet.secretSignTx(input);
            // eslint-disable-next-line jest/no-conditional-expect
            expect(res?.signatures[0]).toEqual(tx_signed.signatures[0].signature);
            break;
          }
        }
      },
      TIMEOUT
    );
  });
}
