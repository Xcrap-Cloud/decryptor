import { HttpResponse, HttpClientFetchOptions, HttpFetchManyOptions, HttpClient } from "@xcrap/core"
import * as crypto from "node:crypto"

export type DecryptConfig = {
    inputEncoding: BufferEncoding
    outputEncoding: BufferEncoding
    algorithm: string
    key: { encoding: BufferEncoding, value: string }
    iv: { encoding: BufferEncoding, value: string }
}

export type DecryptableClient = {
    fetch: Function
    fetchMany: Function
}

const decryptBody = (
    encryptedText: string,
    config: DecryptConfig
): string => {
    const encryptedBuffer = Buffer.from(encryptedText, config.inputEncoding)

    const decipher = crypto.createDecipheriv(
        config.algorithm,
        Buffer.from(config.key.value, config.key.encoding),
        Buffer.from(config.iv.value, config.iv.encoding)
    )

    let decrypted = decipher.update(encryptedBuffer)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString(config.outputEncoding as BufferEncoding)
}

export function injectDecryptor<T extends { fetch: Function, fetchMany: Function }>(
    ClientInstance: T,
    decryptConfig: DecryptConfig
): T {
    const wrapper = Object.create(
        Object.getPrototypeOf(ClientInstance)
    ) as T

    Object.assign(wrapper, ClientInstance)

    wrapper.fetch = async function (options: HttpClientFetchOptions): Promise<HttpResponse> {
        const response: HttpResponse = await ClientInstance.fetch(options)

        if (response.status >= 200 && response.status < 300 && response.body) {
            const decryptedBody = decryptBody(response.text, decryptConfig)
            return new HttpResponse({ ...response, body: decryptedBody })
        }

        return response
    }

    wrapper.fetchMany = async function (options: HttpFetchManyOptions): Promise<HttpResponse[]> {
        const responses: HttpResponse[] = await ClientInstance.fetchMany(options)

        return responses.map(response => {
            if (response.status >= 200 && response.status < 300 && response.body) {
                const decryptedBody = decryptBody(response.text, decryptConfig)
                return new HttpResponse({ ...response, body: decryptedBody })
            }

            return response
        })
    }

    return wrapper
}

export function decryptResponse(
    response: HttpResponse,
    config: DecryptConfig
): HttpResponse {
    if (response.status >= 200 && response.status < 300 && response.body) {
        const decryptedBody = decryptBody(response.text, config)
        return new HttpResponse({ ...response, body: decryptedBody })
    }

    return response
}

