import { Controller } from "../../../server/controller.js";
import { Service } from "../../../server/service.js";
import TestUtil from "../_util/testUtil.js";
import { beforeEach, describe, expect, jest, test } from '@jest/globals'

describe('#Controller - test suite para controller', () => {
    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
    })

    test('getFileStream() - deve retornar uma fileStream', async () => {
        const controller = new Controller()
        const mockFileStream = TestUtil.generateReadableStream(['data'])
        const mockFileType = '.html'
        const mockFileName = 'test.html'

        const getFileStream = jest.spyOn(
            Service.prototype,
            Service.prototype.getFileStream.name
        ).mockResolvedValue({
            stream: mockFileStream,
            type: mockFileType
        });

        const x = await controller.getFileStream(mockFileName);

        expect(getFileStream).toBeCalledWith(mockFileName)
        expect(x).toStrictEqual({
            stream: mockFileStream,
            type: mockFileType
        })
    })

    test('createClientStream() - deve criar uma fileStream de client', async () => {
        const mockFileStream = TestUtil.generateReadableStream(['data'])
        const mockId = '1'
        const controller = new Controller()

        jest.spyOn(
            Service.prototype,
            Service.prototype.createClientStream.name
        ).mockReturnValue({
            id: mockId,
            clientStream: mockFileStream
        })

        jest.spyOn(
            Service.prototype,
            Service.prototype.removeClientStream.name
        ).mockReturnValue()

        const {
            stream,
            onClose
        } = controller.createClientStream()

        onClose()

        expect(stream).toStrictEqual(mockFileStream)
        expect(Service.prototype.removeClientStream).toHaveBeenCalledWith(mockId)
        expect(Service.prototype.createClientStream).toHaveBeenCalled()

    })

    describe('handler commands ', () => {
        test('comando stop', async () => {
            jest.spyOn(
                Service.prototype,
                Service.prototype.stopStreaming.name
            ).mockResolvedValue()

            const controller = new Controller()

            const data = {
                command: 'stop'
            }
            const result = await controller.handleCommand(data)
            expect(result).toStrictEqual({
                result: 'ok'
            })
            expect(Service.prototype.stopStreaming).toHaveBeenCalled()
        })

        test('comando start', async () => {
            jest.spyOn(
                Service.prototype,
                Service.prototype.startSreaming.name
            ).mockResolvedValue()

            const controller = new Controller()

            const data = {
                command: 'START'
            }
            const result = await controller.handleCommand(data)
            expect(result).toStrictEqual({
                result: 'ok'
            })
            expect(Service.prototype.startSreaming).toHaveBeenCalled()
        })

        test('comando desconhecido', async () => {
            jest.spyOn(
                Service.prototype,
                Service.prototype.startSreaming.name
            ).mockResolvedValue()

            const controller = new Controller()

            const data = {
                command: 'NAO EXISTENTE'
            }
            const result = await controller.handleCommand(data)
            expect(result).toStrictEqual({
                result: 'ok'
            })
            expect(Service.prototype.startSreaming).not.toHaveBeenCalled()
        })
    })
})
