import { DecryptableClient, DecryptConfig, injectDecryptor } from "./decryptor"

export function DecryptorClient<
    TBase extends new (...args: any[]) => any
>(
    BaseClass: TBase,
    config: DecryptConfig
) {
    return class extends BaseClass {
        constructor(...args: any[]) {
            super(...args)
            const self = this as unknown as DecryptableClient
            return injectDecryptor(self, config)
        }
    }
}