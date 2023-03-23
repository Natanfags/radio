import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { Service } from "../../../server/service.js";
import config from "../../../server/config.js";
import TestUtil from "../_util/testUtil.js";
import fsPromises from "fs/promises";
import fs from "fs";
import childProcess from 'child_process'
import streamsAsync from 'stream/promises'
import stream from 'stream'
import Throttle from 'throttle'

const {
    PassThrough,
    Writable,
} = stream

const {
    dir: {
        fxDirectory,
        publicDirectory
    },
    constants: {
        fallBackBitRate,
        bitRateDivisor
    }
} = config

describe('#Service - teste suite para o service', () => {

    const getSpawnResponse = ({
                                  stdout = '',
                                  stderr = '',
                                  stdin = () => {
                                  }
                              }) => ({
        stdout: TestUtil.generateReadableStream([stdout]),
        stderr: TestUtil.generateReadableStream([stderr]),
        stdin: TestUtil.generateReadableStream([stdin()])
    })

    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
    })

    test('getFileInfo() - deve retornar o a info de file', async () => {

        jest.spyOn(
            fsPromises,
            fsPromises.access.name
        ).mockResolvedValue()

        const currentFile = 'mySong.mp3'
        const service = new Service()
        const result = await service.getFileInfo(currentFile);

        const expectedResult = {
            type: '.mp3',
            name: `${publicDirectory}/${currentFile}`
        }

        expect(result).toStrictEqual(expectedResult)

    })

    test('getFileStream() - deve retornaro o arquivo como stream', async () => {

        const mockFileStream = TestUtil.generateReadableStream(['data'])
        const currentFile = 'mySong.mp3'
        const fullPathFile = `${publicDirectory}/${currentFile}`

        const fileInfo = {
            type: '.mp3',
            name: fullPathFile
        }

        const service = new Service()

        jest.spyOn(
            service,
            service.getFileInfo.name
        ).mockResolvedValue(fileInfo)

        jest.spyOn(
            service,
            service.createFileStream.name
        ).mockReturnValue(mockFileStream)

        const result = await service.getFileStream(currentFile)
        const expectedResult = {
            type: fileInfo.type,
            stream: mockFileStream
        }

        expect(result).toStrictEqual(expectedResult)
        expect(service.createFileStream).toHaveBeenCalledWith(fileInfo.name)
        expect(service.getFileInfo).toHaveBeenCalledWith(currentFile)
    })

    test('createFileStream() - deve criar a stream e retornar', async () => {

        const mockFileStream = TestUtil.generateReadableStream(['data'])

        jest.spyOn(
            fs, fs.createReadStream.name
        ).mockReturnValue(mockFileStream)

        const service = new Service()
        const file = 'file.mp3'
        const result = service.createFileStream(file)

        expect(result).toStrictEqual(mockFileStream)
        expect(fs.createReadStream).toHaveBeenCalledWith(file)
    })

    test('removeClientStream() - deve remover a stream client', () => {
        const service = new Service()
        jest.spyOn(
            service.clientStreams,
            service.clientStreams.delete.name
        ).mockReturnValue()

        const mockId = '1'

        service.removeClientStream(mockId)

        expect(service.clientStreams.delete).toHaveBeenCalledWith(mockId)
    })

    test('createClientStream - deve criar o client stream ', () => {
        const service = new Service()
        jest.spyOn(
            service.clientStreams,
            service.clientStreams.set.name
        ).mockReturnValue()

        const {
            id,
            clientStream
        } = service.createClientStream()

        expect(id.length).toBeGreaterThan(0)
        expect(clientStream).toBeInstanceOf(PassThrough)
        expect(service.clientStreams.set).toHaveBeenCalledWith(id, clientStream)
    })

    test('#stopStreaming - existing throttleTransform', () => {
        const service = new Service()
        service.throttleTransform = new Throttle(1)

        jest.spyOn(
            service.throttleTransform,
            "end",
        ).mockReturnValue()

        service.stopStreaming()
        expect(service.throttleTransform.end).toHaveBeenCalled()
    })

    test('#stopStreaming - non existing throttleTransform', () => {
        const service = new Service()
        expect(() => service.stopStreaming()).not.toThrow()
    })

    test('#broadCast - it should write only for active client streams', () => {
        const service = new Service()
        const onData = jest.fn()
        const client1 = TestUtil.generateWritableStream(onData)
        const client2 = TestUtil.generateWritableStream(onData)
        jest.spyOn(
            service.clientStreams,
            service.clientStreams.delete.name
        )

        service.clientStreams.set('1', client1)
        service.clientStreams.set('2', client2)
        client2.end()

        const writable = service.broadcast()
        // vai mandar somente para o client1 pq o outro desconectou
        writable.write('Hello World')

        expect(writable).toBeInstanceOf(Writable)
        expect(service.clientStreams.delete).toHaveBeenCalled()
        expect(onData).toHaveBeenCalledTimes(1)
    })

    test('#getBitRate - it should return the bitRate as string', async () => {
        const song = 'mySong'
        const service = new Service()

        const spawnResponse = getSpawnResponse({
            stdout: '  1k  '
        })
        jest.spyOn(
            service,
            service._executeSoxCommands.name
        ).mockReturnValue(spawnResponse)

        const bitRatePromise = service.getBitRate(song)

        const result = await bitRatePromise
        expect(result).toStrictEqual('1000')
        expect(service._executeSoxCommands).toHaveBeenCalledWith(['--i', '-B', song])
    })

    test('#getBitRate - when an error ocurr it should get the fallbackBitRate', async () => {
        const song = 'mySong'
        const service = new Service()

        const spawnResponse = getSpawnResponse({
            stderr: 'error!'
        })
        jest.spyOn(
            service,
            service._executeSoxCommands.name
        ).mockReturnValue(spawnResponse)

        const bitRatePromise = service.getBitRate(song)

        const result = await bitRatePromise
        expect(result).toStrictEqual(fallBackBitRate)
        expect(service._executeSoxCommands).toHaveBeenCalledWith(['--i', '-B', song])
    })

    test('#_executeSoxCommands - it should call the sox command', async () => {
        const service = new Service()
        const spawnResponse = getSpawnResponse({
            stdout: '1k'
        })
        jest.spyOn(
            childProcess,
            childProcess.spawn.name
        ).mockReturnValue(spawnResponse)

        const args = ['myArgs']
        const result = service._executeSoxCommands(args)
        expect(childProcess.spawn).toHaveBeenCalledWith('sox', args)
        expect(result).toStrictEqual(spawnResponse)
    })

    test('#startSreaming - it should call the sox command', async () => {
        const currentSong = 'mySong.mp3'
        const service = new Service()
        service.currentSong = currentSong
        const currentReadable = TestUtil.generateReadableStream(['abc'])
        const expectedResult = 'ok'
        const writableBroadCaster = TestUtil.generateWritableStream(() => {
        })

        jest.spyOn(
            service,
            service.getBitRate.name
        ).mockResolvedValue(fallBackBitRate)

        jest.spyOn(
            streamsAsync,
            streamsAsync.pipeline.name
        ).mockResolvedValue(expectedResult)

        jest.spyOn(
            fs,
            fs.createReadStream.name
        ).mockReturnValue(currentReadable)

        jest.spyOn(
            service,
            service.broadcast.name
        ).mockReturnValue(writableBroadCaster)

        const expectedThrottle = fallBackBitRate / bitRateDivisor
        const result = await service.startSreaming()

        expect(service.currentBitRate).toEqual(expectedThrottle)
        expect(result).toEqual(expectedResult)

        expect(service.getBitRate).toHaveBeenCalledWith(currentSong)
        expect(fs.createReadStream).toHaveBeenCalledWith(currentSong)
        expect(streamsAsync.pipeline).toHaveBeenCalledWith(
            currentReadable,
            service.throttleTransform,
            service.broadcast()
        )

    })
})
