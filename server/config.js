import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const root = join(currentDir, '../')
const audioDirectory = join(root, 'audio')
const publicDirectory = join(root, 'public')

export default {
    port: process.env.PORT || 3000,
    dir: {
        root,
        publicDirectory,
        audioDirectory,
        songDirectory: join(audioDirectory, 'songs'),
        fxDirectory: join(audioDirectory, 'fx')
    },
    pages: {
        homeHTMl: 'home/index.html',
        controllerHTMl: 'controller/index.html',
    },
    location: {
        home: '/home'
    }
}
