import {logger} from "./util.js";
import server from "./server.js";

server.listen(3000)
    .on('listening', () => logger.info('server is Running!'))

