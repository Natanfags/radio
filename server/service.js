import fs from 'fs'
import config from "./config.js"
import fsPromises from "fs/promises"
import {extname, join} from 'path'

const {
    dir: {
        publicDirectory
    }
} = config

export class Service {
    createFileStream(filename) {
        return fs.createReadStream(filename)
    }

    async getFileInfo(file) {
        // file = home / index.html
        // console.log('XXX', fullFilePath);
        const fullFilePath = join(publicDirectory, file)

        await fsPromises.access(fullFilePath)
        const fileType = extname(fullFilePath)
        return {
            type: fileType,
            name: fullFilePath
        }
    }

    async getFileStream(file) {

        const {
            name,
            type
        } = await this.getFileInfo(file)
        return {
            stream: this.createFileStream(name),
            type
        }
    }

}
