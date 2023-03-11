import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {Service} from "../../../server/service.js";
import config from "../../../server/config.js";
import TestUtil from "../_util/testUtil.js";
import fsPromises from "fs/promises";
import fs from "fs";

const {
    dir: {
        publicDirectory
    }
} = config

describe('#Service - teste suite para o service', () => {
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
})
