import {Controller} from "../../../server/controller.js";
import {Service} from "../../../server/service.js";
import TestUtil from "../_util/testUtil.js";
import {beforeEach, describe, expect, jest, test} from '@jest/globals'

describe('#Controller - test suite para controller', () => {
    beforeEach(() => {
        jest.resetAllMocks()
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
})
