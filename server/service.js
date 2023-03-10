import fs from 'fs'
import config from "./config.js"
import fsPromises from "fs/promises"
import streamsPromises from 'stream/promises'
import {extname, join} from 'path'
import {randomUUID} from 'crypto'
import {PassThrough, Writable} from 'stream'
import Throttle from "throttle"
import childProcess from "child_process";
import {logger} from "./util.js";
import {once} from 'events'

const {
    dir: {
        publicDirectory
    },
    constants: {
        fallBackBitRate,
        englishConversation,
        bitRateDivisor
    }
} = config

export class Service {

    constructor() {
        this.clientStreams = new Map()
        this.currentSong = englishConversation
        this.currentBitRate = 0
        this.throttleTransform = {}
        this.currentReadable = {}
    }

    createClientStream() {
        const id = randomUUID()
        const clientStream = new PassThrough()
        this.clientStreams.set(id, clientStream)

        return {
            id,
            clientStream
        }

    }

    removeClientStream(id) {
        this.clientStreams.delete(id)
    }

    _executeSoxCommands(args) {
        return childProcess.spawn('sox', args)
    }

    async getBitRate(song) {
        try {
            const args = [
                '--i', //info
                '-B',
                song//bitrate
            ]

            const {
                stderr, //tudo que é erro
                stdout, //tudo que é log
                //stdin enviar dados como stream
            } = this._executeSoxCommands(args)

            await Promise.all([
                once(stderr, 'readable'),
                once(stdout, 'readable'),
            ])

            const [success, error] = [stdout, stderr].map(stream => stream.read())
            if (error) return await Promise.reject(error)

            return success
                .toString()
                .trim()
                .replace(/k/, '000')

        } catch (error) {
            logger.error(`deu ruim no bitrate: ${error}`)
            return fallBackBitRate
        }
    }


    broadcast() {
        return new Writable({
            write: (chunk, enc, cb) => {
                for (const [id, stream] of this.clientStreams) {
                    if (stream.writableEnded) {
                        this.clientStreams.delete(id)
                        continue;
                    }
                    stream.write(chunk)
                }

                cb()
            }
        })
    }

    async startSreaming() {
        logger.info(`start with ${this.currentSong}`)

        const bitRate = this.currentBitRate = (await this.getBitRate(this.currentSong)) / bitRateDivisor
        const throttleTransform = this.throttleTransform = new Throttle(bitRate)
        const songReadable = this.currentReadable = this.createFileStream(this.currentSong)

        return streamsPromises.pipeline(
            songReadable,
            throttleTransform,
            this.broadcast()
        );
    }

    stopStreaming() {
        this.throttleTransform?.end?.()
    }

    createFileStream(filename) {
        return fs.createReadStream(filename)
    }

    async getFileInfo(file) {

        const fullFilePath = join(publicDirectory, file)

        await fsPromises.access(fullFilePath)
        const fileType = extname(fullFilePath)
        return {
            type: fileType,
            name: fullFilePath
        }
    }

    async getFileStream(file) {

        const {name, type} = await this.getFileInfo(file)
        return {
            stream: this.createFileStream(name),
            type
        }
    }
}
