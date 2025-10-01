import { DecryptConfig, injectDecryptor } from "./decryptor"

type DecryptableClient = {
    fetch: Function
    fetchMany: Function
}

export function UseDecryptor(config: DecryptConfig) {
    return function <T extends { new(...args: any[]): any }>(BaseClass: T) {
        return class extends BaseClass {
            constructor(...args: any[]) {
                super(...args)
                const self = this as unknown as DecryptableClient
                return injectDecryptor(self, config)
            }
        }
    }
}
