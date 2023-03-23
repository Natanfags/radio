import { Service } from "./service.js"
import { logger } from "./util.js";

export class Controller {
    constructor() {
        this.service = new Service()
    }

    async getFileStream(fileName) {
        return this.service.getFileStream(fileName)
    }

    async handleCommand({command}) {
        logger.info(`command received: ${command}`)
        const result = {
            result: 'ok'
        }
        const cmd = command.toLowerCase()
        if (cmd.includes('start')) {
            await this.service.startSreaming()
            return result
        }
        if (cmd.includes('stop')) {
            this.service.stopStreaming()
            return result
        }

        return result
    }

    createClientStream() {

        const {
            id,
            clientStream
        } = this.service.createClientStream()

        const onClose = () => {
            logger.info(`closing connection of ${id}`)
            this.service.removeClientStream(id)
        }

        return {
            stream: clientStream,
            onClose
        }
    }
}
